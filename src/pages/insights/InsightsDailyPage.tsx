/** /insights/daily/:date — one indexable page per day (omenx-seo-geo R2): the day's full insight digest. */
import { Link, Navigate, useParams } from "react-router-dom";
import { t } from "@/i18n";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { useInsightsSeo } from "@/hooks/useInsightsSeo";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { Empty } from "@/components/insightsSeo/parts";
import { DataFooter, SeriesOpening, Strip } from "@/components/insightsSeo/seriesParts";
import { HERO_ART } from "@/lib/insights/art";
import { InsightArticle, buildInsights } from "@/components/insightsSeo/insightsFeed";
import { LoadingState } from "@/components/states";
import { citeSentence, dataFeedJsonLd, fmtDate, fmtInt, isoDate } from "@/lib/insights";

const DAY = 864e5;

const InsightsDailyPage = () => {
  const { date = "" } = useParams();
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + "T00:00:00Z"));
  const from = valid ? new Date(date + "T00:00:00Z") : new Date();
  const to = new Date(Math.min(from.getTime() + DAY, Date.now()));
  const data = useInsightsSeo({ from, to });
  const feed = buildInsights(data.rows, from, to);
  const moves = feed.filter((i) => i.kind === "move").length, fresh = feed.filter((i) => i.kind === "new").length, closing = feed.filter((i) => i.kind === "closing").length;
  const label = fmtDate(from);
  const prev = isoDate(new Date(from.getTime() - DAY)), next = isoDate(new Date(from.getTime() + DAY));
  const path = `/insights/daily/${date}`;

  useSeoHead(
    {
      title: t("insights.daily.seo_title", { date: label }),
      description: t("insights.daily.seo_description", { date: label, moves, new: fresh, closing }),
      path, ogType: "article", hreflang: true,
      jsonLd: feed.length ? [dataFeedJsonLd(t("insights.daily.title", { date: label }), `${SITE_URL}${path}`, to.toISOString(), feed.map((i) => i.row))] : [],
    },
    [date, feed.length],
  );
  if (!valid) return <Navigate to="/insights" replace />;

  return (
    <InsightsShell mobileTitle={t("nav.insights")}>
      {/* Brand backflow 2026-10-12 (Figma 1001:17410 / 1004:2776): v2 opening with the Daily illustration; "← INSIGHTS" not built (PD-6), day pager kept. */}
      {/* Figma 1001:17489: day pager sits above the opening (the draft's "← INSIGHTS" is not built, PD-6). */}
      <div className="mb-4 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
        <Link to={`/insights/daily/${prev}`} className="hover:text-primary">‹ {prev}</Link>
        {to.getTime() < Date.now() && <Link to={`/insights/daily/${next}`} className="hover:text-primary">{next} ›</Link>}
      </div>
      <SeriesOpening art={HERO_ART.daily} eyebrow="OmenX Insights · Daily digest" title={t("insights.daily.title", { date: label })} lede={t("insights.daily.lede", { moves, new: fresh, closing })} asOf={to.toISOString()} />
      {/* Figma 1001:17507: three-cell snapshot strip (moves / newly listed / settling soon). */}
      <Strip cols={3} cells={[
        { l: "Probability moves", v: fmtInt(moves), d: <span className="text-trading-green">5 points or more</span> },
        { l: "Newly listed", v: fmtInt(fresh), d: "markets" },
        { l: "Settling soon", v: fmtInt(closing), d: "within 48 hours" },
      ]} />
      {data.isLoading ? <LoadingState variant="skeleton" skeletonRows={6} /> : feed.length === 0 ? <Empty text={t("insights.daily.empty")} /> : (
        <div className="space-y-2">{feed.map((i) => <InsightArticle key={i.id} item={i} card />)}</div>
      )}
      <div className="mb-10" />
      <DataFooter n="02" settle="Settles on the official outcome" legend={<>{t("insights.how.body")} {t("insights.how.brand")}</>} sentence={feed[0] ? citeSentence(feed[0].row, to.toISOString()) : t("insights.daily.seo_description", { date: label, moves, new: fresh, closing })} url={`${SITE_URL}${path}`} />
    </InsightsShell>
  );
};
export default InsightsDailyPage;
