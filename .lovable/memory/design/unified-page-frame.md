---
name: Unified page frame
description: Every desktop product page body uses max-w-7xl px-4 lg:px-6, aligning content edge with the nav logo; px-8 gutters banned
type: design
---
Approved by Liya (R3b-2 round 11).

- Desktop product page container: `max-w-7xl` + `px-4 lg:px-6` — identical to `EventsDesktopHeader`'s inner container, so content left edge sits exactly under the nav logo.
- Vertical padding unchanged: product pages `py-10`; Lite trade/list pages `py-6` (documented exemption).
- Mobile gutter: `px-4 py-4`/`py-6`.
- **Banned:** `px-8` outer gutter, custom max-widths (`max-w-6xl` etc.) on product pages.
- Exempt: Settings (`max-w-3xl` form column), SeoPageLayout pages, Leaderboard hero, Pro trading terminals.
