/**
 * Auto-generated market insights (spec §B1), GEO-shaped (omenx-seo-geo):
 * heading = the market question itself; first sentence = the answer with a
 * date; then a <dl> of the same numbers that go into JSON-LD. No emoji, no
 * "$0.62" — probability + ¢.
 */
import { Link } from "react-router-dom";
import { t } from "@/i18n";
import { toast } from "sonner";
import { SITE_URL } from "@/lib/site";
import { anPct, cents, fmtDate, fmtDateTimeUtc, fmtInt, fmtUsd, marketPath, untilLabel, categoryLabelForKey, isQuickRound, MOVE_THRESHOLD, type MarketRow } from "@/lib/insights";

export type InsightKind = "move" | "closing" | "new";
export interface InsightItem { id: string; kind: InsightKind; at: string; row: MarketRow; }

/** Build the feed for a window: moves ≥ threshold, markets listed in-window, markets settling within 48h of `to`. */
export const buildInsights = (rows: MarketRow[], from: Date, to: Date): InsightItem[] => {
  const items: InsightItem[] = [];
  for (const r of rows) {
    if (isQuickRound(r.event)) continue;
    if (r.move && Math.abs(r.move.delta) >= MOVE_THRESHOLD * 100) items.push({ id: `move-${r.event.id}`, kind: "move", at: to.toISOString(), row: r });
    const created = new Date(r.event.created_at);
    if (created >= from && created < to) items.push({ id: `new-${r.event.id}`, kind: "new", at: r.event.created_at, row: r });
    const end = new Date(r.event.end_date);
    if (end > to && end.getTime() - to.getTime() < 48 * 36e5) items.push({ id: `closing-${r.event.id}`, kind: "closing", at: to.toISOString(), row: r });
  }
  const weight = (i: InsightItem) => (i.kind === "move" ? Math.abs(i.row.move!.delta) * 1000 : i.kind === "closing" ? 500 : 100) + i.row.activity.volume / 1000;
  return items.sort((a, b) => weight(b) - weight(a));
};

const kindLabel = (k: InsightKind) => (k === "move" ? t("insights.feed.type.market_insight") : k === "closing" ? t("insights.feed.type.closing_soon") : t("insights.feed.type.new_market"));

export const answerSentence = (i: InsightItem) => {
  const r = i.row; const d = fmtDate(i.at); const p = r.probability; const lbl = r.lead.label;
  if (i.kind === "move") {
    const from = Math.round(r.move!.from * 100);
    return t("insights.feed.move_sentence", { date: d, an: anPct(p), pct: p, label: lbl, from, volume: fmtUsd(r.activity.volume), trades: fmtInt(r.activity.trades) });
  }
  if (i.kind === "closing") return t("insights.feed.closing_sentence", { date: d, pct: p, label: lbl, until: untilLabel(r.event.end_date), volume: fmtUsd(r.activity.volume) });
  return t("insights.feed.new_sentence", { date: d, pct: p, label: lbl, category: categoryLabelForKey(r.event.category) });
};

/** `card` = Figma 1001:17535 "Article / Compact" (daily digest, 2026-10-12): own rounded card px-20 py-16, 11px mono eyebrow, 22px display title,
 *  14/22 answer, four metrics (blue 11px label / 20px bold value) in a row (2×2 on mobile), View Market + Share stacked right. */
export const InsightArticle = ({ item, compact = false, card = false }: { item: InsightItem; compact?: boolean; card?: boolean }) => {
  const r = item.row;
  const share = async () => {
    const url = `${SITE_URL}/insights#${item.id}`;
    try { await navigator.clipboard.writeText(`${answerSentence(item)} ${url}`); toast.success(t("insights.actions.link_copied")); } catch { toast.error(t("insights.actions.copy_failed")); }
  };
  return (
    <article id={item.id} data-market-id={r.event.id} data-timestamp={item.at} className={card
      ? "grid gap-3 rounded-xl border border-[#1D2026] bg-card px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-5 md:px-5"
      : "grid gap-3 border-t border-[#1D2026] py-4 first-of-type:border-t-0 md:grid-cols-[1fr_auto]"}>
      <div className="min-w-0">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{kindLabel(item.kind)} · <time dateTime={item.at}>{fmtDateTimeUtc(item.at)}</time></div>
        <h3 className={card ? "mt-1 font-display text-[18px] font-medium leading-[1.3] md:text-[22px] md:leading-[30px]" : "mb-1.5 mt-1 text-[15px] font-semibold leading-snug"}><Link to={marketPath(r.event)} className="hover:text-primary">{r.event.name}</Link></h3>
        <p className={card ? "mt-1 text-[13px] leading-[20px] text-muted-foreground md:text-[14px] md:leading-[22px]" : "mb-2.5 max-w-[72ch] text-[13px] text-muted-foreground"}>{answerSentence(item)}</p>
        {!compact && card && (
          <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-[minmax(0,2.4fr)_1fr_0.8fr_1.6fr] md:gap-x-4">
            {[
              [t("insights.labels.probability"), `${r.probability}% ${r.lead.label} · ${cents(r.lead.price)}`],
              [t("insights.labels.vol_24h_short"), fmtUsd(r.activity.volume)],
              [t("insights.labels.trades"), fmtInt(r.activity.trades)],
              [item.kind === "move" ? t("insights.labels.change_24h") : t("insights.labels.closes"), item.kind === "move" ? `${r.move!.delta > 0 ? "+" : "−"}${Math.abs(Math.round(r.move!.delta))} pts` : fmtDate(r.event.end_date)],
            ].map(([l, v]) => (
              <div key={l as string} className="min-w-0">
                <dt className="text-[11px] leading-[17px] text-primary">{l}</dt>
                <dd className="truncate font-display text-[17px] font-bold leading-[26px] tabular-nums md:text-[20px] md:leading-[28px]">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {!compact && !card && (
          <dl className="grid grid-cols-2 gap-x-5 gap-y-1 text-[12px] md:grid-cols-4">
            <dt className="text-muted-foreground/70">{t("insights.labels.probability")}</dt><dd className="font-mono">{r.probability}% {r.lead.label} · {cents(r.lead.price)}</dd>
            <dt className="text-muted-foreground/70">{t("insights.labels.vol_24h_short")}</dt><dd className="font-mono">{fmtUsd(r.activity.volume)}</dd>
            <dt className="text-muted-foreground/70">{t("insights.labels.trades")}</dt><dd className="font-mono">{fmtInt(r.activity.trades)}</dd>
            <dt className="text-muted-foreground/70">{item.kind === "move" ? t("insights.labels.change_24h") : t("insights.labels.closes")}</dt>
            <dd className="font-mono">{item.kind === "move" ? `${r.move!.delta > 0 ? "+" : "−"}${Math.abs(Math.round(r.move!.delta))} pts` : <time dateTime={r.event.end_date}>{fmtDate(r.event.end_date)}</time>}</dd>
          </dl>
        )}
      </div>
      <div className={card ? "flex items-center gap-4 text-[12px] md:w-[94px] md:flex-col md:items-end md:gap-3" : "flex items-start gap-3 text-[12px] md:flex-col md:items-end"}>
        <Link to={marketPath(r.event)} className="whitespace-nowrap text-primary hover:underline">{t("insights.actions.view_market")} →</Link>
        <button type="button" onClick={share} className="text-muted-foreground hover:text-foreground">{t("insights.actions.share")}</button>
      </div>
    </article>
  );
};
