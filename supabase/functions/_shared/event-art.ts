// ============================================================
// Event art direction — LOCKED.
// One IP mascot, one warm-grey paper ground, one brand accent.
// See DESIGN.md "Event art direction (LOCKED)".
// ============================================================

export const ART_BUCKET = "event-art";
/** Reference sheet stored in the bucket; inlined as base64 on every call. */
export const ART_REFERENCE_PATH = "_ref/ip-turnaround.png";
/** Signed-URL lifetime written into events.image_url (10 years). */
export const ART_SIGNED_URL_TTL = 60 * 60 * 24 * 3650;

export const IMAGE_MODEL = "google/gemini-3-pro-image";
export const TEXT_MODEL = "openai/gpt-5.6-sol";

/** Turns an event title into a single "prop + pose" clause. */
export const PROP_SYSTEM_PROMPT = [
  "You write one short clause describing what a cartoon lynx mascot is holding/wearing and its pose,",
  "for an illustration that represents a prediction-market event.",
  "Rules: max 18 words. No sentences, no punctuation at the end, no mascot description",
  "(never mention fur, colour, breed, eyes or expression style), no background, no text-on-image,",
  "no humans, no brand logos spelled out as text. Prefer one clear iconic prop.",
  "Examples:",
  '"Coinbase (COIN) — will close higher today?" -> holding a small COIN ticker board, one paw on chin, thinking',
  '"Who wins the 2026 F1 drivers\' championship?" -> wearing a racing suit and lifting a golden championship trophy',
  '"Will the Fed cut rates in September?" -> holding an oversized percent-sign sign, shrugging',
].join(" ");

/**
 * The locked style envelope. `prop` is the only variable part.
 * Accent defaults to Pulse Blue; Volt Green only for bullish/winning semantics.
 */
export function buildImagePrompt(prop: string, accent: "blue" | "green"): string {
  const accentHex = accent === "green" ? "#CFFF4A (volt green)" : "#33D6FF (pulse blue)";
  return [
    "Draw the EXACT same character shown in the reference sheet — same hand-drawn cartoon lynx:",
    "thick black ink outline, dark charcoal fur, tan #B49A6A brow stripes and spots, white whiskers,",
    "black ear tufts, slightly grumpy half-lidded skeptical expression, chibi proportions (big head, small body).",
    "Keep the character identical in every image; only the prop and pose change.",
    `The character is: ${prop}.`,
    "Background: flat warm paper grey #F2F2F0 with very subtle paper grain, nothing else.",
    `Colour discipline: charcoal + tan + black line only, plus exactly ONE accent colour ${accentHex}`,
    "used on a single small element. Props may keep one essential local colour (e.g. trophy gold).",
    "No rainbow palettes, no gradients, no glow, no shadows on the background.",
    "Composition: single character centred, full body visible, generous margins, square 1:1 framing.",
    "Absolutely no text, no letters, no numbers, no logos, no UI frames, no borders, no watermark, no humans.",
  ].join(" ");
}

/** Bullish / winning events get the volt accent; everything else pulse blue. */
export function pickAccent(name: string): "blue" | "green" {
  return /\b(higher|up|win|wins|rally|above|beat|surge)\b/i.test(name) ? "green" : "blue";
}