# Copy Dictionary

Single source of truth for user-visible field names across the app.

**Rules**
- Sentence case for labels (except proper nouns). Never Title Case mid-UI.
- Numbers, codes, addresses → `font-mono` (JetBrains Mono).
- Code-level field names (e.g. `redeemableCapPct`, `maxHoldingHours`) stay in `camelCase` and are **not** governed by this doc — only the user-facing strings are.
- Before adding or renaming any user-facing field, **check this file first**. If the term is not here, add it before shipping.

---

## Vouchers (`/vouchers`)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Face value** | Voucher denomination, e.g. `$10.00` | — |
| **Max profit** | Capped realisable upside = `faceValue × redeemableCapPct` | Max payout, Max realisable profit, Profit cap, Max Profit, cap |
| **Hold window** | Auto-settlement TTL in hours | Hold Window, Holding window, Max holding |
| **Voucher code** | 8-char alphanumeric voucher ID | Code, code, Voucher |
| **Expires in** | Countdown to voucher expiry | Expiry, Time left, Ends in |
| **Price band** | Allowed entry price range | Price Band, Entry range |
| **To claim** | Section / badge for `granted` vouchers awaiting user claim | Unclaimed, Pending vouchers |
| **Tap to claim** | CTA chip on granted voucher cards | Claim now, Activate |
| **Claim voucher** | Primary button on granted voucher (full card) | Activate voucher, Get voucher |
| **Available** | Section for `claimed` vouchers ready to redeem (within 7-day window) | Ready, Claimed vouchers |
| **Redeem voucher** | Primary button on claimed voucher | Use voucher, Open position |
| **Claim window 7 days** | Window between claim and forced expiry | 7-day expiry, Use within 7 days |
| **Left today** | Remaining quota in today's daily pool, format `X / Y left today` | Available today, X remaining, In stock |
| **Resets in {Xh Ym}** | Countdown to next UTC midnight pool reset | Refreshes in, Next batch, Back in |
| **Sold out today** | Pool exhausted state for current UTC day, paired with `· resets in {Xh Ym}` | Out of stock, Gone, Empty pool |
| **Sold out** | Disabled CTA label when pool exhausted | Unavailable, Closed |

### Voucher earnings tiers (`VoucherEarningsCard`)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Volume tier** | Section label for the T1–T4 ladder | Tier progress, Volume gate |
| **Filled volume** | Cumulative `trades.amount` where `status='Filled'` | Trading volume, Total volume |
| **T1 / T2 / T3 / T4** | Tier labels with caps `$5,000 / $15,000 / $50,000 / $150,000` → `$25 / $100 / $500 / Unlimited` lifetime claim | Tier 1, Level 1, Gold/Silver |
| **Claim $X to wallet** | Primary button when claimable > 0 | Claim to balance, Withdraw earnings |
| **Tier cap claimed — reach next tier** | Button label when current-tier cap is exhausted | Cap reached, Locked |
| **Trade more to unlock** | Button label when below T1 or no claimable | Volume required, Locked |

Natural-language copy (warnings, tooltips) may paraphrase, e.g. `Profits are capped at $5.00` — that's prose, not a labeled field, and is allowed.

**Deprecated:** the single fixed `50,000 USDC volume gate` copy (e.g. `Trade $X more in filled-trade volume to unlock claim`) is replaced by the tier ladder above. Do not reintroduce single-gate language.

---


## Sports game lines (`/trade` fixture board)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Winner** | Match-result group (1x2 or head-to-head) | Moneyline, 1X2, Match odds |
| **Handicap** | Signed-line group, home-team perspective (`ARS +1.5`) | Spread, Spreads, Line betting |
| **Total goals** / **Total points** | Combined-score group; noun follows the sport | Totals, O/U, Over/Under market |
| **Over {line}** / **Under {line}** | The two sides of a total | O 2.5, U 2.5 |
| **covers** | Verb for a handicap row (`ARS +1.5 covers`) | beats the spread |
| **Regulation time** | Settlement window note on every group header | Full time only, 90 mins |

Signed lines always use a real minus sign (U+2212) for negatives and `+` for
positives. Chip words come from the sibling event's `side_labels`.

---

## Airdrops (`/portfolio/airdrops`)

| Canonical | Meaning |
|---|---|
| **Airdrop value** | Notional size of the airdrop position |
| **Expires in** | Countdown to airdrop expiry |
| **Activate** | Verb for activating a pending airdrop |
| **Welcome gift** | Fallback `$10` airdrop when no matched Polymarket positions exist |

---

## Trading (shared across `/trade`, `/portfolio`, `/wallet`)

| Canonical | Meaning |
|---|---|
| **Entry** | Position entry price |
| **Mark** | Current mark price |
| **Size** | Contract count |
| **Notional** | `size × mark` |
| **Leverage** | Position leverage multiplier |
| **Margin** | Maintenance margin required |
| **Liq. Price** | Estimated liquidation price. Formula: `entry × (1 ∓ 0.9/leverage)`, clamped to `[0, 1]`. Ignores funding drift and MM buffer — account-level threshold lives in `useRealtimeRiskMetrics`. Always rendered as `$0.xxxx` (4 decimals) or `--`. |
| **PnL** | `(mark − entry) × size × side` (see `mem://technical/pnl-formula-canonical`) |
| **Side** | `long` / `short`. Binary markets use `Yes` / `No`. Never `Buy` / `Sell` as a position side. |
| **Available balance** | Free balance in the Boost account (`profiles.balance`) |
| **Total equity** | `Boost + Standard available` (`balance + spot_balance`). **Retired 2026-07-21:** "Trial bonus" field — the Trial Bonus wallet feature was fully sunset before mainnet launch; do not reintroduce copy that references it. |

---

## Accounts (CPO ruling 2026-08-06)

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Standard Account** | Spot account (`profiles.spot_balance`, productLine `spot`, route `/spot`) | Spot Account, Spot |
| **Boost Account** | Futures account (`profiles.balance`, productLine `futures`, route `/trade`) | Futures Account, Futures, Margin account |
| **STANDARD / BOOST** | Product-line badge labels | SPOT / FUTURES |
| **In use by open positions** | Margin currently locked | Margin in Use, Margin |

Internal identifiers are unchanged and NOT governed here: `spot` / `futures`
productLine values, `to_spot` / `to_futures` transfer directions, DB columns,
routes, localStorage keys.

User-visible **Spot / Futures / Margin / Leverage / Liquidation** are banned
platform-wide (not just Lite).

---

## Addresses

Truncate to **First 6 + Last 6**, e.g. `0x1234...345678`.
Full address rendering: digits `text-primary`, letters `text-foreground` (see `mem://style/blockchain-address-security-design`).

---

## Intraday rounds

| Canonical | Meaning | Banned variants |
|---|---|---|
| **Round** | The 5m / 15m / 1h / 4h / 1D duration selector (dial) on every intraday surface — desktop Intraday view, Crypto vertical, mobile module, quick-trade page | Window, WINDOW, Round length, Timeframe, Duration |

`Round #12`, `Round open $X` and `Round opens 09:30` refer to the round *object*
and stay as-is — they are a different noun from the selector label.

---

## Lite banned words

Trader jargon is banned in rendered Lite copy: **Margin, Liquidation, Funding,
Leverage, Long, Short, Spot, Futures, Order book, Limit, Moneyline** (account
nouns Spot/Futures are exempt).

| Banned | Why | Use instead |
|---|---|---|
| **Spread(s) / Totals / 1X2 / O/U** | Bookmaker jargon for the sports game-line groups. | Handicap · Total goals · Over/Under · Winner |
| **Props** | Internal taxonomy bucket name only (`PROPS_BUCKET` in `src/lib/taxonomy.ts`) — the non-intraday event catalogue of a vertical. Same class as the Moneyline ban. | Question-style section titles: "Will it happen?", "Who wins the match?" |

Pro escape-hatch line (updated 2026-08-06, byte-identical from now on):
"Want charts and advanced trading tools? Switch to Pro mode".

---

## Verb ruling — "Back" retired (2026-08-06, CPO-approved)

The wagering verb **Back** is retired from the Lite UI. User verbs are
**Buy / Cash out**, matching the CTAs that already say Buy
(`Bought {side} · $X`, "Buying {side} cashes out your {heldSide} first.").
Money-sense "back" ("You'll get back ≈", "$X back") is unaffected and stays.
The "call" family ("Make your call", "your Yes call") is reviewed separately.

---

## Settlement time wording — `settleLabel()` (2026-08-19, CPO-approved)

All Portfolio "settles / settled at" strings come from
`settleLabel()` (`src/lib/settleLabel.ts`). No page formats its own.

| Case | Output |
|---|---|
| same calendar day | `today 16:00` |
| same year | `Aug 21 16:00` |
| another year | `Jan 12, 2027` (no clock) |

24h user-local time, **no timezone suffix**. The verb is added by the caller
(`settles Aug 21 16:00`). Sports `kickoffLabel` is a separate rule, unchanged.

### CLOSED vs SETTLED（结算详情眉线，2026-08-21）

| close_reason | 眉线 | 价格行 | 时间行 label |
|---|---|---|---|
| `settlement` | `SETTLED · {日期}` | `Settled price` | `Settled` |
| `auto_close` | `CLOSED · {日期}` | `Closed at {价} · auto-closed` | `Closed` |
| `cashout` | `CLOSED · {日期}` | `Closed at {价} · cashed out early` | `Closed` |

`Payout = max(0, Cost + PnL − Fees)`；为 0 时副行写 `nothing returned`。
系列眉线为 `SERIES · WON {x} OF {n}`。

### Close-reason remarks

| Reason | Rendered remark |
|---|---|
| `settlement` | (nothing — a normal resolution needs no remark) |
| `auto_close` | `auto-closed` |
| `cashout` | `cashed out early` |

Never render "liquidated" or "stopped out" — banned Lite jargon.
