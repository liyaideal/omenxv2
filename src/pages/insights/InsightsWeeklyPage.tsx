/** /insights/weekly/:week — spec §B2 weekly recap, one indexable page per ISO week. */
import { Link, Navigate, useParams } from "react-router-dom";
import { t } from "@/i18n";
import { useSeoHead } from "@/lib/seo/head";
import { SITE_URL } from "@/lib/site";
import { useInsightsSeo } from "@/hooks/useInsightsSeo";
import { InsightsShell } from "@/components/insightsSeo/InsightsShell";
import { CiteBlock, Empty, HowComputed, MoverList, Opening, SectionHead } from "@/components/insightsSeo/parts";
import { LoadingState } from "@/components/states";
import { cents, dataFeedJsonLd, fmtDate, fmtInt, fmtUsd, gainers, losers, marketPath, parseIsoWeek, rankVolume, weekLabel, isoWeekOf } from "@/lib/insights";

const InsightsWeeklyPage = () => {
  const { week = "" } = useParams();
  const w = parseIsoWeek(week);
  const from = w?.start ?? new Date(), to = new Date(Math.min((w?.end ?? new Date()).getTime(), Date.now()));
  const data = useInsightsSeo({ from, to }, { includeResolved: true });
  const { rows, resolvedEvents, isLoading } = data;
  const label = w ? weekLabel(w) : "";
  const path = `/insights/weekly/${week}`;
  const weekVolume = rows.reduce((s, r) => s + r.activity.volume, 0);
  const weekTrades = rows.reduce((s, r) => s + r.activity.trades, 0);
  const listed = rows.filter((r) => { const c = new Date(r.event.created_at); return c >= from && c < to; }).length;
  const top5 = rankVolume(rows).slice(0, 5);
  const up = gainers(rows).slice(0, 5), down = losers(rows).slice(0, 5);
  const prevW = w ? isoWeekOf(new Date(w.start.getTime() - 3 * 864e5)) : null;
  const nextW = w && w.end.getTime() < Date.now() ? isoWeekOf(new Date(w.end.getTime() + 3 * 864e5)) : null;

  useSeoHead(
    {
      title: t("insights.weekly.seo_title", { week: w?.id ?? "" }),
      description: t("insights.weekly.seo_description", { week: label, volume: fmtUsd(weekVolume), new: listed, settled: resolvedEvents.length }),
      path, ogType: "article", hreflang: true,
      jsonLd: top5.length ? [dataFeedJsonLd(t("insights.weekly.title", { week: label }), `${SITE_URL}${path}`, to.toISOString(), top5)] : [],
    },
    [week, rows.length, resolvedEvents.length],
  );
  if (!w) return <Navigate to="/insights" replace />;

  return (
    <InsightsShell mobileTitle={t("nav.insights")}>
      <div className="mb-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
        <Link to="/insights" className="hover:text-foreground">← {t("insights.actions.all_weeks")}</Link>
        <span>·</span>
        {prevW && <Link to={`/insights/weekly/${prevW.id}`} className="hover:text-foreground">‹ {prevW.id}</Link>}
        {nextW && <Link to={`/insights/weekly/${nextW.id}`} className="hover:text-foreground">{nextW.id} ›</Link>}
      </div>
      <Opening eyebrow="OmenX Insights · Weekly" title={t("insights.weekly.title", { week: label })} lede={t("insights.weekly.lede", { volume: fmtUsd(weekVolume), new: listed, settled: resolvedEvents.length })} asOf={to.toISOString()} />
      {isLoading ? <LoadingState variant="skeleton" skeletonRows={6} /> : (
        <>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1D2026] bg-[#1D2026] md:grid-cols-4">
            {[[t("insights.weekly.kpi_volume"), fmtUsd(weekVolume)], [t("insights.weekly.kpi_trades"), fmtInt(weekTrades)], [t("insights.weekly.kpi_new"), fmtInt(listed)], [t("insights.weekly.kpi_settled"), fmtInt(resolvedEvents.length)]].map(([l, v]) => (
              <div key={l} className="bg-card px-4 py-3.5"><dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{l}</dt><dd className="mt-1.5 font-mono text-[22px] tabular-nums">{v}</dd></div>
            ))}
          </dl>
          <section className="mt-8"><SectionHead title={t("insights.weekly.top5")} />
            {top5.length === 0 ? <Empty text={t("insights.messages.no_markets")} /> : (
              <div className="trading-card overflow-x-auto"><table className="w-full text-[13px]"><thead><tr className="text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground"><th className="px-3 py-2">#</th><th className="px-3 py-2">{t("insights.labels.market")}</th><th className="px-3 py-2">{t("insights.labels.volume")}</th><th className="px-3 py-2">{t("insights.labels.probability")}</th></tr></thead>
                <tbody>{top5.map((r, i) => (<tr key={r.event.id} className="border-t border-[#1D2026]"><td className="px-3 py-2.5 font-mono text-muted-foreground">{i + 1}</td><td className="px-3 py-2.5 font-semibold"><Link to={marketPath(r.event)} className="hover:text-primary">{r.event.name}</Link></td><td className="px-3 py-2.5 font-mono">{fmtUsd(r.activity.volume)}</td><td className="px-3 py-2.5 font-mono">{r.probability}% {r.lead.label} · {cents(r.lead.price)}</td></tr>))}</tbody></table></div>
            )}
          </section>
          <section className="mt-8"><SectionHead title={t("insights.weekly.shifts")} />
            {up.length + down.length === 0 ? <Empty text={t("insights.weekly.no_shifts")} /> : <div className="grid gap-4 md:grid-cols-2"><MoverList title={t("insights.labels.biggest_gainers")} rows={up} tone="up" /><MoverList title={t("insights.labels.biggest_losers")} rows={down} tone="down" /></div>}
          </section>
          <section className="mt-8"><SectionHead title={t("insights.weekly.settled_list")} meta={`${resolvedEvents.length}`} />
            {resolvedEvents.length === 0 ? <Empty text={t("insights.weekly.no_settled")} /> : (
              <div className="trading-card overflow-x-auto"><table className="w-full text-[13px]"><thead><tr className="text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground"><th className="px-3 py-2">{t("insights.labels.market")}</th><th className="px-3 py-2">{t("insights.weekly.result")}</th><th className="px-3 py-2">{t("insights.weekly.final_crowd")}</th><th className="px-3 py-2">{t("insights.weekly.settled_on")}</th></tr></thead>
                <tbody>{resolvedEvents.slice(0, 20).map((e) => { const win = e.options.find((o) => o.id === e.winning_option_id) ?? e.options.find((o) => o.is_winner); const lead = [...e.options].sort((a, b) => Number(b.final_price ?? b.price) - Number(a.final_price ?? a.price))[0]; return (
                  <tr key={e.id} className="border-t border-[#1D2026]"><td className="px-3 py-2.5 font-semibold">{e.name}</td><td className="px-3 py-2.5"><span className="rounded-md border border-trading-green/50 px-2 py-0.5 font-mono text-[12px] text-trading-green">{win?.label ?? "—"}</span></td><td className="px-3 py-2.5 font-mono">{lead ? `${Math.round(Number(lead.final_price ?? lead.price) * 100)}% ${lead.label}` : "—"}</td><td className="px-3 py-2.5 font-mono text-muted-foreground">{e.settled_at ? <time dateTime={e.settled_at}>{fmtDate(e.settled_at)}</time> : "—"}</td></tr>); })}</tbody></table></div>
            )}
          </section>
          <HowComputed asOf={to.toISOString()} />
          <CiteBlock sentence={t("insights.weekly.cite", { week: label })} url={`${SITE_URL}${path}`} />
        </>
      )}
    </InsightsShell>
  );
};
export default InsightsWeeklyPage;
