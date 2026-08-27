# PendingConfirmations 移动端重排（W-2）

选中的是 style-guide Wallet 节「4 · PendingConfirmations」的 W-2 移动端帧。当前移动端只是桌面单行布局的自适应压缩：图标 + 金额/标签 + 右侧区块进度条挤在一行，375px 下标签换行、进度条被压到最右、副行信息挤成一坨。

## 目标

移动端改成站内既有的两层行式（同 /wallet Transaction History Row Spec：上层 icon + 主信息 + 金额，下层 meta 与进度左对齐到 `pl-[52px]`），桌面端一行的现状逐像素不变。

## 布局改法（仅移动端 `<768px`）

```text
┌──────────────────────────────────────────┐
│ PENDING CONFIRMATIONS                    │
│                                          │
│ [↓]  Deposit  [Confirming]      +$800.00 │
│      Base · 2 min ago · est. ~45s left   │
│      6/15 blocks                         │
│      ▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                          │
│ ──────────────────────────────────────── │
│ Sent to the wrong network? Request recov │
└──────────────────────────────────────────┘
```

- 第一层：34–36px 圆角图标 + `Deposit` + `Confirming` chip 左侧，金额 `+$800.00` 右对齐（金额从左侧移到行尾，符合移动端「右侧金额」惯例）。
- 第二层（`pl-[52px]`）：网络 · 时间 · est. 一行 `text-xs`，其下 `6/15 blocks` 与进度条。
- 进度条移动端改为**满宽**（不再固定 `w-[110px]`），高度保持 1px 胶囊、同一渐变。
- 卡片内边距移动端收为 `p-4`（桌面维持 `22px/22px/18px`），底部 recovery 链接保持不变。
- 断点用 Tailwind `md:` 类实现，同一份 DOM 两套排布，不引入 `useIsMobile` 分支。

## 改动文件

- `src/components/wallet/PendingConfirmations.tsx` — 唯一需要改的产品文件（纯展示层，取数/进度计算逻辑零改动）。
- `src/pages/StyleGuide/sections/WalletLiteR1Section.tsx` — W-2 case 的 `note`/spec 行文案同步描述新的两层排布；`minHeight` 视新高度微调。preview key `wallet-lite-pending-confirmations-mobile` 不改名。

## 验收

- 375px 帧：两层排布、金额右对齐、进度条满宽、无横向溢出、无标签换行错位。
- 桌面帧 W-1：与改动前逐元素一致。
- typecheck 通过。
