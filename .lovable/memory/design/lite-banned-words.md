---
name: Lite banned words
description: Rendered Lite copy bans trader jargon; "Props" (taxonomy bucket) and "Moneyline" are internal-only names
type: constraint
---

# Lite banned words

Never render in Lite UI: Margin, Liquidation, Funding, Leverage, Long, Short,
Spot, Futures, Order book, Limit, **Moneyline**, **Props**.
(Account nouns Spot/Futures are exempt. The Pro escape-hatch line is an
approved exception — see `mem://design/lite-forbidden-words-exceptions`.)

**Props** is the INTERNAL name of a vertical's non-intraday event catalogue
(`PROPS_BUCKET` in `src/lib/taxonomy.ts`). Vertical pages must use
question-style section titles instead ("Will it happen?", "Who wins the
match?").

**Why:** Lite is a consumer surface; jargon and internal bucket names break the
plain-language contract. Table lives in `docs/copy-dictionary.md`.
