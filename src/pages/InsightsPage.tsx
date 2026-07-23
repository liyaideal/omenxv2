import { SeoPageLayout } from "@/components/seo";
import {
  InsightsKpiDashboard,
  TrendingMarkets,
  BiggestMovers,
  CategoryBreakdown,
  InsightsFeed,
} from "@/components/insights";
import { useInsightsData } from "@/hooks/useInsightsData";
import { Skeleton } from "@/components/ui/skeleton";

const InsightsPage = () => {
  const { events, isLoading, priceChanges } = useInsightsData();

  return (
    <SeoPageLayout
      title="OmenX Insights"
      description="Live data, trending markets, and auto-generated insights from OmenX event trading markets."
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-10 not-prose">
          {/* Area A: Real-time Dashboard */}
          <InsightsKpiDashboard activeMarketsCount={events.length} />
          <TrendingMarkets events={events} priceChanges={priceChanges} />
          <BiggestMovers events={events} priceChanges={priceChanges} />
          <CategoryBreakdown events={events} />

          {/* Area B: Insights Feed */}
          <div className="border-t border-border/30 pt-8">
            <InsightsFeed events={events} priceChanges={priceChanges} />
          </div>
        </div>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "OmenX Platform Insights",
            description: "Real-time event trading market data, trending markets, and auto-generated insights",
            provider: { "@type": "Organization", name: "OmenX" },
            temporalCoverage: new Date().toISOString().split("T")[0] + "/..",
          }),
        }}
      />
    </SeoPageLayout>
  );
};

export default InsightsPage;
