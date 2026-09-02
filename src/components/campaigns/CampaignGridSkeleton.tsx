/**
 * Loading skeleton for the /rewards campaigns grid.
 * Extracted verbatim from LiteRewardsPage (M3a-①) — DOM and classes unchanged.
 */
export const CampaignGridSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2">
    {[0, 1].map((i) => (
      <div key={i} className="h-[300px] animate-pulse rounded-[14px] bg-[#0F1114]" />
    ))}
  </div>
);
