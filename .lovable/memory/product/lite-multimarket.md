---
name: Lite multi-market events
description: Rules for Lite events with 3+ options — market board, per-option Yes/No, multi legs, list-card variant, badge priority
type: feature
---
- **Definition:** multi = `event.options.length > 2`. Every behavior gates on that; binary (exactly 2 options) is untouched.
- **Both sides of every option are buyable.** The No leg is recorded under the derived label `No: {option}` (display layer only — `tradingService.ts` unchanged).
- **Components:** `LiteMarketBoard` (rows + dual-tone strip + Yes/No chips), `LiteBoardChart` (inline accordion under the selected row), `LiteCrowdOverview` (mobile summary).
- **Right rail** binds to the selected option and shows `marketContextLabel`. Mobile has NO sticky buy bar on multi — chips open the drawer.
- **Multiple open legs allowed**, one position card + cash-out each.
- **Interim guard:** opposite side on an option you already hold is blocked via `blockNotice`. Remove when engine per-option netting ships.
- **List cards:** "Live" badge abolished. `New` (Pulse Blue) > `⚡ Boost {max}×` (Volt Green), one badge max. Multi card = top-2 options by chance + `+N markets` footer.
- **Seed events:** `btc-july-range-2026` (5 options), F1 2026 championship (4 options). `social` category boost enabled at 5×.
