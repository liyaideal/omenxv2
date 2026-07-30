---
name: Two page families
description: Two visual families (BROWSE vs ACCOUNT) define page grammar; Wallet is the reference implementation of ACCOUNT family
type: design
---

# Two page families (LOCKED)

The product deliberately maintains **two visual families**. The perceived inconsistency between Wallet and the Events/Trade pages is intentional, not a defect. This addendum legalizes the split and draws the boundary precisely.

## 1. BROWSE family

Pages: Events list, trade pages, Settled, and other content/browse pages.

- **Editorial opening**: a display-font (`font-display`) headline is the page's first element (PageTitle standard).
- **Surface language**: content sits comparatively "unboxed" on the stage background; cards are content units, not layout containers.

## 2. ACCOUNT family

Pages: Wallet, Portfolio, and future account/data pages.

- **Data opening**: NO text page title; the first screen is data itself.
- **Five grammar rules that define the family**:
  1. **Data opening** — no headline.
  2. **Surface language** — subtle 145° dark card gradients (`--gradient-card` / `trading-card`), hairline borders, 14–18px radii.
  3. **Section headers** — 11px uppercase `tracking-[0.12em]` micro-labels (no display-size text headers).
  4. **Two number voices** — primary numbers in `font-display` bold with tight tracking; detail rows in `font-mono` tabular.
  5. **Furniture** — white-pill active states for tabs/filters, hairline row dividers, capsule tags, PnL colored strictly by the MONEY axis.

## 3. CRITICAL BOUNDARY

The family defines **VISUAL GRAMMAR ONLY**. It does NOT prescribe module arrangement, band structure, or features. Wallet's hero box, X watermark, dual account cards, and 2:1 grid are **Wallet's own content decisions** — NOT family requirements. Each account page's module layout is decided by that page's product design for its own content (e.g. Portfolio keeps its tabs + stats row + positions table). The X watermark is an optional flourish available to account-page heroes, never mandatory.

## 4. Reference implementation

Wallet as currently shipped is the reference implementation of the ACCOUNT family and is approved as-is. Its gradient CTA, colored account tags, and X motif are grandfathered on this page; do not "clean them up" in future rounds without explicit instruction.
