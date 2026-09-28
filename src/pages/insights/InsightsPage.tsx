/**
 * /insights — SEO/GEO data page (spec SEO_P2_Insights_Page_Spec.md, rebuilt 2026-09-28).
 * Sections A1 KPI · A2 five flat lists · A3 movers · A4 categories (each a page) · B1 today's
 * insights (top 5, full digest on /insights/daily) · B2 weekly recaps · cite + how-computed.
 * No tabs, no lazy lists: everything is in the DOM for crawlers (omenx-seo-geo R1/R2).
 */
import { Link } from "react-router-dom";
import { t } from "@/i18n";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { useInsightsSeo } from "@/hooks/useInsightsSeo";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { AsOf, CategoryTable, CiteBlock, Empty, HowComputed, KpiStrip, MarketTable, MoverList, Opening, SectionHead } from "@/components/insightsSeo/parts";
import { InsightArticle, buildInsights } from "@/components/insightsSeo/insightsFeed";
import { LoadingState } from "@/components/states";
import {
  INSIGHTS_PATH, citeSentence, dataFeedJsonLd, fmtUsd, gainers, isoDate, isoWeekOf, losers, rankActive, rankClosing, rankNew, rankTrending, rankVolume, weekLabel, MOVE_THRESHOLD,
} from "@/lib/insights";

const HOUR = 36e5;
const TOP = 10;

const InsightsPage = () => {
  const now = new Date();
  const win = { from: new Date(now.getTime() - 24 * HOUR), to: now };
  const data = useInsightsSeo(win, { sparklineIds: (rows) => rankTrending(rows).slice(0, TOP).map((r) => r.lead.id) });
  const { rows, stats, isLoading, error } = data;
  const asOf = stats?.as_of ?? now.toISOString();

  const trending = rankTrending(rows).slice(0, TOP);
  const byVolume = rankVolume(rows).slice(0, TOP);
  const active = rankActive(rows).slice(0, TOP);
  const newest = rankNew(rows).slice(0, TOP);
  const closing = rankClosing(rows).slice(0, TOP);
  const up = gainers(rows).slice(0, 5);
  const down = losers(rows).slice(0, 5);
  const feed = buildInsights(rows, win.from, win.to).slice(0, 5);
  const weeks = [0, 1, 2, 3].map((i) => isoWeekOf(new Date(now.getTime() - i * 7 * 24 * HOUR)));
  const today = isoDate(now);

  useSeoHead(
    {
      title: t("insights.seo.home_title"),
      description: t("insights.seo.home_description"),
      path: INSIGHTS_PATH,
      hreflang: true,
      jsonLd: rows.length ? [dataFeedJsonLd(t("insights.seo.dataset_name"), `${SITE_URL}${INSIGHTS_PATH}`, asOf, trending)] : [],
    },
    [asOf, rows.length],
  );

  return (
    <InsightsShell>
      <Opening title={t("insights.page.h1")} lede={t("insights.page.lede")} asOf={stats ? asOf : undefined} />
      {isLoading && <LoadingState variant="skeleton" skeletonRows={6} />}
      {!isLoading && error && <Empty text={t("insights.messages.load_failed")} />}
      {!isLoading && !error && (
        <>
          {stats && <KpiStrip stats={stats} />}

          <section className="mt-8"><SectionHead n="01" title={t("insights.sections.top_trending")} meta={`TOP ${TOP}`} /><MarketTable rows={trending} caption={t("insights.sections.top_trending")} /></section>
          <section className="mt-8"><SectionHead n="02" title={t("insights.sections.top_volume")} meta={`TOP ${TOP}`} /><MarketTable rows={byVolume} showSpark={false} caption={t("insights.sections.top_volume")} /></section>
          <section className="mt-8"><SectionHead n="03" title={t("insights.sections.most_active")} meta={`TOP ${TOP}`} /><MarketTable rows={active} showSpark={false} caption={t("insights.sections.most_active")} /></section>
          <section className="mt-8"><SectionHead n="04" title={t("insights.sections.newly_listed")} meta={`TOP ${TOP}`} /><MarketTable rows={newest} showSpark={false} caption={t("insights.sections.newly_listed")} /></section>
          <section className="mt-8"><SectionHead n="05" title={t("insights.sections.closing_soon")} meta={`TOP ${TOP}`} /><MarketTable rows={closing} showSpark={false} caption={t("insights.sections.closing_soon")} /></section>

          <section className="mt-8">
            <SectionHead n="06" title={t("insights.sections.biggest_moves")} meta={t("insights.labels.moved_at_least", { pts: MOVE_THRESHOLD * 100 })} />
            <div className="grid gap-4 md:grid-cols-2"><MoverList title={t("insights.labels.biggest_gainers")} rows={up} tone="up" /><MoverList title={t("insights.labels.biggest_losers")} rows={down} tone="down" /></div>
          </section>

          <section className="mt-8"><SectionHead n="07" title={t("insights.sections.by_category")} meta={t("insights.labels.each_row_is_page")} /><CategoryTable rows={rows} /></section>

          <section className="mt-8">
            <SectionHead n="08" title={t("insights.sections.today_insights")} meta={<AsOf iso={asOf} />}>
              <Link to={`/insights/daily/${today}`} className="text-[12px] text-primary hover:underline">{t("insights.actions.todays_digest")} →</Link>
            </SectionHead>
            <div className="trading-card px-4">{feed.length ? feed.map((i) => <InsightArticle key={i.id} item={i} />) : <p className="py-6 text-center text-[13px] text-muted-foreground">{t("insights.messages.no_feed")}</p>}</div>
          </section>

          <section className="mt-8">
            <SectionHead n="09" title={t("insights.sections.weekly_recaps")} meta={t("insights.labels.one_page_per_week")} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {weeks.map((w) => (
                <Link key={w.id} to={`/insights/weekly/${w.id}`} className="trading-card block p-3.5 hover:border-[#262A31]">
                  <div className="text-[13px] font-semibold">{weekLabel(w)}</div>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">{w.id}</div>
                </Link>
              ))}
            </div>
          </section>

          <HowComputed asOf={asOf} />
          {trending[0] && <CiteBlock sentence={citeSentence(trending[0], asOf)} url={`${SITE_URL}${INSIGHTS_PATH}`} />}
          <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">{t("insights.kpi.total_volume")}: {stats ? fmtUsd(stats.total_volume, false) : "—"}</p>
        </>
      )}
    </InsightsShell>
  );
};

export default InsightsPage;
