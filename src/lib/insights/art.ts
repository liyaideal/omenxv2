/**
 * Insights editorial illustrations — brand backflow 2026-10-12 (Figma omenx_lite, pc section 1004:3314 / mobile section 1004:3315).
 * Every file is the Figma frame exported flat at 2× (fade-to-page-bg gradients baked in), converted to WebP q86.
 * Sizes below are the Figma frame sizes at 1× — the page renders each at exactly that CSS size on ≥ md, full-width on mobile.
 */
import heroMarketPc from "@/assets/insights/hero-market-pc.webp";
import heroMarketMobile from "@/assets/insights/hero-market-mobile.webp";
import heroCryptoPc from "@/assets/insights/hero-crypto-pc.webp";
import heroStocksPc from "@/assets/insights/hero-stocks-pc.webp";
import heroSportsPc from "@/assets/insights/hero-sports-pc.webp";
import heroEventsPc from "@/assets/insights/hero-events-pc.webp";
import heroEventsMobile from "@/assets/insights/hero-events-mobile.webp";
import heroCrowdPc from "@/assets/insights/hero-crowd-pc.webp";
import heroDailyPc from "@/assets/insights/hero-daily-pc.webp";
import heroDailyMobile from "@/assets/insights/hero-daily-mobile.webp";
import secCryptoPc from "@/assets/insights/section-crypto-pc.webp";
import secCryptoMobile from "@/assets/insights/section-crypto-mobile.webp";
import secStocksPc from "@/assets/insights/section-stocks-pc.webp";
import secStocksMobile from "@/assets/insights/section-stocks-mobile.webp";
import secSportsPc from "@/assets/insights/section-sports-pc.webp";
import secSportsMobile from "@/assets/insights/section-sports-mobile.webp";
import secEventsPc from "@/assets/insights/section-events-pc.webp";
import secEventsMobile from "@/assets/insights/section-events-mobile.webp";
import secCrowdPc from "@/assets/insights/section-crowd-pc.webp";
import secCrowdMobile from "@/assets/insights/section-crowd-mobile.webp";

export interface Art { pc: string; w: number; h: number; mobile: string; mw: number; mh: number }

/** Page-head illustrations (right of the H1 on desktop; full-width band under the lede on mobile). Figma node ids in comments. */
export const HERO_ART = {
  market: { pc: heroMarketPc, w: 456, h: 341, mobile: heroMarketMobile, mw: 342, mh: 256 },   // 1000:10494 / 1004:38
  crypto: { pc: heroCryptoPc, w: 532, h: 241, mobile: secCryptoMobile, mw: 342, mh: 164 },    // 1001:14820 / 1004:590
  stocks: { pc: heroStocksPc, w: 612, h: 300, mobile: secStocksMobile, mw: 342, mh: 164 },    // 1001:15390 / 1004:1068
  sports: { pc: heroSportsPc, w: 532, h: 300, mobile: secSportsMobile, mw: 342, mh: 164 },    // 1001:15940 / 1004:1484
  events: { pc: heroEventsPc, w: 532, h: 300, mobile: heroEventsMobile, mw: 342, mh: 164 },   // 1001:16610 / 1004:2099
  crowd: { pc: heroCrowdPc, w: 532, h: 300, mobile: secCrowdMobile, mw: 342, mh: 164 },       // 1001:17082 / 1004:2440
  daily: { pc: heroDailyPc, w: 532, h: 240, mobile: heroDailyMobile, mw: 342, mh: 164 },      // 1001:17503 / 1004:2800
} satisfies Record<string, Art>;

/** Home section illustrations (right of the section heading on desktop; band under the link on mobile). */
export const SECTION_ART = {
  crypto: { pc: secCryptoPc, w: 745, h: 162, mobile: secCryptoMobile, mw: 342, mh: 164 },     // 1000:10545 / 1004:70
  stocks: { pc: secStocksPc, w: 745, h: 163, mobile: secStocksMobile, mw: 342, mh: 164 },     // 1000:10645 / 1004:137
  sports: { pc: secSportsPc, w: 745, h: 163, mobile: secSportsMobile, mw: 342, mh: 164 },     // 1000:10835 / 1004:251
  events: { pc: secEventsPc, w: 745, h: 163, mobile: secEventsMobile, mw: 342, mh: 164 },     // 1000:11021 / 1004:358
  crowd: { pc: secCrowdPc, w: 745, h: 163, mobile: secCrowdMobile, mw: 342, mh: 164 },        // 1000:11203 / 1004:410
} satisfies Record<string, Art>;
