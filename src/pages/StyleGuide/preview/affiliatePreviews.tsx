// ============================================================
// /affiliate — style-guide previews. Every export mounts the PRODUCTION
// component (no hand-copied markup, no hand-written chrome); fixtures only pick a state.
// ============================================================
import { useIsMobile } from "@/hooks/use-mobile";
import AffiliatePage from "@/pages/AffiliatePage";
import { EarningsLedger } from "@/components/affiliate/EarningsLedger";
import { FeeBaseComparison } from "@/components/affiliate/FeeBaseComparison";
import { AffiliateFaq } from "@/components/affiliate/AffiliateFaq";
import { AffiliateArt } from "@/components/affiliate/AffiliateArt";
import { AffiliateHeroLoop } from "@/components/affiliate/AffiliateHeroLoop";
import { AffiliateDotNav } from "@/components/affiliate/AffiliateDotNav";
import { useAffiliateCta, type AffiliateCtaState } from "@/components/affiliate/useAffiliateCta";
import { AffiliateApplyButton, AffiliateApplyLink } from "@/components/affiliate/AffiliateApplyCta";
import { HERO, EARNINGS_END, STEPS_HEAD, APPLY } from "@/components/affiliate/affiliateContent";

/** Whole page, real route component — desktop frame renders desktop, 375 frame renders AffiliatePageMobile. */
export const AffiliatePagePreview = () => <AffiliatePage />;

/** 02.1 ledger — `stacked` follows the frame's real breakpoint. */
export const AffiliateEarningsLedgerPreview = () => {
  const isMobile = useIsMobile();
  return <EarningsLedger stacked={isMobile} />;
};

/** 02.2 benchmark — `stacked` follows the frame's real breakpoint. */
export const AffiliateFeeBasePreview = () => {
  const isMobile = useIsMobile();
  return <FeeBaseComparison stacked={isMobile} />;
};

/** FAQ — production AffiliateFaq; fixture picks the open item. */
export const AffiliateFaqCollapsedPreview = () => {
  const isMobile = useIsMobile();
  return <AffiliateFaq defaultOpen={null} size={isMobile ? "md" : "lg"} className="px-5" />;
};
export const AffiliateFaqExpandedPreview = () => {
  const isMobile = useIsMobile();
  return <AffiliateFaq defaultOpen="faq-0" size={isMobile ? "md" : "lg"} className="px-5" />;
};

/** Hero X visual — production AffiliateHeroLoop (video loop, screen-blended) + one AffiliateArt slot. */
export const AffiliateHeroArtPreview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <AffiliateHeroLoop variant={isMobile ? "mobile" : "desktop"} />
      <AffiliateArt name="earn-band-desktop" width={1440} height={260} className="w-full" />
    </div>
  );
};

/** Desktop dot rail — production AffiliateDotNav un-fixed for the frame (no sections mounted → 01 stays active). */
export const AffiliateDotNavPreview = () => (
  <div className="flex items-center gap-10 p-6">
    <AffiliateDotNav className="relative left-0 top-0 flex translate-y-0" />
    <p className="max-w-xs font-sans text-xs leading-5 text-muted-foreground">
      Fixed at left:40px / vertically centred on the real page; shown only from 1400px viewport width. One row per jump link (01–06);
      the in-view section shows its number + 7.7px cyan dot, others a 4.8px #646972 dot.
    </p>
  </div>
);

/** Apply CTA family in one forced state — production button/link + the real overlays (click to open them). */
const CtaFamily = ({ state, open }: { state: AffiliateCtaState; open?: "portal" | "auth" }) => {
  const cta = useAffiliateCta(state, open);
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <AffiliateApplyButton cta={cta} label={HERO.primaryCta} />
      <AffiliateApplyButton cta={cta} label={STEPS_HEAD.cta} className="h-11 px-5 text-base" />
      <AffiliateApplyLink cta={cta} label={EARNINGS_END.cta} className="text-[22px] leading-[21px]" />
      <AffiliateApplyButton cta={cta} label={APPLY.cta} className="px-7" />
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">state · {state}</p>
      {cta.overlays}
    </div>
  );
};
export const AffiliateCtaGuestPreview = () => <CtaFamily state="guest" />;
export const AffiliateCtaMemberPreview = () => <CtaFamily state="member" />;
export const AffiliateCtaAffiliatePreview = () => <CtaFamily state="affiliate" />;
export const AffiliateCtaPortalNoticePreview = () => <CtaFamily state="affiliate" open="portal" />;
