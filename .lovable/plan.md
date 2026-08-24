# Style Guide 预览：加载一次后不再卸载

## 现象与原因

不是加载 bug，是刻意的「窗口化」策略：`src/pages/StyleGuide/components/DeviceFrame.tsx` 里有两个 IntersectionObserver——
- `near`（rootMargin 300px）：接近视口时 `setMounted(true)`，挂载 iframe；
- `far`（rootMargin 1600px）：离开视口超过 1600px 时 `setMounted(false)`，**销毁 iframe 文档**。

所以上下滚动幅度大时，已加载好的模块会被卸载，回滚时重新 boot 一次，看起来就是「反复加载」。

## 改法

改成 **mount-once**：加载过就一直保留，只有刷新页面才重来。

- 删除 `far` observer 与其卸载逻辑，`mounted` 只做 false → true 的单向切换。
- `near` observer 在触发挂载后即 `disconnect()`，不再持续观察。
- 保留高度上报（postMessage）与占位骨架逻辑不变。

## 性能：展示方案整体重做（一节一 iframe）

只做 mount-once 不够——真正的成本是 **iframe 数量**：Portfolio 一节就有 10+ 个 iframe，每个都是一个独立 React root + 独立 HTTP 文档 + 独立 chunk 解析。常驻不卸载只是把「反复 boot」换成「一次性 boot 很多个」，首次滚过去依然卡。

重做方案：**iframe 的粒度从「一个 case」提升到「一个 section × 一种设备」**。

- 新增批量预览路由参数：`/style-guide/preview?c=key1,key2,key3&labels=...`，在同一个文档里按顺序纵向渲染多个 case，每个 case 上方带一条小标题分隔线。一个 React root 承载整节内容。
- 新增 `SectionFrame`（与现有 `DeviceFrame` 同目录）：接收一组 `{ key, label }` 与设备（desktop / mobile 375），渲染**一个** iframe，沿用现有 postMessage 高度上报。
- Portfolio 一节由 10+ iframe 降到 **2 个**（desktop 一个、mobile 一个），或在同一 section 内用设备切换器只保留 1 个。全站 iframe 数量下降一个数量级。
- 保留 mount-once：`near` 300px 挂载后 `disconnect()`，删除 `far` 卸载逻辑。数量降下来之后，常驻不再是问题。
- 保留 iframe 隔离本身——它仍是 `md:` 断点为真的唯一手段；同 chunk 的 case 现在天然共享一次模块求值。

迁移策略：`DeviceFrame` / `DualDevicePreview` 保留不动（其他章节仍在用），先只把 Portfolio 这一节切到 `SectionFrame` 验证效果，确认后再逐节迁移。


## 技术改动清单

- `src/pages/StyleGuide/components/DeviceFrame.tsx` — 唯一改动文件；只改挂载/卸载策略，不动 iframe 隔离机制、不动 registry、不动任何 preview 内容。
