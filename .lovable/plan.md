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

## 关于性能

上一轮已把 registry 改成按 key 动态 import，每个 iframe 只拉自己那组 chunk，同组共享缓存；`near` 300px 也限制了并发冷启。因此取消卸载后，常驻 iframe 只是空闲 React root，滚动开销可接受，换来的是不再重复 boot。

如果之后发现整页常驻 iframe 过多导致内存压力，再考虑「卸载但保留已测高度 + 仅对超远距离的 section 生效」的折中，本轮不做。

## 技术改动清单

- `src/pages/StyleGuide/components/DeviceFrame.tsx` — 唯一改动文件；只改挂载/卸载策略，不动 iframe 隔离机制、不动 registry、不动任何 preview 内容。
