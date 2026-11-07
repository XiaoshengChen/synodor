# SynOdor

[English](README.md) · **简体中文**

**SynOdor 是一个开源翻译器，把气味识别结果转成终端播放请求。**

电子鼻识别出“丁香”（`lilac`）。SynOdor 按模型查到这个标签对应的气味 ID，再核对目标终端能播放哪些气味。应用或 AI agent 会拿到一份 JSON 播放计划，里面的设备和槽位可以直接交给驱动。遇到陌生标签，返回 `unknown`。气味已知但终端播不了，返回 `unsupported`。

**v0.1.0 · MIT · Node.js 22+ · 离线运行**

## Demo：点击试香

用户点选一款香水，商品 ID 就能确定要试闻的样品，应用可以直接复用同一套播放逻辑。下面用两台槽位布局不同的模拟设备，跑同一个试香请求。

```sh
git clone https://github.com/XiaoshengChen/synodor.git
cd synodor
npm ci --ignore-scripts
node bin/synodor.js play examples/product.json examples/catalog.json examples/device.json
```

```json
{ "status": "ready", "scentId": "demo:perfume-017", "device": "simulator-a", "slot": "slot-2" }
```

示例用商品编号 `perfume-017` 标识一款具体样品。把命令的最后一个参数换成 `examples/device-b.json`，返回的槽位就变成 `port-7`。CLI 输出播放计划。接入实机时，应用应在执行前确认香芯仍在位，再将计划交给厂商驱动。

## 接入 JavaScript 应用

从 GitHub 安装指定版本：

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

厂商或商家负责定义自己的气味 ID。建议使用稳定的命名空间前缀，并为每种材料或配方分配独立 ID。两款香水都带花香调，仍需各自的样品标识，才能保证用户选中哪款就匹配哪款。

## 接入电子鼻

本地分类器提供模型版本 ID 和预测标签。遇到不确定或陌生的样本，传入 `label: null`。原始电阻、电压和 VOC 指数需要先经过针对具体设备的校准和分类，SynOdor 再对模型 ID 和标签做区分大小写的精确匹配。

```sh
node bin/synodor.js play examples/classification.json examples/catalog.json examples/device.json
node bin/synodor.js play examples/classification.json examples/catalog.json examples/device-b.json
node bin/synodor.js play examples/unknown.json examples/catalog.json examples/device.json
node bin/synodor.js export examples/classification.json examples/catalog.json
npm test
```

前四条命令依次返回 `ready`（找到丁香香芯）、`unsupported`（设备没装丁香）、`unknown`（分类器无法识别）和 `exported`（结果包含 XML 字符串）。最后一条运行测试。[输入示例](examples/) · [预期 XML](examples/lilac.xml) · [测试用例](test/synodor.test.js)

## 输入与返回值

| 输入文件 | 接入方提供的内容 |
| --- | --- |
| [请求 Request](schemas/request.v1.json) | 商品 SKU，或模型 ID 加分类标签。分类器可以显式传入空标签。校准方式或标签含义发生变化时，使用新的模型 ID。 |
| [映射目录 Catalog](schemas/catalog.v1.json) | `products` 将 SKU 映射到气味 ID。`classifiers` 按模型 ID 和标签查找气味 ID。`mpegV` 记录气味 ID 与标准词条的明确对应关系。三张表均可为空。 |
| [设备 Device](schemas/device.v1.json) | 设备 ID 和已装载的槽位与气味 ID 对照表。空槽省略。同一材料占用多个槽时，按槽位标识排序，选择第一项。 |

| 状态 | 应用怎么处理 |
| --- | --- |
| `ready` | 将返回的设备 ID 和槽位交给对应驱动。 |
| `unknown` | 无法确定输入对应哪种气味，跳过播放。 |
| `unsupported` | 气味已知，设备缺少匹配香芯，提示该样品暂不可试。 |
| `exported` | 从 JSON 响应的 `xml` 字段读取导出结果。 |
| `unmapped` | 保留本地气味 ID。该目录没有为它配置受支持的标准词条。 |
| `invalid` | 检查输入文件、Schema 版本或命令参数。 |

有效请求都会向标准输出写入一条 JSON 结果，并以退出码 0 结束，包括未命中和缺香芯的情况。输入或用法错误会向标准错误写入 JSON，退出码为 2。JavaScript API 遇到 Schema 校验错误时抛出 `TypeError`。播放计划和标准导出可以独立调用。

## MPEG-V 支持范围与证据

当前支持一个 ScentCS 词条 `lilac`（丁香），效果起始时间为零，使用 ISO 公开参考 XSD 的 `2010` 版 SEDL/SEV 命名空间。示例 XML 已通过这组 XSD 的结构校验。2019 年第四版 Part 3 附件使用另一组命名空间。本次校验只覆盖示例 XML 的结构；完整标准一致性、实际闻感、强度和硬件释放效果还需分别验证。[ISO 参考 XSD](https://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-V_schema_files/) · [Part 3 第四版附件](https://standards.iso.org/iso-iec/23005/-3/ed-4/en/)

如需复核，安装 Python 3 和 `lxml`，联网运行 `python scripts/check-mpegv.py examples/lilac.xml`。常规单元测试会在离线状态下比对实际导出与预期文件。

**数据来源。** 示例 SKU、分类标签、香芯分配和请求均为人工编写的测试数据。目前没有实测传感器轨迹或商品气味标定数据。论文中的观察仅用于解释设计依据。各项研究的原文、结论和局限见[研究笔记](docs/evidence.md)。

## 商业使用

SynOdor 的原创代码、文档和模拟数据采用 MIT 许可，可修改、再许可、销售，也可集成到闭源商业应用中。分发软件副本或其中的实质部分时，须保留版权与许可声明。第三方论文、标准、依赖、商业配方和设备 SDK 各自遵循原有条款。[MIT License 原文](LICENSE)
