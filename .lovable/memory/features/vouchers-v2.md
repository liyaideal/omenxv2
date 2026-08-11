---
name: Vouchers v2
description: Dual payout modes (instant/tiered), event-level one-voucher lock, /rewards Vouchers tab entry, flat-chrome component family
type: feature
---

# Vouchers v2

## 入口
- 唯一入口：`/rewards` 第三个 tab（Campaigns / Vouchers / Referral）。
- `/vouchers` 保留为重定向（带 deep-link 参数），不再是独立页面。
- 主体组件：`src/components/vouchers/VouchersBody.tsx`。

## 双收益模式（`position_vouchers.payout_mode`）
| mode | 结算后去向 | UI 披露位置 |
|---|---|---|
| `instant` | 触发器 `pay_instant_voucher_settlement()` 直接入 `profiles.spot_balance`（Standard 余额）并写一条 `bonus` transaction | 券行第三行（volt，例外行）+ 兑换台 Payout 单元格 |
| `tiered` | 只进 `voucher_earnings.pending_amount`，按 T0–T4 档位 claim | 兑换台 Payout 单元格；券行不写 |

Ready（未 claim）券行**不写**收益模式，模式只在兑换台披露。

## 一券一 event 锁
同一 event 已开过 trial position 后，`EventPickerList` 整卡置灰并显示 “Voucher already used”。锁覆盖该 event 的**两条产品线**（Boost 合约与 Standard 现货）。

## 组件族（flat chrome，hex token 见 `voucherTokens.ts`）
`VoucherRow`（3px volt 竖轨；spent 转灰）· `VoucherEarningsCard`（双格 hero + T0–T4 rail）· `VoucherHistoryArchive`（折叠档案条）· `VoucherDeskHeader`（Max profit / Hold window / Payout）· `EventPickerList` · `RedeemVoucherContent`。

## 移动端 375
券行动作降为整宽 44px；兑换流程是**独立屏**（替换列表，不是浮层），确认条悬于 BottomNav 之上并 truncate 摘要。

## Playground
`/style-guide` → Lite → Vouchers，`Vouchers2Section` 6 个 case（rows / earnings / archive / picker / desk / mobile flow）。v1 的 `VouchersSection` 保留在同页下方作改版前留档，**不再是事实来源**。
