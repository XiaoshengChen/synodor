# SynOdor

**English** · [简体中文](README.zh-CN.md)

**SynOdor is an open-source translator that turns scent recognition results into playback requests for scent devices.**

An electronic nose reports a label such as `lilac`. SynOdor looks up that label for the specific model, resolves it to a scent ID, and checks what the target device can play. Your app or AI agent gets a JSON plan naming the device and slot to pass to its driver. An unknown label returns `unknown`. A recognized scent the device cannot play returns `unsupported`.

**v0.1.0 · MIT · Node.js 22+ · Runs offline.**

## Demo: perfume preview

A user taps a perfume to sample it. The product ID supplies the scent identity directly, so this app can use the same playback logic without an electronic nose. Try the same request on two simulated devices with different slot layouts.

```sh
git clone https://github.com/XiaoshengChen/synodor.git
cd synodor
npm ci --ignore-scripts
node bin/synodor.js play examples/product.json examples/catalog.json examples/device.json
```

```json
{ "status": "ready", "scentId": "demo:perfume-017", "device": "simulator-a", "slot": "slot-2" }
```

The catalog binds SKU `perfume-017` to a specific sample. Swap the last argument for `examples/device-b.json` and the same request selects `port-7`. An app can hand a ready plan to a vendor driver after checking the loaded inventory is still current. The CLI only prints a plan.

## Integrate in JavaScript

Install directly from the tagged GitHub source in your Node.js application:

```sh
npm install github:XiaoshengChen/synodor#v0.1.0
```

```js
import { planPlayback, exportMpegV } from "@xiaoshengchen/synodor";

const request = { version: 1, kind: "product", sku: "perfume-017" };
const catalog = {
  version: 1, products: { "perfume-017": "brand:sample-017" },
  classifiers: {}, mpegV: {}
};
const device = {
  version: 1, device: "my-wearable", slots: { "port-7": "brand:sample-017" }
};
const plan = planPlayback(request, catalog, device);
// { status: "ready", scentId: "brand:sample-017", device: "my-wearable", slot: "port-7" }
const metadata = exportMpegV(request, catalog);
// { status: "unmapped", scentId: "brand:sample-017" }
```

Each manufacturer or merchant owns its scent IDs and their meaning. Use a stable issuer prefix and a distinct ID for each material or formulation. The example above intentionally gives a perfume its own identity. A shared floral note cannot establish that two cartridges contain the same perfume.

## Connect an electronic nose

Your local classifier supplies its model/version ID and its predicted label. The integration decides when to abstain and sends `label: null` for an uncertain or unfamiliar sample. Raw resistance, voltages and VOC indices need device-specific calibration and classification upstream. SynOdor performs exact, case-sensitive lookup.

```sh
node bin/synodor.js play examples/classification.json examples/catalog.json examples/device.json
node bin/synodor.js play examples/classification.json examples/catalog.json examples/device-b.json
node bin/synodor.js play examples/unknown.json examples/catalog.json examples/device.json
node bin/synodor.js export examples/classification.json examples/catalog.json
npm test
```

In order, the four CLI calls return `ready` for the lilac cartridge, `unsupported` for the device without it, `unknown` for the abstention, and `exported` with the XML string. Inspect the [input fixtures](examples/), [expected XML](examples/lilac.xml) and [executable examples](test/synodor.test.js).

## Contract for integrations

| Input file | Fields owned by the integrator |
| --- | --- |
| [Request](schemas/request.v1.json) | A SKU, or a model ID plus a label or explicit abstention. Use a new model ID when calibration or label meaning changes. |
| [Catalog](schemas/catalog.v1.json) | `products` maps SKU to scent ID. `classifiers` maps model ID, then label, to scent ID. `mpegV` holds explicit scent ID to standard term mappings. Empty maps are valid. |
| [Device](schemas/device.v1.json) | Device ID and current slot-to-scent assignments. Omit unloaded slots. When identical material occupies multiple slots, the first slot in identifier sort order wins. |

| Status | Caller action |
| --- | --- |
| `ready` | Use the returned device and slot with your own driver. |
| `unknown` | No recognized input identity. Skip playback. |
| `unsupported` | Known scent, no matching loaded cartridge. Show that the sample is unavailable. |
| `exported` | Read the `xml` string from the JSON response. |
| `unmapped` | Retain the local scent ID. This catalog supplies no supported standard term. |
| `invalid` | Correct the input file, schema version or arguments. |

The CLI writes one JSON result to stdout and exits 0 for valid requests, including domain misses. Input and usage errors go to stderr as JSON with exit code 2. The JavaScript API throws `TypeError` for schema violations. Playback planning and metadata export are independent.

## MPEG-V coverage and evidence

The exporter supports one allowlisted ScentCS term, `lilac`, at presentation time zero, using the `2010` SEDL/SEV namespaces in ISO's public reference XSDs. The sample passes structural validation with those XSDs. The 2019 Part 3 attachment uses different namespace identifiers. Full edition conformance, perceived smell, intensity and physical delivery remain outside this test. [Reference schemas](https://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-V_schema_files/) · [Part 3, edition 4 attachment](https://standards.iso.org/iso-iec/23005/-3/ed-4/en/)

Maintainers can repeat the optional reference check with Python 3, `lxml` and internet access by running `python scripts/check-mpegv.py examples/lilac.xml`. The unit suite compares the actual export to that file offline.

**Data provenance.** Sample SKUs, model labels, cartridge assignments and requests are hand-authored fixtures. The repository includes no measured sensor traces or product-to-scent calibration. The [research notes](docs/evidence.md) link the original studies, including their limitations. Published observations do not populate the playback catalog.

## Commercial use

The [MIT License](LICENSE) permits use, modification, sublicensing and sale, including integration into closed-source applications. Include the copyright and permission notice in copies or substantial portions. Original code, documentation and synthetic fixtures in this repository use MIT. Third-party papers, standards, dependencies, commercial formulas and device SDKs retain their own terms.
