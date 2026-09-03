# Wallet style-guide 与生产页对齐（空态插画漂移修正）

## 已实查到的漂移

| 位置 | 生产实现 | style-guide 预览 | 结论 |
|---|---|---|---|
| Saved addresses 空态（W-10） | `Wallet.tsx` 桌面 + 移动两处 `EmptyState` 都带 `illustrationSrc={lynxEmptyAddresses}` | `walletLitePreviews.tsx` 的 `SavedAddressesEmptyPreview` 手抄了一份 markup，**没有** `illustrationSrc`，因此渲染默认 LynxMark 而不是插画 | 需修 |
| 流水空态 W-3 / 筛选空态 W-4 | `TransactionHistory.tsx` 统一 `lynxEmptyActivity` | 预览直接复用真组件 | 已一致 |
| Recovery 空态 | `RecoveryRequest.tsx` 用 `lynxEmptyRecovery` | `fundingPreviews.tsx` 同资产 | 已一致 |

根因：W-10 预览是手抄的静态 markup，不是复用生产组件，所以生产改了插画后预览没跟上。

## 改动

1. `src/pages/StyleGuide/preview/walletLitePreviews.tsx` — `SavedAddressesEmptyPreview` 的 `EmptyState` 补 `illustrationSrc={lynxEmptyAddresses}`（新增该资产 import），其余结构、文案、类名一字不动，与生产两处保持逐字一致。
2. `src/pages/StyleGuide/sections/WalletStatesSection.tsx` — W-10 的「插画资产」行已存在且指向 `lynx-empty-addresses.png`，核对后如已一致则零改动。

## 全量核对（只读，不改代码）

对 wallet 相关 style-guide 预览逐个核对是否复用生产组件还是手抄 markup，产出一份「复用 / 手抄」清单：`SavedAddressRows*`、`PendingConfirmations*`、`Tx*`、`HeroEquity*`、`Deposit*`、`Withdraw*`、`WalletPageLayout*`、`WalletAuthGate`。凡手抄的都逐项对照生产文件核对文案/类名/资产，发现新的漂移单独列出回报，本轮只修上面第 1 条以外确实错的项，不做重构（不把手抄件改成复用件，避免超出范围）。

## 验收

- Playwright 实拍 `/style-guide/preview?c=`（W-10 键）与生产 `/wallet` 地址簿空态并排对比，确认同一张 lynx 插画。
- `bunx tsgo --noEmit` 与 `bun run build` 全绿。
- 回报 diff 文件清单与核对清单。
