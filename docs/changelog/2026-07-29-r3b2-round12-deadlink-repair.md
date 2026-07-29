# 2026-07-29 — R3b-2 round 12: dead-link repair pack

1. **Portfolio → Lite trade routing** (`src/pages/Portfolio.tsx`)
   - Added `resolveEventId(optionId, eventName)`: cached `useActiveEvents` name map first, then `event_options.event_id` by `option_id`, then `events.id` by `name`.
   - On `surface === "lite"`, futures rows navigate `/trade?event=<id>` on both devices; failure falls through to prior behavior. Spot rows keep `/spot?event=`.
   - Pro surface behavior unchanged (state highlight; `/trade/order` on mobile).
   - `PortfolioSettlements.tsx` has no trade-navigation sibling — untouched.
2. **Bare /trade safety**
   - `src/App.tsx`: `TradeOrderPage` redirects Lite users to `/trade`.
   - `LiteContractTrade.tsx` / `LiteSpotTrade.tsx`: empty `?event=` → `<Navigate to="/events" replace />`; unknown ids keep `ExpiredEventFallback`.
   - `BottomNav.tsx`: Trade tab targets `/events` on Lite.
3. **Desktop logo** now navigates `/` instead of `/style-guide`.
4. **Referral menu entries removed** from `EventsDesktopHeader` dropdown and `BottomNav` drawer (route does not exist); hooks/logic untouched.
