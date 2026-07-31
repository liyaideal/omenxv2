// ============================================================
// Event art direction — LOCKED.
// One IP mascot in a small narrative scene, warm-grey paper ground,
// one brand accent, ultra-wide 21:9 for the 130px card tile.
// See DESIGN.md "Event art direction (LOCKED)".
// ============================================================

export const ART_BUCKET = "event-art";
/** Reference sheet stored in the bucket; inlined as base64 on every call. */
export const ART_REFERENCE_PATH = "_ref/ip-turnaround.png";
/** Signed-URL lifetime written into events.image_url (10 years). */
export const ART_SIGNED_URL_TTL = 60 * 60 * 24 * 3650;

export const IMAGE_MODEL = "google/gemini-3-pro-image";
export const TEXT_MODEL = "openai/gpt-5.6-sol";

/** Target aspect for the card tile (h-[130px] strip, cover-cropped). */
export const ART_ASPECT = 21 / 9;

/** Turns an event title into a compact narrative scene brief. */
export const PROP_SYSTEM_PROMPT = [
  "You write a short SCENE BRIEF for a wide illustration of a cartoon lynx mascot",
  "that represents a prediction-market event. The scene must tell a small story.",
  "Format: '<what the mascot is doing / wearing / holding>; around it: <2-3 environment elements>'.",
  "Rules: max 34 words. No final punctuation. Never describe the mascot itself",
  "(no fur, colour, breed, eyes or expression style). No humans, no readable headline text,",
  "no brand logos spelled out. One hero prop plus a few supporting props that set the place.",
  "Examples:",
  '"Coinbase (COIN) — will close higher today?" -> sitting at a small trading desk holding a COIN ticker board, one paw on chin, guessing; around it: a candle chart pinned to the wall, a coffee cup, scattered paper',
  '"Who wins the 2026 F1 drivers\' championship?" -> standing on a podium step in a racing suit lifting a championship trophy; around it: a checkered flag, a race car nose, falling confetti',
  '"Will the Fed cut rates in September?" -> shrugging behind a lectern holding an oversized percent sign; around it: a wall calendar, a stack of documents, a microphone',
].join(" ");

/**
 * The locked style envelope. `scene` is the only variable part.
 * Accent defaults to Pulse Blue; Volt Green only for bullish/winning semantics.
 */
export function buildImagePrompt(scene: string, accent: "blue" | "green"): string {
  const accentHex = accent === "green" ? "#CFFF4A (volt green)" : "#33D6FF (pulse blue)";
  return [
    "Ultra-wide 21:9 cinematic landscape banner illustration (very wide, short height).",
    "Draw the EXACT same character shown in the reference sheet — same hand-drawn cartoon lynx:",
    "thick black ink outline, dark charcoal fur, tan #B49A6A brow stripes and spots, white whiskers,",
    "black ear tufts, slightly grumpy half-lidded skeptical expression, chibi proportions (big head, small body).",
    "Keep the character identical in every image; only the scene changes.",
    `Scene: the character is ${scene}.`,
    "The environment props are part of the picture — draw them in the same hand-drawn ink style,",
    "spread across the wide frame so the image reads as a small story, not a lone mascot on empty paper.",
    "Ground: flat warm paper grey #F2F2F0 with very subtle paper grain; no room, no horizon line, no vignette.",
    `Colour discipline: charcoal + tan + black line only, plus exactly ONE accent colour ${accentHex}`,
    "used on a single small element. Supporting props stay in the ink/grey family.",
    "Props may keep one essential local colour (e.g. trophy gold).",
    "No rainbow palettes, no gradients, no glow, no shadows on the background.",
    "Composition: the mascot stands centre-right with its FULL body visible and not touching the frame edge;",
    "the left third of the frame holds only quiet low-detail environment (a UI badge is overlaid there);",
    "keep the storytelling detail in the upper two thirds because the bottom is darkened by a UI scrim.",
    "No headline text, no logos, no UI frames, no borders, no watermark, no humans.",
    "Avoid lettering entirely — never draw mirrored, upside-down or garbled words on props.",
  ].join(" ");
}

/** Bullish / winning events get the volt accent; everything else pulse blue. */
export function pickAccent(name: string): "blue" | "green" {
  return /\b(higher|up|win|wins|rally|above|beat|surge)\b/i.test(name) ? "green" : "blue";
}