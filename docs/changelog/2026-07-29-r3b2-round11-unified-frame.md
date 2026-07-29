# R3b-2 round 11 — Unified page frame + cleanups (2026-07-29)

## 1 · Single page frame (`max-w-7xl px-4 lg:px-6`)
`px-8` desktop gutter abolished; content edge now aligns with the nav logo.

| File | Before → After |
|---|---|
| EventsPage.tsx:300 | `max-w-7xl overflow-hidden px-8 pt-6` → `px-4 pt-6 lg:px-6` |
| EventsPage.tsx:305 | `max-w-7xl px-8 py-10` → `max-w-7xl px-4 py-10 lg:px-6` |
| ResolvedPage.tsx:99 | `px-8 py-10 max-w-7xl` → `px-4 py-10 lg:px-6 max-w-7xl` |
| Portfolio.tsx:284 / PortfolioSettlements.tsx:271 / PortfolioAirdrops.tsx:172 | same swap |
| Wallet.tsx:861 | `max-w-7xl px-8 py-10 space-y-[18px]` → `px-4 py-10 lg:px-6` |
| Vouchers.tsx:118, Rewards.tsx:224, TransparencyPage.tsx:133 & 229, ApiManagement.tsx:124 | same swap |
| LiteEventsPage.tsx:64 | `max-w-6xl px-4 pb-24 pt-6` + `px-3 pt-3` / `px-8 pt-8` → `max-w-7xl pb-24` + mobile `px-4 py-4` / desktop `px-4 py-6 lg:px-6` |

Not touched (out of scope by rule): Settings (max-w-3xl), SettlementDetail (max-w-4xl), ResolvedEventDetail (max-w-6xl), StyleGuide, LoginPrompt, SeoPageLayout, DevelopersPage/campaign/mainnet bands, Pro terminals.

## 2 · MobileHome duplicate `<BottomNav />` removed.

## 3 · Dead files deleted
- `src/pages/Index.tsx` (grep `pages/Index` → no references)
- `src/pages/FontPreview.tsx` + its import and `/font-preview` route in App.tsx

## Docs
DESIGN.md §4 container canon rewritten; `.lovable/memory/design/unified-page-frame.md` added.
