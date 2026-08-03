---
name: Lite intraday band
description: All intraday events live only in the orange Intraday band on the Lite list (quick-rounds dial + stocks session tabs); grid excludes them; Intraday chip removed; AssetAvatar token spec
type: design
---

# Lite intraday band (LOCKED 2026-08-03)

## Doctrine
Intraday events = subtypes `CRYPTO_QUICK_UPDOWN_SPOT`, `US_STOCK_DAILY_UPDOWN_SPOT`, `HK_STOCK_DAILY_UPDOWN_SPOT`.
- They render **only** in the Intraday band (`src/components/lite/intraday/IntradayBand.tsx`), mounted between the filter row and the card grid on `/events` (Lite).
- The main grid **excludes** those subtypes entirely — zero intraday cards in any sector.
- The `◷ Intraday` trait chip is **removed** (desktop + mobile). Filter row = topic control + Boost only. Boost ON hides the whole band. Band shows when sector ∈ {all, crypto, stocks} and Boost is OFF.

Container: 1px `rgba(255,138,61,.18)`, bg `rgba(255,138,61,.03)`, radius 16, 3px `#FF8A3D` left rule.

## Anatomy
| Part | Contract |
|---|---|
| Header | `● Live now` eyebrow · `Intraday` title (SG 700, 27px desktop / 19px mobile) · teach line; mobile: selected round-window countdown top-right |
| Quick rounds | one shared segmented dial `[5m 15m 1h 4h 1D]` drives all three coin tiles (BTC/ETH/SOL); tile = avatar + price + CLOSES IN countdown + 120px plot (round-open dashed baseline) + Up/Down cent chips + `LAST 8` bars + volume |
| Stocks closing today | session tabs US (ET) / Hong Kong (HKT); only sessions with live events, never both row sets at once, auto-select the session closest to close; rows → `/spot?event={id}&side={up|down}` |

## AssetAvatar token (`src/components/lite/AssetAvatar.tsx`)
Always a circle. 34px standard / 30px compact, 1px border `rgba(255,255,255,.08)`.
- Crypto: brand fill + glyph — BTC `#F7931A` ₿ white, ETH `#7A86A8` Ξ white, SOL gradient `135deg,#9945FF,#14F195` S dark.
- Equity: `#F2F3F5` fill + static repo logo (contain, 6px padding); fallback = ticker monogram (SG 700, `#101216`). No runtime third-party logo APIs.
