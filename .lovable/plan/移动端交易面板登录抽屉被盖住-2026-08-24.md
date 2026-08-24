# 移动端交易面板登录抽屉被盖住

## 问题（已在代码中确认）

- `MobileDrawer` 走 `Sheet`，overlay/content 都是 `z-[300]`（`src/components/ui/sheet.tsx`）。
- 三个交易页在移动端点 Buy 未登录时打开的是 `AuthDialog`，而 `Dialog` overlay/content 是 `z-50`（`src/components/ui/dialog.tsx`）。
- 结果：登录窗口渲染在买入抽屉**下面**，用户只看到抽屉后面被压暗的登录内容（截图现象）。
- 同样的写法出现在：
  - `src/pages/lite/LiteSpotTrade.tsx`（现货，mobile 分支 `AuthDialog`）
  - `src/pages/lite/LiteContractTrade.tsx`（Boost 合约面板，同样问题）
  - `src/pages/lite/LiteQuickTrade.tsx`（快轮，同样问题）

## 修复方案

1. 三个 Lite 交易页的**移动分支**改用 `AuthSheet`（项目既定移动登录制式，Me / BottomNav 用的同一套），桌面分支保持 `AuthDialog` 不变。
2. `onRequestAuth` 触发时先关闭买入抽屉（`setDrawerOpen(false)`）再打开登录抽屉，避免两个 bottom sheet 叠加。
3. 登录成功（`user` 变为非空且是从买入流程发起的）后不自动下单，仅关闭登录抽屉、恢复原来的买入抽屉，让用户确认后再点 Buy。

## 技术细节

- 只改这三个页面文件的 UI 组合与 `onRequestAuth` 回调；不改 `LiteOrderPanel` / `LiteContractOrderPanel` 的下单逻辑、不改 `AuthSheet` / `AuthDialog` 组件本身、不动 z-index token。
- 桌面端零变化。

## 验收

移动 393×831 未登录：`/spot` 快轮、`/spot` 股票、`/trade` Boost 三处点 Buy → 登录抽屉在最前、可完整操作；登录后回到买入抽屉。
