# R3b-1 — Lite spot trade page（交付说明）

> Display-layer fork of `/spot` for `surface === "lite"`. Pro `SpotTrading` /
> `DesktopTrading` are untouched. No schema changes; reuses `executeSpotTrade`.
> Lite `/trade` (futures) is out of scope — Lite users tapping a futures
> event still hit Pro `/trade` for now.

## 1. Routing

| Route | Surface | Renders |
|---|---|---|
| `/spot?event=…` | `pro`  | existing `SpotTrading` (unchanged) |
| `/spot?event=…` | `lite` | new `LiteSpotTrade` (desktop + mobile) |

Fork lives in `src/App.tsx` (`SpotRoute`) — reads `useSurface()`, no other Pro
call sites touched.

## 2. P0 guardrails

| # | Guardrail | Where enforced |
|---|---|---|
| 1 | Snapshot execution price into a `const` at submit; never re-read live price inside the async handler | `LiteOrderPanel.handleSubmit` — `priceSnapshot`, `qtySnapshot`, `optionIdSnapshot`, `optionLabelSnapshot` |
| 2 | Cash leg mirrors SpotTrading: `res.balanceDelta < 0 ? deductSpotBalance(-Δ) : addSpotBalance(Δ)` | `LiteOrderPanel.handleSubmit` |
| 3 | All time gating / formatting derives from `freeze_time` / `end_date` / `lifecycle_status` — zero hardcoded clock times | `LiteSpotTrade` (`freezeAt`, `endDate`, `isPastFreeze`, `getDisplayLifecycle`, `formatEtTime`) |
| 4 | No string-concatenated Tailwind classes; literal-mapped side→color, tone→class | `LiteOrderPanel.SideButton`, gradient CTA |
| 5 | Do not touch SpotTrading / DesktopTrading / Portfolio / MarketCardB / existing StyleGuide sections | Confirmed — new code sits under `src/pages/lite/` and `src/components/lite/trade/`; StyleGuide gains one additive tab |

## 3. Forbidden vocab

No occurrence of Margin / Liquidation / Funding / Leverage / Long / Short / Spot / Futures / Order book / Limit in user-visible copy under `src/pages/lite/LiteSpotTrade.tsx` and `src/components/lite/trade/*`. Sides are **Up / Down**, resolved via `parseSideLabels(event.side_labels)`.

## 4. Desktop layout

Two-column `grid` (1.55fr / 1fr), max-w 1160, terminal chrome only (no site nav).

Left column, top→bottom:

1. Eyebrow `Stocks · Daily up / down`
2. `font-display` question headline (clamp 24–34px)
3. Context row — current price, `▲/▼ % today`, `Price to beat`, `Vol`
4. Y/N sentiment bar — Up gradient `from-yes/30 to-yes/15` (2px stage divider), Down gradient `from-no/15 to-no/25`
5. Chart with segmented toggle `NVDA price | Up odds ¢` + timeframe pills
6. Settlement rail (5 nodes, gradient `#013281 → #33D6FF`, yes-ringed NOW dot)
7. Rule one-liner (info `i`) — includes the "flat close counts as **Down**" clause
8. `Your position` — rendered only if a matching `spot` position exists
9. `Live · Market pulse` — `trades` rows for this event, anonymized

Right rail:

- `Place your order` card — Up/Down side buttons, amount input, preset chips (`$X` / `win $Y`), payout summary, side-colored gradient CTA
- `More stocks closing today` — other `category='stocks'` unresolved events with Up%

## 5. Mobile layout

Page is context-only. Sticky bottom bar with `Buy Up` / `Buy Down` tapping which opens **MobileDrawer** (`@/components/ui/mobile-drawer`, never Dialog on mobile) whose body is `<LiteOrderPanel variant="mobile" />` plus `MobileDrawerActions` with an outline `Cancel`. Selected side on the page pre-sets the drawer's side. Sticky bar respects `env(safe-area-inset-bottom)`.

## 6. Data sourcing

| Concern | Source |
|---|---|
| Side prices | `event_options.price` via `useRealtimePricesOptional` |
| Yes resolution | `parseSideLabels(event.side_labels).yes` → `/yes\|up/` regex → `options[0]` |
| Sentiment % | `round(yesLive × 100)` |
| Stock price line | Front-end synth from `base_price → current` (DEMO-STATE); `LiteStockChart` accepts real `price_history` via `upHistory` prop when supplied |
| Up-odds line | Synth 50¢ → current, or `upHistory` if present |
| Pulse | `trades` select `.eq('event_name', …).eq('side','buy').order desc limit 10` |
| More stocks | `events` `.eq('category','stocks').eq('is_resolved', false).order end_date asc` |
| Volume text | Deterministic mock derived from `event.id` (stable) |

## 7. Execution wiring

- `executeSpotTrade(user.id, { side:'buy', price: snapshot, quantity: floor(amount/snapshot), … })`
- `snapshot = clamp(sidePrice × (1 + 50 bps), 0.0001, 0.9999)` — slippage cap hidden from user
- Sells / limit management stay in Pro; Lite is buy-only
- Gating: `isOrderingBlocked(dbLifecycle) || isPastFreeze(freezeAt, endDate)` disables the CTA and swaps copy via `getBlockedReason`

## 8. StyleGuide

Additive tab `Lite Spot` (`src/pages/StyleGuide/sections/LiteSpotSection.tsx`) with a PresetRail (Coin flip / Up-favoured / Down-favoured / Edge case / Market closed) driving both desktop and mobile-body variants of `LiteOrderPanel` side-by-side plus a chart preview. Existing `SpotSection` is untouched.

## 9. Files

**New (frontend):**

- `src/pages/lite/LiteSpotTrade.tsx`
- `src/components/lite/trade/LiteOrderPanel.tsx`
- `src/components/lite/trade/LiteStockChart.tsx`
- `src/pages/StyleGuide/sections/LiteSpotSection.tsx`

**Modified:**

- `src/App.tsx` — `SpotRoute` fork
- `src/pages/StyleGuide/sections/index.ts` — exports `LiteSpotSection`
- `src/pages/StyleGuide/index.tsx` — registers the `Lite Spot` tab

**Backend / DB:** none.

## 10. Unchanged

`SpotTrading.tsx`, `DesktopTrading.tsx`, `SpotSection.tsx`, Portfolio, MarketCardB, existing trading services, database schema, edge functions.