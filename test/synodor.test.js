import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { planPlayback, exportMpegV } from "../src/index.js";

const root = new URL("../", import.meta.url);
const fixture = name => JSON.parse(readFileSync(new URL(`examples/${name}.json`, root), "utf8"));
const catalog = fixture("catalog");
const product = fixture("product");
const sample = fixture("classification");
const device = fixture("device");

test("one SKU resolves to different slots on two devices", () => {
  assert.deepEqual(planPlayback(product, catalog, device), {
    status: "ready", scentId: "demo:perfume-017", device: "simulator-a", slot: "slot-2"
  });
  assert.equal(planPlayback(product, catalog, fixture("device-b")).slot, "port-7");
});

test("a generic floral cartridge cannot substitute for a perfume", () => {
  const other = { ...device, slots: { only: "demo:lilac" } };
  assert.deepEqual(planPlayback(product, catalog, other), {
    status: "unsupported", device: "simulator-a", scentId: "demo:perfume-017"
  });
});

test("classifier labels are scoped to an exact model version", () => {
  assert.equal(planPlayback(sample, catalog, device).slot, "slot-1");
  for (const request of [fixture("unknown"), { ...sample, model: "demo-nose.v2" },
    { ...sample, label: "coffee" }, { ...product, sku: "absent" }]) {
    assert.deepEqual(planPlayback(request, catalog, device), { status: "unknown" });
    assert.deepEqual(exportMpegV(request, catalog), { status: "unknown" });
  }
});

test("export is independent of device capability and uses the lilac term", () => {
  const result = exportMpegV(sample, catalog);
  assert.equal(result.status, "exported");
  assert.equal(result.scentId, "demo:lilac");
  assert.equal(result.xml + "\n", readFileSync(new URL("examples/lilac.xml", root), "utf8"));
  assert.deepEqual(exportMpegV(product, catalog), { status: "unmapped", scentId: "demo:perfume-017" });
});

test("a duplicate cartridge choice is stable across input key order", () => {
  const slots = { z: "demo:lilac", a: "demo:lilac" };
  assert.equal(planPlayback(sample, catalog, { ...device, slots }).slot, "a");
});

test("raw readings, extra fields, blank IDs and unknown schema versions are rejected", () => {
  for (const input of [{ version: 1, resistance: 10 }, { ...product, raw: 1 },
    { ...product, sku: "" }, { ...product, version: 2 }]) {
    assert.throws(() => planPlayback(input, catalog, device), /Invalid request/);
  }
  assert.throws(() => planPlayback(product, catalog, { ...device, slots: [] }), /Invalid device/);
  assert.throws(() => exportMpegV(sample, { ...catalog, mpegV: { x: "unverified" } }), /Invalid catalog/);
});

test("lookup uses only own catalog properties", () => {
  assert.deepEqual(planPlayback({ ...product, sku: "constructor" }, catalog, device), { status: "unknown" });
});

const cli = (...args) => spawnSync(process.execPath, ["bin/synodor.js", ...args], {
  cwd: fileURLToPath(root), encoding: "utf8"
});

test("CLI returns valid JSON for a request the device cannot fulfill", () => {
  const run = cli("play", "examples/classification.json", "examples/catalog.json", "examples/device-b.json");
  assert.equal(run.status, 0);
  assert.equal(JSON.parse(run.stdout).status, "unsupported");
  assert.equal(run.stderr, "");
});

test("CLI export exposes the same XML as the library", () => {
  const run = cli("export", "examples/classification.json", "examples/catalog.json");
  assert.equal(run.status, 0);
  assert.deepEqual(JSON.parse(run.stdout), exportMpegV(sample, catalog));
});

test("invalid file and wrong arity return machine-readable errors", () => {
  for (const args of [["export"], ["export", "missing.json", "examples/catalog.json"],
    ["export", "LICENSE", "examples/catalog.json"]]) {
    const run = cli(...args);
    assert.equal(run.status, 2);
    assert.equal(run.stdout, "");
    assert.equal(JSON.parse(run.stderr).status, "invalid");
  }
});
