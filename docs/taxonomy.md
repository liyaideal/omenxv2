# Event taxonomy

Human-readable mirror of `src/lib/taxonomy.ts`. **The code is the source of
truth** — keep this file in lockstep when the tree changes.

Two rules govern every consumer:

1. **Taxonomy dictates order and grouping.** Category chips, sub-type rows,
   group headers and vertical sections all read from `taxonomy.ts`.
2. **Visibility stays data-driven.** A node renders only when it has live
   markets. The tree never forces an empty chip on screen.

## Top level (in order)

| # | id | Chip label | Kind | DB `events.category` keys |
|---|----|-----------|------|---------------------------|
| 1 | `all` | All | all | — |
| 2 | `intraday` | Intraday | view | — (subtype band) |
| 3 | `sports` | Sports | view | `sports` |
| 4 | `crypto` | Crypto | sector | `crypto` |
| 5 | `finance` | **Finance** | sector | `finance`, `stocks` |
| 6 | `politics` | Politics | sector | `politics` |
| 7 | `macro` | Economy | sector | `macro` |
| 8+ | `tech` / `entertainment` / `social` | Tech / Entertainment / Social | sector | same key |

Then a divider, then **Boost** — a *filter*, not a category (see below).

`Finance` replaces the old top-level `Stocks` chip. Internal event category
keys are unchanged (`stocks` events simply display under Finance); "Stocks"
survives as an asset-class leaf inside Finance.

## Sports

Two levels only. Esports is **flattened**: `LPL` and `LCK` carry a
data-model `parent: "LOL"` field that is never rendered as a third level.

| Group | Leagues |
|---|---|
| Soccer | World Cup, UEFA Champions League (`UCL`), Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Chinese Super League, K League 1 |
| Basketball | NBA |
| Tennis | ATP, WTA |
| UFC | UFC |
| NFL | NFL |
| Esports | LPL, LCK, Dota 2, CS 2 |

The CPO document listed "UCL" twice (once spelled out, once as the code);
deduplicated to a single node `UCL` = *UEFA Champions League*.

League → timezone mapping stays in `sportsData.ts` but is keyed by taxonomy
league codes, not by free-text league names.

## Crypto

Two dimensions, both extensible:

- Timeframes: `5m`, `15m`, `1h`, `4h`, `Daily`
- Coins: `BTC`, `ETH`, `SOL`

## Finance

Two dimensions:

- Asset classes: Indices, Stocks, Commodities, FX
- Regions: US, Hong Kong / China, Korea

## Props buckets

Each vertical (Sports, Crypto, Finance) also owns a **props bucket** — its
non-intraday event catalogue.

> **"Props" is an internal name only.** It must NEVER appear in rendered Lite
> UI — same class as the "Moneyline" ban. Vertical pages use question-style
> section titles instead ("Will it happen?", "Who wins the match?").

## Boost

Boost is an **in-place filter**, never a category and never a route. Tapping
the Boost chip filters the current list to boost-capable contract events,
grouped by category with small group headers in taxonomy order. It composes
with a selected category (Sports + Boost = boostable sports only, no group
headers). Boost stays hidden inside module/channel views.

### Current category config

| Category | Enabled | Max leverage | Notes |
|----------|---------|--------------|-------|
| Crypto | Yes | 10× | Highest cap; continuous price path. |
| Macro | Yes | 5× | |
| Social | Yes | 5× | |
| Sports | Yes | 3× | Enabled 2026-08-06. Conservative cap because sports settle as jump events with no continuous price path; cross-margin shock risk is why it stayed off until now. |
| Entertainment | No | 1× | Explicitly disabled. |
| Tech | No | 1× | Explicitly disabled. |
| Finance | No | 1× | Explicitly disabled (row added 2026-08-06). |
| Politics | No | 1× | Explicitly disabled (row added 2026-08-06). |
| Economy | No | 1× | Explicitly disabled (row added 2026-08-06). |
| Stocks | No | 1× | Explicitly disabled. |

The `finance`, `politics`, and `economy` disabled rows were added explicitly on
2026-08-06 so the intent is recorded in the database rather than relying on the
code fallback (`BOOST_DISABLED`).

### Boost composes with the vertical views

Boost never navigates. Activating the Boost chip while Intraday, Crypto or
Finance is open keeps that view mounted (desktop and 390): header and filter
rows stay, and the engine + catalogue filter through the *same* boost
predicate the generic list uses (`category_boost_configs.enabled && maxBoost >= 2`).
Chips never disappear. With zero boost-capable events the engine grid hides
and the view shows the standard list empty state:
"Nothing boosted here yet — check back soon."

**Forward contract (not built yet).** No boost round data exists today — every
round subtype in the database is `*_SPOT`. When boost rounds arrive:

- they mix into the *same* engine grid as the 1× spot rounds — no separate pool,
  no separate module;
- boost-capable tiles carry the volt "Boost 5×/10×" pill using the existing
  `LiteEventCard` pill grammar;
- trading routes per CHK-8 — 1× rounds open the spot panel (`/spot`), boost
  rounds open the contract order panel (`/trade`). No new trade surface, ever.
