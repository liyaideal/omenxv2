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
import { AffiliateDotNav } from "@/components/affiliate/AffiliateDotNav";

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

/** Hero art slot — dev placeholder until the owner drops the file into src/assets/affiliate/, then the real asset. */
export const AffiliateHeroArtPreview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="p-6 flex justify-center">
      {isMobile ? (
        <AffiliateArt name="hero-x-mobile" width={342} height={257} className="w-full" />
      ) : (
        <AffiliateArt name="hero-x-desktop" width={661} height={496} fit="contain" className="w-full max-w-lg" />
      )}
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
