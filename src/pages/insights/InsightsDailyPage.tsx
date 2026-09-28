/** /insights/daily/:date — one indexable page per day (omenx-seo-geo R2): the day's full insight digest. */
import { Link, Navigate, useParams } from "react-router-dom";
import { t } from "@/i18n";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { useInsightsSeo } from "@/hooks/useInsightsSeo";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { CiteBlock, Empty, HowComputed, Opening } from "@/components/insightsSeo/parts";
import { InsightArticle, buildInsights } from "@/components/insightsSeo/insightsFeed";
import { LoadingState } from "@/components/states";
import { citeSentence, dataFeedJsonLd, fmtDate, isoDate } from "@/lib/insights";

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
      <div className="mb-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
        <Link to="/insights" className="hover:text-foreground">← {t("nav.insights")}</Link>
        <span>·</span>
        <Link to={`/insights/daily/${prev}`} className="hover:text-foreground">‹ {prev}</Link>
        {to.getTime() < Date.now() && <Link to={`/insights/daily/${next}`} className="hover:text-foreground">{next} ›</Link>}
      </div>
      <Opening eyebrow="OmenX Insights · Daily" title={t("insights.daily.title", { date: label })} lede={t("insights.daily.lede", { moves, new: fresh, closing })} asOf={to.toISOString()} />
      {data.isLoading ? <LoadingState variant="skeleton" skeletonRows={6} /> : feed.length === 0 ? <Empty text={t("insights.daily.empty")} /> : (
        <div className="trading-card px-4">{feed.map((i) => <InsightArticle key={i.id} item={i} />)}</div>
      )}
      <HowComputed asOf={to.toISOString()} />
      {feed[0] && <CiteBlock sentence={citeSentence(feed[0].row, to.toISOString())} url={`${SITE_URL}${path}`} />}
    </InsightsShell>
  );
};
export default InsightsDailyPage;
