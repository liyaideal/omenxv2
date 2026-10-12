/** /insights/category/:slug — one indexable page per category (spec §3.1), unique intro + that category's lists. */
import { Navigate, useParams } from "react-router-dom";
import { t } from "@/i18n";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { useInsightsSeo } from "@/hooks/useInsightsSeo";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { Empty, MarketTable, MoverList } from "@/components/insightsSeo/parts";
import { DataFooter, SeriesOpening, SeriesSection } from "@/components/insightsSeo/seriesParts";
import { HERO_ART } from "@/lib/insights/art";
import { LoadingState } from "@/components/states";
import { CATEGORY_SLUGS, categoryLabelForSlug, categorySlugFor, citeSentence, dataFeedJsonLd, gainers, losers, rankClosing, rankTrending, rankVolume } from "@/lib/insights";

const HOUR = 36e5;

const InsightsCategoryPage = () => {
  const { slug = "" } = useParams();
  const valid = CATEGORY_SLUGS.includes(slug);
  const now = new Date();
  const data = useInsightsSeo({ from: new Date(now.getTime() - 24 * HOUR), to: now }, { sparklineIds: (rows) => rankTrending(rows.filter((r) => categorySlugFor(r.event.category) === slug)).slice(0, 10).map((r) => r.lead.id) });
  const rows = data.rows.filter((r) => categorySlugFor(r.event.category) === slug);
  const label = categoryLabelForSlug(slug);
  const path = `/insights/category/${slug}`;
  const asOf = data.stats?.as_of ?? now.toISOString();
  const trending = rankTrending(rows).slice(0, 10), byVolume = rankVolume(rows).slice(0, 10), closing = rankClosing(rows).slice(0, 10);
  const introKey = `insights.category.intro.${slug}`;

  useSeoHead(
    { title: t("insights.category.seo_title", { category: label }), description: t("insights.category.seo_description", { category: label }), path, hreflang: true,
      jsonLd: trending.length ? [dataFeedJsonLd(`${label} — ${t("insights.seo.dataset_name")}`, `${SITE_URL}${path}`, asOf, trending)] : [] },
    [slug, rows.length],
  );
  if (!valid) return <Navigate to="/insights" replace />;

  return (
    <InsightsShell mobileTitle={label}>
      {/* Brand backflow 2026-10-12 (Figma 1001:16525 / 1004:2079): v2 opening with the Events illustration; the draft's "← INSIGHTS" link is not built (PD-6). */}
      <SeriesOpening art={HERO_ART.events} eyebrow={`OmenX Insights · Events · ${label}`} title={t("insights.category.h1", { category: label })} lede={t(introKey) === introKey ? t("insights.category.intro.other") : t(introKey)} asOf={data.stats ? asOf : undefined} />
      {data.isLoading ? <LoadingState variant="skeleton" skeletonRows={6} /> : rows.length === 0 ? <Empty text={t("insights.messages.no_markets")} /> : (
        <>
          <SeriesSection n="01" title={t("insights.sections.top_trending")} meta={t("insights.category.count", { count: rows.length })}><MarketTable rows={trending} /></SeriesSection>
          <SeriesSection n="02" title={t("insights.sections.top_volume")}><MarketTable rows={byVolume} showSpark={false} /></SeriesSection>
          <SeriesSection n="03" title={t("insights.sections.biggest_moves")}><div className="grid gap-4 md:grid-cols-2"><MoverList title={t("insights.labels.biggest_gainers")} rows={gainers(rows).slice(0, 5)} tone="up" /><MoverList title={t("insights.labels.biggest_losers")} rows={losers(rows).slice(0, 5)} tone="down" /></div></SeriesSection>
          <SeriesSection n="04" title={t("insights.sections.closing_soon")}><MarketTable rows={closing} showSpark={false} /></SeriesSection>
          <DataFooter n="05" settle="Settles on the official outcome" legend={<>{t("insights.how.body")} {t("insights.how.brand")}</>} sentence={trending[0] ? citeSentence(trending[0], asOf) : t("insights.category.seo_description", { category: label })} url={`${SITE_URL}${path}`} />
        </>
      )}
    </InsightsShell>
  );
};
export default InsightsCategoryPage;
