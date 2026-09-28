/** /insights/category/:slug — one indexable page per category (spec §3.1), unique intro + that category's lists. */
import { Link, Navigate, useParams } from "react-router-dom";
import { t } from "@/i18n";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { useInsightsSeo } from "@/hooks/useInsightsSeo";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { CiteBlock, Empty, HowComputed, MarketTable, MoverList, Opening, SectionHead } from "@/components/insightsSeo/parts";
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
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground"><Link to="/insights" className="hover:text-foreground">← {t("nav.insights")}</Link></div>
      <Opening title={t("insights.category.h1", { category: label })} lede={t(introKey) === introKey ? t("insights.category.intro.other") : t(introKey)} asOf={data.stats ? asOf : undefined}
        right={<span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{t("insights.category.count", { count: rows.length })}</span>} />
      {data.isLoading ? <LoadingState variant="skeleton" skeletonRows={6} /> : rows.length === 0 ? <Empty text={t("insights.messages.no_markets")} /> : (
        <>
          <section className="mt-2"><SectionHead n="01" title={t("insights.sections.top_trending")} /><MarketTable rows={trending} /></section>
          <section className="mt-8"><SectionHead n="02" title={t("insights.sections.top_volume")} /><MarketTable rows={byVolume} showSpark={false} /></section>
          <section className="mt-8"><SectionHead n="03" title={t("insights.sections.biggest_moves")} /><div className="grid gap-4 md:grid-cols-2"><MoverList title={t("insights.labels.biggest_gainers")} rows={gainers(rows).slice(0, 5)} tone="up" /><MoverList title={t("insights.labels.biggest_losers")} rows={losers(rows).slice(0, 5)} tone="down" /></div></section>
          <section className="mt-8"><SectionHead n="04" title={t("insights.sections.closing_soon")} /><MarketTable rows={closing} showSpark={false} /></section>
          <HowComputed asOf={asOf} />
          {trending[0] && <CiteBlock sentence={citeSentence(trending[0], asOf)} url={`${SITE_URL}${path}`} />}
        </>
      )}
    </InsightsShell>
  );
};
export default InsightsCategoryPage;
