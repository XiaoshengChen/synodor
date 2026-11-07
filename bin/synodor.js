#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { exportMpegV, planPlayback } from "../src/index.js";

const usage = [
  "synodor play <request.json> <catalog.json> <device.json>",
  "synodor export <request.json> <catalog.json>"
].join("\n");

async function readJson(path) {
  const text = await readFile(path, "utf8");
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}: ${error.message}`);
  }
}

async function main([command, ...paths]) {
  if (command === "--help" || command === "-h") {
    console.log(usage);
    return;
  }
  const expected = { play: 3, export: 2 };
  if (!Object.hasOwn(expected, command) || expected[command] !== paths.length) {
    throw new Error(usage);
  }
  const [request, catalog, device] = await Promise.all(paths.map(readJson));
  const result = command === "play"
    ? planPlayback(request, catalog, device)
    : exportMpegV(request, catalog);
  console.log(JSON.stringify(result, null, 2));
}

main(process.argv.slice(2)).catch(error => {
  console.error(JSON.stringify({ status: "invalid", message: error.message }));
  process.exitCode = 2;
});
