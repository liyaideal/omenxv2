> 注记（2026-09-03）：本文内容已全量并入 docs/delivery/lite-wallet-spec-v1.md（Wallet 整体交付文档），本文件仅作历史底账保留，不再维护。

> 本文档已被 docs/delivery/lite-wallet-spec-v1.md 取代（2026-09-03），仅存档，请勿以本文档为准。

# Wallet Lite 改版（Wallet Lite R1）— 交付说明 v1

> 本文档覆盖 2026-08 Wallet Lite 改版三批改动：批1 未登录门 + Lite 登录弹层、批2 地址操作 + 配色 + 文案、批3 交易流水整理（存档记录，现行口径以 docs/delivery/lite-wallet-spec-v1.md 为准）。Pro surface 本轮零改动；认证逻辑本轮零改动，仅改视觉与文案外壳。

## 1. 功能目标

把 `/wallet` 在 Lite surface 下的三段体验对齐 Lite 设计语言：未登录门、登录弹层三步、以及登录后的地址与流水信息层。目标读者为 Lite 新用户，关键约束是**不触碰认证流程、金额、排序、分页、恒等式**。

## 2. 未登录门（批1）

| surface | 组件 | 视觉 |
|---|---|---|
| lite | `LiteAuthGate` | 模糊底层 `blur-[3px] opacity-70` + LynxFigure 100 + 标题 / 描述 + `btn-primary` Sign in + 描边 Create account |
| pro | `AuthGateOverlay` | 原样，未改 |

文案：`Sign in to view your wallet` / `Deposit, withdraw and move funds between your accounts by signing in.`

## 3. Lite 登录弹层三步（批1）

| step | 触发 | 视觉要点 |
|---|---|---|
| `login` | 打开弹层默认 | lynx 图 `/lynx-auth-placeholder.png`、标题 `Trade what happens next`、tab active `bg-[#F2F3F5] text-[#090A0C]` |
| `createWallet` | 授权回调后 | 三行 volt 勾价值点 + Turnstile 占位块 + `Create wallet` |
| `completeProfile` | `handleCreateWallet` 完成后 | volt 成功横幅 + `bg-muted/30 rounded-lg` 表单卡（username / email）+ `Start trading →` |

容器：desktop `AuthDialog`，mobile `AuthSheet`（`MobileDrawer`）。`variant` 决定排版，`surface==='lite'` 决定配色与文案分支。

## 4. 地址与配色（批2）

### 4.1 Saved address row

| 端 | 行尾 | 菜单 |
|---|---|---|
| Desktop | Copy 图标 + `⋯` | Popover `w-[210px] p-1 bg-[#12151A] border-[#1D2026] rounded-xl` |
| Mobile | 仅 `⋯` | `MobileDrawer`，项高 `py-[15px]` |

菜单项顺序 `Set as default`（非默认才有）→ `Copy address`（仅 mobile）→ `Delete address`（`#FF5C5C`）。复制成功时 Copy 图标切绿色 Check。

后端方法沿用既有 `handleCopyWallet / handleSetPrimaryWallet / handleDeleteWallet / handleConfirmDelete`，逻辑未改。

### 4.2 账户徽标

`STANDARD`（spot，primary 系）/ `BOOST`（futures，accent 系）统一由 `src/lib/productLineBadge.tsx` 出色，页面不得覆写。

### 4.3 Hero equity note

`Boost + Standard · {equityNote}`；Lite 传 `does not include open trade profit`，Pro 使用默认 `does not include unrealized PnL`。

## 5. 交易流水（批3）

- 删除冗余类型药丸；账户徽标改为**每行都有**，右对齐成列。
- 转账两腿改方向式描述：`Transfer to Boost` / `Transfer from Boost` / `Transfer to Standard` / `Transfer from Standard`。
- Desktop 行右侧固定列：status 图标 → 徽标 `w-[78px]` → 金额 `w-[120px]` → chevron `w-4` 恒定占位（保证跨行右缘对齐）。
- Mobile 保持两层结构（第二层 `pl-[52px]`）。

### Icon 映射（穷尽）

| type | icon | 颜色 |
|---|---|---|
| deposit | ArrowDownLeft | green |
| withdraw | ArrowUpRight | red |
| trade_profit | TrendingUp | green |
| trade_loss | TrendingDown | red |
| platform_credit | Wallet | green |
| bonus | Gift | green |
| fee | Receipt | red |
| transfer_to_spot / transfer_to_futures | ArrowLeftRight | primary |
| 其他（兜底） | Wallet | muted |

金额本身的涨绿跌红、排序、分页、筛选未改。

## 6. Style Guide

（已废弃，现行索引见 lite-wallet-spec-v1.md §7）

`/style-guide` → **Lite · Wallet** → `Wallet Lite R1 · 状态字典`，6 个子节共 16 个 preview 键，每个 case 附「状态 / 触发条件 / 视觉结果 / 数据来源」表。demo 全部挂生产组件 + fixture props。

## 7. a11y 小修

- `AuthSheet` 补 `VisuallyHidden` 包裹的 `SheetTitle`（消 Radix 缺 title 警告，视觉零变化）。
- `ColoredAddress` 改为 `forwardRef`（消 ref 警告）。

## 8. 涉及文件

**前端**
- `src/pages/Wallet.tsx`（auth gate 分叉、`SavedAddressRowView` / `SavedAddressActionsList` 导出、equityNote、trade 行 account）
- `src/components/auth/AuthContent.tsx`、`src/components/auth/AuthSheet.tsx`
- `src/components/portfolio/lite/LiteAuthGate.tsx`
- `src/components/wallet/TransactionHistory.tsx`、`src/components/wallet/ColoredAddress.tsx`
- `src/lib/productLineBadge.tsx`

**Style Guide**
- `src/pages/StyleGuide/preview/walletLitePreviews.tsx`（新增，独立 lazy chunk）
- `src/pages/StyleGuide/preview/registry.tsx`、`src/pages/StyleGuide/sections/WalletLiteR1Section.tsx`、`src/pages/StyleGuide/sections/pages/LiteWalletPage.tsx`

**文档**
- `DESIGN.md`（Wallet Lite R1 节）、`docs/copy-dictionary.md`（Wallet 节）

## 9. 未变更项

认证逻辑与状态机、Pro surface 全部页面、金额与其涨跌配色、流水排序 / 分页 / 筛选、转账与提现后端、`/deposit` `/withdraw` 动线。
