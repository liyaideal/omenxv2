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
| **Available balance** | Free balance in the futures account (`profiles.balance`) |
| **Total equity** | `Spot + Futures available` (`spot_balance + balance`). **Retired 2026-07-21:** "Trial bonus" field — the Trial Bonus wallet feature was fully sunset before mainnet launch; do not reintroduce copy that references it. |

---

## Addresses

Truncate to **First 6 + Last 6**, e.g. `0x1234...345678`.
Full address rendering: digits `text-primary`, letters `text-foreground` (see `mem://style/blockchain-address-security-design`).
