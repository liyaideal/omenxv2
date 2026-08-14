// Lite events loading skeletons — real production components, mock-free.
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LiteAllStageSkeleton,
  LiteMarketGridSkeleton,
  LiteMarketListSkeleton,
  LiteMobileStageSkeleton,
} from "@/components/lite/skeletons/LiteEventsSkeletons";

/** Full first-load composition of /events, responsive like production. */
export const LiteEventsLoadingPreview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col gap-6 bg-[#0A0B0D] p-4">
      {isMobile ? <LiteMobileStageSkeleton /> : <LiteAllStageSkeleton />}
      {isMobile ? <LiteMarketListSkeleton count={2} /> : <LiteMarketGridSkeleton count={3} />}
    </div>
  );
};

/** Catalogue-only skeleton (sector / watchlist views). */
export const LiteEventsCatalogueLoadingPreview = () => {
  const isMobile = useIsMobile();
  return (
    <div className="bg-[#0A0B0D] p-4">
      {isMobile ? <LiteMarketListSkeleton count={3} /> : <LiteMarketGridSkeleton count={3} />}
    </div>
  );
};
