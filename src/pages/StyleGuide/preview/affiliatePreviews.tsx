// ============================================================
// /affiliate — style-guide previews. Every export mounts the PRODUCTION
// component (no hand-copied markup, no hand-written chrome); fixtures only pick a state.
// ============================================================
import { useIsMobile } from "@/hooks/use-mobile";
import AffiliatePage from "@/pages/AffiliatePage";
import { EarningsLedger } from "@/components/affiliate/EarningsLedger";
import { FeeBaseComparison } from "@/components/affiliate/FeeBaseComparison";
import { AffiliateFaq } from "@/components/affiliate/AffiliateFaq";
import { AffiliateHeroArt } from "@/components/affiliate/AffiliateHeroArt";

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

/** Hero art slot — dev placeholder until the illustration lands, then the real asset. */
export const AffiliateHeroArtPreview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="p-6 flex justify-center">
      <AffiliateHeroArt variant={isMobile ? "mobile" : "desktop"} caption="Sports / Crypto / Finance" className={isMobile ? "w-full" : "w-[420px]"} />
    </div>
  );
};
