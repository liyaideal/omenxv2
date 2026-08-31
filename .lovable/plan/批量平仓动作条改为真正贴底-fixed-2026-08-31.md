# 批量平仓动作条改为真正贴底（fixed）

## 问题

`BatchActionBar` 用的是 `sticky bottom-[76px]`。sticky 只在滚动容器内"经过"时吸附，列表较短时动作条停在页面中间，不会贴着视口底部（底部导航上方）。用户预期：只要进入选择模式且有选中，动作条就恒定钉在屏幕底部（BottomNav 上方 76px 处）。

## 改动（仅 `src/components/portfolio/lite/BatchCashOut.tsx` 的 BatchActionBar）

1. 外层由 `sticky` 改 `fixed inset-x-0 bottom-[76px] lg:bottom-4 z-30 px-4`。
   - `bottom-[76px]` = 移动端 BottomNav 高度（`--bottom-nav-h: 76px`，fixed z-200），动作条钉在导航正上方；桌面 `lg:bottom-4`。
2. 内层加 `mx-auto w-full max-w-7xl lg:px-6`，与 /portfolio 页面容器（`max-w-7xl px-4 lg:px-6`）对齐，桌面端不会拉满全宽。
3. 因为 fixed 脱离文档流会遮住列表末行：在 LitePortfolio 渲染 `BatchActionBar` 的同一条件分支里，于动作条前渲染一个等高占位 `div`（`h-[76px]`，仅 selectMode 且有选中时），保证列表能完整滚到底。
   - 改动文件：`src/pages/lite/LitePortfolio.tsx`（一处，1–2 行）。

## 同步更新

- Style Guide 规范行 `portfolio-lite-live-select` 的"动作条"状态描述（吸底→固定贴底 + 占位说明）。
- `docs/delivery/lite-portfolio-spec-v2.md` 对应段落、`docs/changelog/STATUS.md` 追加一行。

## 不动

- 动作条视觉（圆角、底色、毛玻璃、按钮）、选择/平仓逻辑、确认抽屉、Pro。

## 验证

- Typecheck。
- Playwright 390px 打开 `/style-guide/preview?c=portfolio-lite-live-select` 与真实 `/portfolio`（guest），确认：短列表时动作条钉在底部导航上方、长列表滚动时不遮末行、无 page error；1280px 桌面确认宽度对齐 max-w-7xl。
