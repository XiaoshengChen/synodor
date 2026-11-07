import { createRequire } from "node:module";
import Ajv from "ajv";

const require = createRequire(import.meta.url);
const ajv = new Ajv({ ownProperties: true });
const validators = Object.fromEntries(
  ["request", "catalog", "device"].map(name => [
    name, ajv.compile(require(`../schemas/${name}.v1.json`))
  ])
);

function validate(name, value) {
  const check = validators[name];
  if (!check(value)) {
    throw new TypeError(`Invalid ${name}: ${ajv.errorsText(check.errors, { separator: ", " })}`);
  }
}

function lookup(table, key) {
  return table && Object.hasOwn(table, key) ? table[key] : undefined;
}

function resolve(request, catalog) {
  validate("request", request);
  validate("catalog", catalog);
  if (request.kind === "product") return lookup(catalog.products, request.sku);
  if (request.label === null) return undefined;
  return lookup(lookup(catalog.classifiers, request.model), request.label);
}

export function planPlayback(request, catalog, device) {
  const scentId = resolve(request, catalog);
  validate("device", device);
  if (!scentId) return { status: "unknown" };

  // Slot names are vendor-defined. Sort by identifier for a stable choice
  // when multiple loaded cartridges hold the identical material.
  const slot = Object.keys(device.slots).sort().find(key => device.slots[key] === scentId);
  if (!slot) return { status: "unsupported", scentId, device: device.device };
  return { status: "ready", scentId, device: device.device, slot };
}

export function exportMpegV(request, catalog) {
  const scentId = resolve(request, catalog);
  if (!scentId) return { status: "unknown" };
  const term = lookup(catalog.mpegV, scentId);
  if (!term) return { status: "unmapped", scentId };

  // The v1 catalog schema allowlists the one term verified for this profile.
  // Local SKU, device and slot strings never enter the XML.
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sedl:SEM xmlns:sedl="urn:mpeg:mpeg-v:2010:01-SEDL-NS"',
    '          xmlns:sev="urn:mpeg:mpeg-v:2010:01-SEV-NS"',
    '          xmlns:si="urn:mpeg:mpeg21:2003:01-DIA-XSI-NS"',
    '          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    `  <sedl:Effect xsi:type="sev:ScentType" scent="urn:mpeg:mpeg-v:01-SI-ScentCS-NS:${term}" si:pts="0"/>`,
    '</sedl:SEM>'
  ].join("\n");
  return { status: "exported", scentId, xml };
}
