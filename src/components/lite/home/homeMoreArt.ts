// More markets · cover art for the Lovable demo events (2026-11-18).
// On mainnet every long-dated event ships with a designer-made cover in `events.image_url`
// (e.g. the Anthropic valuation event already carries one) — nothing here is needed there.
// The Lovable demo events still carry older covers, so the five pieces drawn in Figma
// (omenx_lite 1537:8507, raw fills) are matched to them by event id for this section only.
import anthropic from "@/assets/home/more/anthropic-valuation.webp";
import bestAi from "@/assets/home/more/best-ai-model.webp";
import gpt6 from "@/assets/home/more/gpt6-release.webp";
import president from "@/assets/home/more/us-president-2028.webp";
import fed from "@/assets/home/more/fed-rate-hike.webp";

export const MORE_ART = { anthropic, bestAi, gpt6, president, fed };

export const MORE_ART_BY_EVENT: Record<string, string> = {
  "best-ai-model-eoy-2026": bestAi,
  "gpt6-release-window-2026": gpt6,
  "us-president-2028": president,
  "fed-rate-hike-2026": fed,
};
