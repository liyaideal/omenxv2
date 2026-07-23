## Goal
Replace the category-based background images on Lite event cards with per-event AI-generated artwork, so each card has a unique, on-topic visual.

## Approach

### 1. Generation (one-off script, run in build mode)
- Query all active events from Supabase (`events` where `is_resolved=false`) — currently ~21.
- For each event, call the AI Gateway image endpoint (`google/gemini-3.1-flash-image`, fast + good quality, 1024x512 landscape to match the 130px tile aspect).
- Prompt template per event:
  > "Editorial hero illustration for a prediction market card about: '{event.name}'. Category: {category}. Dark near-black background (#0A0B0D base), subtle Pulse Blue (#33D6FF) and Volt Green (#CFFF4A) accent lighting. Cinematic, minimal, no text, no logos, no watermarks."
- Save as JPGs to `public/event-images/{event.id}.jpg` (committed to repo — simple, no bucket, cacheable via CDN).

### 2. DB wiring
- Add nullable `image_url TEXT` column to `events` via migration (with GRANT preserved).
- After generation, update each event row with `image_url = '/event-images/{id}.jpg'`.
- Extend `DatabaseEvent` type in `useActiveEvents.ts` and pass through `EventRow.imageUrl` in `useMarketListData.ts`.

### 3. Card rendering
- `LiteEventCard.tsx`: prefer `market.imageUrl` when present; fall back to the existing category → `/card-bg/*.jpg` map, then striped fallback.
- Keep the scrim gradient and tag pill unchanged.

### 4. Guardrails
- Display-layer + one additive column only. No changes to trading, wallet, or Pro paths.
- Skip regeneration if the JPG already exists (idempotent script).
- If gen fails for an event, leave `image_url` null → card falls back to category image.

## Open question (blocking)
Which model tier do you want?
- **Fast** (`google/gemini-3.1-flash-image`) — ~2s/image, ~$0.02 each, good quality. Default.
- **Premium** (`google/gemini-3-pro-image` or `openai/gpt-image-2` high) — sharper, more art-directed, ~10x cost.

I'll default to **fast** unless you say otherwise, then run the script over all ~21 events in one pass.
