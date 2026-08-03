---
name: Crypto quick rounds
description: Rolling crypto up/down spot rounds (3 coins x 5 timeframes) with roll-crypto-quick-rounds cron, settle_spot_event payouts, and the LiteQuickTrade page
type: feature
---

# Crypto quick rounds (shipped 2026-08-03)

## Event model
- id/slug `crypto-{coin}-updown-{tf}-{YYYYMMDDHHMM}` (UTC period start). Coins btc/eth/sol × tf 5m/15m/1h/4h/1d.
- `event_subtype 'CRYPTO_QUICK_UPDOWN_SPOT'`, product_lines `['spot']`, category `crypto`, side labels Up/Down, `base_price` = round opening reference.

## Engine
`public.roll_crypto_quick_rounds()` — cron `roll-crypto-quick-rounds`, every minute:
1. **Settle** past-due rounds with a synthetic close (timeframe-scaled volatility) → winner Up or Down → spot positions paid out through `public.settle_spot_event(p_event_id)`.
2. **Open** the current period, base price = last settled close.
3. **Prune** resolved rounds older than 72h with no positions.

`settle_spot_event` (SECURITY DEFINER) credits `profiles.spot_balance`, closes the position with realized PnL and writes a `transactions` row. `roll_daily_stock_events` and `roll_daily_hk_stock_events` now settle the prior session **with payout** through the same function before opening the new day.

## Quick trade page
`/spot?event=…` branches on the subtype into `src/pages/lite/LiteQuickTrade.tsx`: eyebrow `Crypto · Intraday`, price line `$X · ▲ +Y% today · Vol $Z`, ROUND switcher navigating (replace) to the sibling timeframe's current event, round tape (`ROUND #{n}` + last 10 settled squares + live countdown capsule + dashed NEXT), settle-line chart (price path never drawn past the settle marker), question card + reused `LiteOrderPanel`. Auto-rebinds to the next round when the bound one resolves. `?side=up|down` preselects direction on `/spot`.

## Rebase onto the spot skeleton (2026-08-03)
Per CHK-8, `LiteQuickTrade` is a variant branch of the spot trade page, not a separate page: it uses `LiteStockChart` (the settle-line `RoundPlot` overlay was dropped) plus the shared blocks from `src/components/lite/trade/SpotBlocks.tsx` — `SpotSentimentBar`, `SpotSettlementRail` (quick-round nodes), `SpotYourPosition` — alongside the round switcher, round tape, rule card, `LiteMarketActivity` and "Also live now". `RoundPlot` now lives **only** in the Intraday band tiles.
