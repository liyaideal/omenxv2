---
name: Cross-zero reverse order prohibition
description: Trading rule — reverse orders may reduce/close but cannot cross zero into a new opposite position
type: feature
---
For the same canonical YES-axis market, reverse orders are allowed only up to the current position size. They are classified before margin checks:

1. Same direction open/add requires incremental initial margin.
2. Opposite direction reduce/flat-close requires zero incremental initial margin and releases proportional margin immediately.
3. Opposite direction beyond current size is blocked; users must close to zero before opening the opposite side.

Binary markets use the Yes-only model first: No Long -> Yes Short and No Short -> Yes Long. Mobile page preview and desktop dialog preview must both enforce this rule.

Margin semantics: keep traded notional separate from opening risk notional. Traded notional is qty * clicked UI price and is used for trade records/fees/display. Incremental opening margin is computed only from the net-risk-increasing slice after canonicalization. Reduce/flat-close slices always have incremental IM = 0 and release proportional existing margin. Blocked cross-zero may calculate the increase remainder for explanation, but execution remains blocked until the position is flat.
