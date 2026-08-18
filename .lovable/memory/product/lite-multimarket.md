---
name: Lite multi-market events
description: Rules for Lite events with 3+ options — market board, per-option Yes/No, multi legs, list-card variant, badge priority
type: feature
---
- **Definition:** multi = `event.options.length > 2`. Every behavior gates on that; binary (exactly 2 options) is untouched.
- **Both sides of every option are buyable.** Since Round 22 the No leg is submitted as `side:"sell"` at the no-axis price on the SAME option, stored as a `short` under the plain option label. A leg is "No" when `type === "short"` (legacy `No: {option}` labels still read as No).
- **Components:** `LiteMarketBoard` (rows + dual-tone strip + Yes/No chips), `LiteBoardChart` (inline accordion under the selected row), `LiteCrowdOverview` (mobile summary).
- **Row→chart boundary (Round 27): NO divider line of any kind** — the Round-23 dashed seam is deleted. Boundary = shared `--yes/55` side borders + darker panel bg `#0C1216` + ~6px extra top padding. Applies to desktop and compact/mobile.
- **Right rail** binds to the selected option and shows `marketContextLabel`. Mobile has NO sticky buy bar on multi — chips open the drawer.
- **Multiple open legs allowed**, one position card + cash-out each.
- **Per-option netting (Round 22):** buying the opposite side of an option you hold nets it down first and may FLIP (remainder opens the new side) in one balanceDelta. The interim `blockNotice` guard is gone. Notice copy: "Buying {side} cashes out your {opposite} on this market first." Partial nets also disclose "Est. auto-close (new position)" for the remainder leg only.
- **List cards:** "Live" badge abolished. `New` (Pulse Blue) > `⚡ Boost {max}×` (Volt Green), one badge max. Multi card = top-2 options by chance + `+N markets` footer.
- **Seed events:** `btc-july-range-2026` (5 options), F1 2026 championship (4 options). `social` category boost enabled at 5×.
- **Fixture groups (2026-08-17):** multi = `event.options.length > 2` **OR** the event has sibling events sharing `metadata.fixture_id`. A fixture renders grouped rows on the SAME `LiteMarketBoard` — Winner → Handicap → Total goals — each group headed by `LiteBoardGroupHeader` and each line group carrying one row + `LiteLineScrubber` (discrete line switch, no drag). Chip words come from the sibling's `side_labels`; the order rail binds to the selected sibling event. Deep links to a line market bounce to `/trade?event=<winner>&line=<sibling>`.
- **Sports lines v1.1 (2026-08-18):** EVERY soccer fixture carries the three groups — `ensure_soccer_lines(fixture_id)` creates the 4 handicap + 5 total siblings, `soccer_line_prices()` derives their yes-prices from the winner's 1X2 (tanh handicap curve, Poisson λ=2.6 totals), and `roll_sports_matches()` samples one synthetic score per fixture so winner/handicap/total settle consistently and reschedule together. Soccer detection = `metadata.sport='soccer'` OR `format='1x2'` OR `public.sports_league_map`. 3-option winner prices always sum to exactly 1.0 (`sim_price_tick` renormalises).
- **Priced buttons (site-wide Lite, 2026-08-18):** any button carrying a price is label-left / price-right (`justify-between`, mono price); unpriced labels stay centered. Stacked mobile `BuyButton` is the exception.
