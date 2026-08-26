---
name: H2E airdropped positions module
description: Airdropped positions 模块的渲染条件、行态、source 过滤、徽标口径、portfolio 行标枚举与 H2E earnings 口径
type: feature
---

# Airdropped positions（`/rewards/campaign/h2e`）

组件：`src/components/h2e/AirdroppedPositionsCard.tsx`，锚点 id `#airdropped-positions`，
位置固定在 `ConnectedAccountsCard` 与 `H2eRewardsCard` 之间。

## 渲染条件（任一成立即 `return null`，不画骨架/空态）
- `!user`（S0 游客）
- `activeAccounts.length === 0`（S1 未绑）
- 无账号 `scanStatus === 'complete'`（扫描中）
- 过滤后 `rows.length === 0`

## 取数与行序
- 过滤：`source !== 'voucher'` 且 `status ∈ {pending, activated, expired}`
- 行序固定：pending → activated → expired
- `settled` 不进本模块，归 `H2eRewardsCard` 的 Recent settlements（两处不重复计数）

## 行态
| status | 视觉 |
|---|---|
| pending | `#FFD666` `Activate in {h}h {m}m` + 白底 `Activate`（mobile 整宽 `h-11`，桌面 `px-4 py-[7px]`） |
| activated | volt `#CFFF4A` 圆点 + `Live · {±$pnl}`；右侧 pulse `View in portfolio ›` |
| expired | 整行 `opacity-55`，右侧灰字 `Expired`，**不计入徽标** |

## source 副本行
- `matched` → `Matched: {externalEventName} — {side} @ {price}¢ on Polymarket`
- `welcome_gift` → `Welcome gift — no matching OmenX event for your positions, so we sent one on us`
- `voucher` → 取数即过滤，永不出现
- 未知 / 缺字段 → 省略副本行（不编造来源）

## 徽标 / 计数单一真相源
`liveAirdropCount = airdrops.filter(a => a.source !== 'voucher' && (a.status === 'pending' || a.status === 'activated')).length`

同一个数用于：模块题头徽标、`ConnectedAccountsCard` 的 Airdrops 计数（点击 = 锚点滚到 `#airdropped-positions`）、
`H2eCampaignCard` 的 s2Meta、`H2eRewardsCard` 的 S2 子行与 S3 横条。禁止任何演示常量（旧 `airdropsReceived` 已废）。

## portfolio 行标枚举（`useLitePortfolio.airdropTag`）
- `none` → 无标
- `voucher` → volt `#CFFF4A` `Voucher`
- `airdrop` → pulse `#33D6FF` `Airdrop`（`matched` 与 `welcome_gift` 同标）

pending 空投不进 portfolio；激活开仓后才作为 `airdropTag='airdrop'` 的 Live 行出现。

## Earnings 口径（`useH2eRewardsSummary`）
`totalEarned = Σ settled 落库行的正 pnl`，其中
`source !== 'voucher'` 且 `!id.startsWith('mock-')`；cap = **$100**。
券收益走 `voucher_earnings` 独立池，永不进 H2E cap。

## Style guide
`/style-guide#lite-h2e`（H2E Campaign 节）—— 四个模块的全状态表；预览无会话，活体渲染恒为 S0。
