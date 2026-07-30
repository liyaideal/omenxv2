---
name: Lite forbidden-words exceptions
description: Approved exceptions to the Lite consumer-copy forbidden-word rule; the Pro escape-hatch line must never be rewritten
type: constraint
---

# Lite forbidden-words — approved exceptions

The Lite surface bans trader jargon in rendered copy ("Resolved", "Position", "PnL", "Not Up", leverage/order-book language, …). The following strings are **approved exceptions** and must NOT be "fixed" by future copy sweeps.

## 1. Pro escape hatch (LiteEventsPage footer)

Byte-identical, keep as is:

> Want charts, leverage and the order book? Switch to Pro mode

**Why:** Liya approved it explicitly. This line is the doorway *to* Pro, so naming Pro concepts is the point — it tells a Lite user exactly what they get by switching. Rewriting it into Lite vocabulary makes the escape hatch meaningless.

**How to apply:** any copy audit that flags "leverage" / "order book" on `src/pages/lite/LiteEventsPage.tsx` ends there — no change.
