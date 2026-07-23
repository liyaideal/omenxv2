---
name: Campaign landing design system
description: Dedicated design rules for campaign landing pages and banners, separate from product DESIGN.md
type: design
---
Campaign landing pages must use the dedicated `CAMPAIGN_DESIGN.md` and `/campaign-style-guide` system instead of product page patterns.

Rules:
- Keep campaign design separate from product `DESIGN.md`; do not mix campaign microsite patterns into product UI specs.
- Use campaign-system components for new campaign pages and homepage campaign banners.
- Section headers must be vertical: eyebrow → title → description. Never split title and description into two desktop columns unless a signed-off mockup explicitly requires it.
- Avoid generic AI/crypto tropes: rockets, emoji labels, glowing orbs, random purple gradients, floating glass-card collages, fake 3D coins/gifts.
- Campaign pages need one coherent visual metaphor and one primary conversion action.
- Check 1024px+ safe width and carousel overflow before shipping.

- The campaign style guide is a documentation system like `/style-guide`, not a universal landing-page template.
- Future campaigns must not all share the same hero/page skeleton with only copy or artwork swapped.
- Reuse guardrails and primitives, but vary archetype, hero composition, visual metaphor, rhythm, and reward presentation.
- Homepage campaign carousel banners must be structured UI, not baked poster images: configurable DOM text/labels/CTA/metrics on the left, campaign visual slot on the right by default, one CTA, max three slides, 6–8s rotation, pause on hover/focus, and no reward/CTA text embedded inside artwork.

Campaign copy voice (mandatory for all campaign landing pages):
- Never put module/spec codenames in UI: no `Final window`, `Reward Meter`, `Campaign position`, `Account`, `Activation`, `Event 1/Event 2`, `Pre-tier`, `processing`, `settlement rails`, `qualifying trade`. Translate to user language or delete.
- Second person, active voice, verb-first. Prefer "we send you" / "you get" over "rewards are distributed".
- Explain rules with "if you → we will" framing, never passive compliance prose ("the reward window is fixed").
- CTAs must escalate by section context, not repeat the same label everywhere. Hero / floating / final = headline CTA (e.g. `Claim My Bonus`); intermediate sections use action-specific verbs (`Start my first trade`, `Place a trade`, `Start climbing`).
- No self-referential meta copy ("the dashboard now tracks…", "the rules fit on one screen"). Talk about the user's outcome, not the page itself.
