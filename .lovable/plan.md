## 问题

`/style-guide` 桌面侧栏（`src/pages/StyleGuide/index.tsx`）用的是 `sticky top-24 h-fit`，没有自身滚动容器。分组变多后侧栏高度超出视口，鼠标在目录上滚动时事件冒泡到页面，滚的是右侧主内容，导致目录底部的项目（Mobile / Misc 等）无法直接滚到。

## 方案（仅改导航壳层，不动任何 section 文件）

在 `src/pages/StyleGuide/index.tsx` 的 `<nav>` 桌面分支 className 上：

- 把 `h-fit` 换成 `max-h-[calc(100vh-7rem)]`（与 `top-24` 对应，底部留呼吸位）
- 加 `overflow-y-auto` + `overscroll-contain`（滚到边界不传导给页面）
- 加 `pr-1 scrollbar-none`（避免滚动条挤压宽度；项目已在移动端 rail 使用 `scrollbar-none`）

移动端横向 rail 不变。

## 技术细节

只修改一处 className 字符串，无逻辑、无新组件、无新依赖。改完跑 typecheck 确认通过。
