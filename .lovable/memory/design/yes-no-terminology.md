---
name: Yes/No terminology
description: UI 全站方向文案统一为 Yes/No；底层 side 字段保留 long/short 与 buy/sell；映射、双价、颜色、helper 用法
type: design
---

# Yes/No Direction Terminology (UI layer)

## Core rule
- **All user-facing direction labels** use **Yes / No** — never Long / Short / Buy / Sell as a direction word.
- **Underlying fields are untouched:** `position.side: 'long' | 'short'`, `order.side: 'buy' | 'sell'`, Supabase columns, PnL formula, `positionIntent` canonical logic.
- Mapping is render-only.

## Mapping

| Underlying | UI label |
|---|---|
| `side === 'long'` / `side === 'buy'` | **Yes** |
| `side === 'short'` / `side === 'sell'` | **No** |
| Buy Long / Sell Short CTA | **Buy Yes / Buy No** |
| Close Long / Close Short | **Close Yes / Close No** |
| Reduce Long / Reduce Short | **Reduce Yes / Reduce No** |
| Long Price / Short Price column | **Yes Price / No Price** |

## Helpers (single source of truth)
`src/lib/tradingTerms.ts`:
```ts
export const sideLabel = (s: 'long'|'short') => s === 'long' ? 'Yes' : 'No';
export const orderSideLabel = (s: 'buy'|'sell') => s === 'buy' ? 'Yes' : 'No';
```
Always render through these (or inline ternaries that match the same mapping).

## Pricing
Display still uses dual price `yes + no = 1` (`noPrice = 1 - yesPrice`). Only the column/button labels changed; the underlying calculation is identical.

## Colors
- Yes → `text-trading-green` / `bg-trading-green`
- No  → `text-trading-red` / `bg-trading-red`

## Exceptions (keep original wording)
- Fiat ramp ("Fiat Buy / Fiat Sell", "Sell USDC") — these describe asset purchase, not direction.
- OrderBook generic explanation of "bids / asks" in Glossary.
- On-chain audit enum docs may show `0 (Yes)` / `1 (No)` but the underlying enum name remains `positionSide` with values long/short.
- Glossary entries keep "Yes / No (Long / Short)" titles + the `#long` / `#short` anchor ids for SEO compatibility.

## Why
Previously UI showed Long/Short with `long+short=1` dual pricing, but the underlying model is "long/short on the Yes market". A user who shorted and saw the Yes price drop expected to profit, yet the short-price label (= 1 − yes) went up — visually confusing. Yes/No labels match the user's mental model and remove the contradiction without changing any business logic.
