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
