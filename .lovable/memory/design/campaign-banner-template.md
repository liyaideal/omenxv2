---
name: Campaign banner unified template
description: Homepage campaign banner standard — full-card cinematic background image with left gradient mask, fallback bordered tile visual
type: design
---

All homepage campaign banners must use the unified `CampaignBannerCarousel` template in `src/components/campaign/CampaignBannerCarousel.tsx`.

## Layout skeleton (fixed)

3-layer card on desktop:
1. Full-card background image (`object-cover object-right`)
2. Left→right surface gradient mask (`from-{surface} from-30% via-{surface}/85 via-55% to-transparent`) — guarantees text contrast on the left
3. Dotted grid overlay at 15% opacity (vs 30% when no bg image)

Content column sits on top, constrained to `sm:max-w-[60%]`:
- `[qualifierChip?][countdown? on mobile]` meta row
- title (≤7 words)
- heroMetric (one number + label)
- CTA button + optional countdown

## Differentiation per campaign comes from only three things

1. `theme: "gold" | "primary" | "green" | "violet"` — drives metric color, CTA color, border, gradient mask color
2. `backgroundImage: string` — **preferred**. Full-card cinematic image meeting the spec below
3. `visual: ReactNode` — fallback only. Pick from `DiagramVisual` / `HeroObjectVisual` when no `backgroundImage` exists yet

## Core principle (read first)

A banner is **NOT** a redraw, restyle, or crop of the campaign's main visual. It is the **same world, camera pulled back**. The original main visual is **pasted in pixel-faithful** (text, logos, engravings, materials, lighting, all kept as-is) and AI **only generates the surrounding environment** to extend it into a 21:9 ultra-wide cinematic scene with a black left zone for text overlay.

If the agent ever finds itself describing the subject's shape/material/text in the prompt, it's wrong — the subject is the uploaded image, not a description.

## Background image hard requirements (verification checklist)

Every new banner image must pass all of these before being committed:

1. **Aspect ratio**: 21:9 ultra-wide, minimum 2520×1080 (or 1920×823). The desktop banner card itself is ~5:1, so a 21:9 source crops cleanly with minimal loss; 16:9 sources get over-cropped vertically and the subject loses ~40% of its body.
2. **Main visual placement**: the uploaded reference image is placed **uncropped, unedited, pixel-faithful** anchored to RIGHT 25-32% of the frame, vertically centered, fully contained (no bleed off any edge). All its original text/logos/engravings remain fully visible and legible. Subject must look complete (head + body + base all visible).
3. **Left dark zone**: LEFT 60%+ must be pure black (#0A0A0A) — no light spill, particles, objects, or text. Reserved for UI text overlay.
4. **Environment**: extended outward from the reference — same atmosphere, same DOF, same particle/bokeh behavior, same color temperature. Seamlessly continued, like the camera zoomed out horizontally.
5. **Light**: identical to the reference. No relighting, no new hues, no color shift on the subject.
6. **Forbidden additions**: NO new text, letters, numbers, logos, watermarks, UI cards, charts, icons, badges, frames, borders, rounded corners, drop shadows, sticker outlines, emoji, human figures, or new foreground objects added by AI. The ONLY text/logos/symbols allowed are those already inside the uploaded reference.
7. **File**: `.jpg`, <500KB, named `banner-{campaign-id}.jpg`, stored in `src/assets/`
8. **Mobile**: same 21:9 image is rendered on mobile via `object-cover object-center` — the subject sits in the right third, mobile crop will show roughly the middle-right portion of the image. Verify mobile preview shows the subject mostly intact.

## Reusable AI prompt template (image-to-image, "extend the world")

The prompt has TWO parts:
- **Fixed scaffold** (camera framing, subject preservation, hard constraints) — never changes.
- **Per-campaign environment block** (3 slots: SCENE, LIGHT, COLOR) — describes the world the camera is pulling back to reveal. Without this the AI defaults to empty black space and the banner looks dead.

Critical rule: NEVER describe the subject (its shape, material, engravings, text). The subject is the uploaded reference and must stay pixel-faithful. The 3 slots describe ONLY the surrounding world.

```
[Image-to-image extension]

Reference image: [user uploads the campaign's main visual — this IS the subject]

Task: Treat the uploaded image as the CENTERPIECE of a wider 21:9 ultra-wide cinematic scene. Do NOT modify, recreate, restyle, recolor, or remove ANY part of the uploaded image — including all text, typography, logos, engravings, symbols, materials, colors, and lighting. The uploaded image must appear inside the output exactly as-is, pixel-faithful, as if pasted in.

Camera / framing:
- Pull the camera back to a wide 21:9 view (minimum 2520x1080).
- Place the uploaded image (unchanged, uncropped, fully contained) anchored to the RIGHT side, occupying roughly the right 25-32% of the canvas, vertically centered, slight tilt allowed. The subject must be fully visible (top, bottom, both sides not clipped).
- Do NOT crop, zoom into, rotate beyond a slight tilt, mirror, or alter the uploaded image. All its original text and details must remain fully visible and legible.

Scene extension (this is the only thing AI generates — fill in the per-campaign world below):
- Behind and beneath the subject, build out this environment: {SCENE_CONTEXT}. Out of focus, shallow depth of field, environmental depth and weight. The world must feel like it naturally extends from the subject's surface and lighting.
- LEFT 60% of the frame must fade to PURE SOLID BLACK (#0A0A0A) — empty negative space reserved for text overlay. No subject, no particles, no glow, no light spill, no texture, no gradient banding. The environment on the right fades smoothly into solid black on the left.

Lighting & color:
- {LIGHT_DIRECTION_AND_COLOR}, dramatic falloff, cinematic product still life mood (think Wong Kar-wai meets luxury advertising).
- Monochromatic palette: {DOMINANT_COLOR} + black only. No other colors anywhere in the canvas.
- Lighting on the subject itself stays identical to the source — no relighting, no color shift on the subject.

Hard constraints:
- Do NOT add any new text, typography, logos, UI cards, charts, icons, badges, frames, borders, stickers, watermarks, human figures, or new foreground objects anywhere in the canvas.
- The ONLY text/logos/symbols allowed are those already inside the uploaded reference, kept exactly as-is.
- Everything you generate is background environment only.

Output: 21:9 ultra-wide, photorealistic, cinematic, render style matched exactly to the source.
```

### Slot examples (per campaign)

**Mainnet Launch (gold OMENX coin):**
- `SCENE_CONTEXT` → `"a pile of stacked gold coins (OMENX-style and USDC-style) scattered on a dark reflective surface, out of focus"`
- `LIGHT_DIRECTION_AND_COLOR` → `"single warm gold rim light from upper-right"`
- `DOMINANT_COLOR` → `"warm gold"`

**Hedge (purple neon protective chamber):**
- `SCENE_CONTEXT` → `"faint volumetric violet fog, soft purple bokeh orbs, subtle hexagonal grid reflections on a dark wet floor, out of focus"`
- `LIGHT_DIRECTION_AND_COLOR` → `"cool neon purple rim light from upper-right with soft violet underglow"`
- `DOMINANT_COLOR` → `"electric violet/purple"`

When asked for a new banner prompt, the agent fills these 3 slots based on the campaign's main visual world, runs the prompt through `scripts/validate-banner-prompt.mjs`, then hands prompt + reference image to the user.

## Iteration workflow

1. Pick campaign + main visual reference → ask agent for the filled prompt
2. **Validate the prompt** with `node scripts/validate-banner-prompt.mjs <file|--text "...">`. Must exit 0. The validator enforces: pixel-faithful preservation, original text/logo retention, right 35–45% anchor, left 55% pure black, environment-only extension, 16:9, no AI-added text/UI/humans, no subject re-description.
3. Run prompt + reference through nano banana / gemini-3-pro-image-preview
4. Send the chosen image back to agent
5. Agent saves to `src/assets/banner-{id}.jpg` and adds the banner config with `backgroundImage`

## Copy limits (hard)

- title ≤ 7 words
- ctaLabel ≤ 2 words
- heroMetric.value ≤ 6 chars
- qualifierChip.text ≤ 3 words

## Meta row chip rules (qualifierChip)

Meta row holds at most ONE chip. Test before adding: "Can the user infer this from the title or heroMetric?" If yes → don't add it.

**Allowed:**
1. Eligibility gate — `No deposit`, `New users only`, `Verified only`
2. Effort required — `One trade`, `5 minutes`, `First deposit`
3. Scarcity — `5 winners weekly`, `First 1,000 users`, `Limited slots`

**Forbidden:**
- In-app status (`Live`, `Active`, `Open`) — always true, zero info
- Campaign category names (`Mainnet Launch`) — duplicates title
- Any monetary amount — that's heroMetric's job
- Fabricated social proof (`2,341 joined`)

If no compliant chip exists, omit it.

## Mobile layout

- Background image IS rendered on mobile (full-card with left surface gradient mask)
- Single column, CTA full-width
- Countdown moves into meta row top-right (not below CTA)
- No `absolute` positioned elements in CTA row

## Forbidden

- Per-banner bespoke layouts (e.g. `isLaunch` branches)
- More than one heroMetric, subtitles, or descriptions
- Embedding text/CTA inside artwork
- Background images that violate the hard requirements above
