/**
 * Insights SEO/GEO — shared UI parts (2026-09-28).
 * Rules (omenx-seo-geo): every list is flat HTML (no tabs / no lazy lists),
 * every market is an <article> with a <dl>, every time is <time datetime>,
 * headings use search vocabulary ("prediction market", "probability").
 * Visual: new DNA — .trading-card, Archivo, mono numbers, Yes/No pills.
 */
import { Link } from "react-router-dom";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  cents, deltaPct, fmtDate, fmtDateTimeUtc, fmtInt, fmtPct, fmtUsd, marketPath, untilLabel,
  categoryLabelForKey, categorySlugFor, type MarketRow, type PlatformStats,
} from "@/lib/insights";

/* ---------- opening ---------- */
export const Opening = ({ eyebrow, title, lede, asOf, right }: { eyebrow?: string; title: string; lede: string; asOf?: string; right?: React.ReactNode }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{eyebrow}</div>}
      <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] md:text-[30px]">{title}</h1>
      <p className="mt-1.5 max-w-[72ch] text-sm text-muted-foreground md:text-[15px]">{lede}</p>
    </div>
    <div className="flex items-center gap-3">
      {asOf && <AsOf iso={asOf} />}
      {right}
    </div>
  </header>
);

export const AsOf = ({ iso }: { iso: string }) => (
  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
    {t("insights.labels.as_of")} <time dateTime={iso}>{fmtDateTimeUtc(iso)}</time>
  </span>
);

export const SectionHead = ({ n, title, meta, children }: { n?: string; title: string; meta?: React.ReactNode; children?: React.ReactNode }) => (
  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
    <h2 className="flex items-baseline gap-2 text-lg font-semibold tracking-[-0.01em]">
      {n && <span className="font-mono text-[22px] leading-none text-muted-foreground/40">{n}</span>}
      {title}
    </h2>
    <div className="flex items-center gap-3">{meta && <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{meta}</span>}{children}</div>
  </div>
);

/* ---------- KPI strip ---------- */
export const KpiStrip = ({ stats }: { stats: PlatformStats }) => {
  const d24 = deltaPct(stats.volume_24h, stats.volume_prev_24h);
  const dTr = deltaPct(stats.trades_24h, stats.trades_prev_24h);
  const cells: { l: string; v: string; d?: number }[] = [
    { l: t("insights.kpi.total_volume"), v: fmtUsd(stats.total_volume) },
    { l: t("insights.kpi.open_interest"), v: fmtUsd(stats.open_interest) },
    { l: t("insights.kpi.active_markets"), v: fmtInt(stats.active_markets) },
    { l: t("insights.kpi.volume_24h"), v: fmtUsd(stats.volume_24h), d: d24 },
    { l: t("insights.kpi.trades_24h"), v: fmtInt(stats.trades_24h), d: dTr },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#1D2026] bg-[#1D2026] md:grid-cols-5">
      {cells.map((c) => (
        <div key={c.l} className="bg-card px-4 py-3.5">
          <dt className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{c.l}</dt>
          <dd className="mt-1.5 font-mono text-[22px] tabular-nums">{c.v}</dd>
          {c.d !== undefined && (
            <dd className={cn("font-mono text-[11px]", c.d >= 0 ? "text-trading-green" : "text-trading-red")}>
              {c.d >= 0 ? "▲" : "▼"} {fmtPct(Math.abs(c.d))} <span className="text-muted-foreground">{t("insights.labels.vs_prior_24h")}</span>
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
};

/* ---------- atoms ---------- */
export const ProbBar = ({ pct, label }: { pct: number; label: string }) => (
  <div className="min-w-[120px]">
    <div className="h-1.5 w-[120px] overflow-hidden rounded bg-[#1D2026]"><i className="block h-full bg-primary" style={{ width: `${pct}%` }} /></div>
    <div className="mt-1 font-mono text-[11px] text-muted-foreground">{t("insights.labels.pct_probability", { pct, label })}</div>
  </div>
);

export const PricePills = ({ r, size = "sm" }: { r: MarketRow; size?: "sm" | "md" }) => {
  const cls = size === "md" ? "h-9 px-3 text-[13px] flex-1 justify-between" : "px-2 py-0.5 text-[12px]";
  return (
    <div className={cn("flex gap-1.5", size === "md" && "w-full")}>
      <span className={cn("inline-flex items-center gap-1.5 rounded-md border border-primary/50 font-mono text-primary", cls)}>{r.lead.label} <b className="font-medium">{cents(r.lead.price)}</b></span>
      {r.other && <span className={cn("inline-flex items-center gap-1.5 rounded-md border border-no/50 font-mono text-no", cls)}>{r.other.label} <b className="font-medium">{cents(r.other.price)}</b></span>}
    </div>
  );
};

export const Sparkline = ({ data, up }: { data: number[]; up: boolean }) => {
  if (data.length < 2) return <span className="text-muted-foreground/40">—</span>;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 0.01;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 80},${22 - ((v - min) / span) * 20 + 1}`).join(" ");
  return <svg width="80" height="24" viewBox="0 0 80 24" aria-hidden><polyline fill="none" stroke={up ? "#33D6FF" : "#EF4444"} strokeWidth="1.5" points={pts} /></svg>;
};

export const MoveText = ({ r }: { r: MarketRow }) => {
  if (!r.move) return <span className="text-muted-foreground/50">—</span>;
  const up = r.move.delta >= 0;
  return (
    <span className="whitespace-nowrap font-mono text-[12px] text-muted-foreground">
      {Math.round(r.move.from * 100)}% → <b className="text-[14px] text-foreground">{Math.round(r.move.to * 100)}%</b>{" "}
      <span className={up ? "text-trading-green" : "text-trading-red"}>{up ? "+" : "−"}{Math.abs(Math.round(r.move.delta))}</span>
    </span>
  );
};

const Cat = ({ r }: { r: MarketRow }) => (
  <Link to={`/insights/category/${categorySlugFor(r.event.category)}`} className="flex-none rounded border border-[#262A31] px-1.5 py-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">{categoryLabelForKey(r.event.category)}</Link>
);

/* ---------- market table (desktop) / cards (mobile) ---------- */
export const MarketTable = ({ rows, caption }: { rows: MarketRow[]; showSpark?: boolean; caption?: string }) => {
  const isMobile = useIsMobile();
  if (rows.length === 0) return <Empty text={t("insights.messages.no_markets")} />;
  const Move = ({ r }: { r: MarketRow }) => { if (!r.move) return null; const n = Math.round(r.move.delta); return (
    <span className={cn("w-[74px] font-mono text-[11px]", n > 0 ? "text-trading-green" : n < 0 ? "text-trading-red" : "text-muted-foreground")}>{n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0"}% today</span>
  ); };
  if (isMobile) {
    // mobile = two-line list rows (mobile mock ①/④), never a flattened table
    return (
      <div className="trading-card px-3.5 [&>*+*]:border-t [&>*+*]:border-[#1D2026]">
        {rows.map((r) => (
          <article key={r.event.id} data-market-id={r.event.id} className="py-2.5">
            <Link to={marketPath(r.event)} className="block">
              <div className="flex items-center justify-between gap-2.5"><h3 className="truncate text-[13px] font-semibold">{r.event.name}</h3><span className="flex-none font-mono text-[11px] text-muted-foreground"><time dateTime={r.event.end_date}>{fmtDate(r.event.end_date)}</time></span></div>
              <dl className="mt-1.5 flex items-center justify-between gap-2.5 font-mono text-[12px]">
                <dd><span className="text-muted-foreground">{r.lead.label}</span> <b className="text-[15px] font-semibold tabular-nums">{r.probability}%</b> <Move r={r} /></dd>
                <dd className="text-muted-foreground">{fmtUsd(r.activity.volume)} · {fmtInt(r.activity.trades)} {t("insights.labels.trades")}</dd>
              </dl>
            </Link>
          </article>
        ))}
      </div>
    );
  }
  return (
    <div className="trading-card overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" style={{ tableLayout: "fixed", minWidth: 960 }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead><tr className="h-9 bg-white/[0.02] text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 [&_th]:whitespace-nowrap [&_th]:px-3">
          <th style={{ width: 44 }}>#</th><th>{t("insights.labels.market")}</th><th style={{ width: 300 }}>{t("insights.labels.crowd_says")}</th><th className="text-right" style={{ width: 92 }}>{t("insights.labels.vol_24h_short")}</th><th className="text-right" style={{ width: 76 }}>{t("insights.labels.trades")}</th><th className="text-right" style={{ width: 136, paddingRight: 20 }}>{t("insights.labels.closes")}</th>
        </tr></thead>
        <tbody className="[&_td]:h-[52px] [&_td]:overflow-hidden [&_td]:whitespace-nowrap [&_td]:border-t [&_td]:border-[#1D2026] [&_td]:px-3 [&_tr]:cursor-pointer [&_tr:hover_td]:bg-white/[0.02] [&_tr:hover_h3]:text-primary">
          {rows.map((r, i) => (
            <tr key={r.event.id} onClick={() => (window.location.href = marketPath(r.event))}>
              <td className="font-mono text-[12px] text-muted-foreground/70">{i + 1}</td>
              <td><article data-market-id={r.event.id} className="flex items-center gap-2"><h3 className="truncate text-[13px] font-semibold"><Link to={marketPath(r.event)}>{r.event.name}</Link></h3><Cat r={r} /></article></td>
              <td><span className="inline-flex items-center gap-2.5"><span className="w-[84px] truncate text-[12px]">{r.lead.label}</span><b className="w-10 text-right font-mono text-[15px] font-semibold tabular-nums">{r.probability}%</b><Move r={r} /><span className="relative h-1 w-20 overflow-hidden rounded-sm bg-[#262A31]"><i className={cn("absolute inset-y-0 left-0", /^no$|^not /i.test(r.lead.label) ? "bg-no" : "bg-yes")} style={{ width: `${r.probability}%` }} /></span></span></td>
              <td className="text-right font-mono tabular-nums">{fmtUsd(r.activity.volume)}</td>
              <td className="text-right font-mono tabular-nums text-muted-foreground">{fmtInt(r.activity.trades)}</td>
              <td className="text-right font-mono text-muted-foreground" style={{ paddingRight: 20 }}><time dateTime={r.event.end_date}>{fmtDate(r.event.end_date)}</time></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ---------- movers ---------- */
export const MoverList = ({ title, rows, tone }: { title: string; rows: MarketRow[]; tone: "up" | "down" }) => (
  <div className="trading-card p-4">
    <div className={cn("text-[10px] font-semibold uppercase tracking-[0.1em]", tone === "up" ? "text-trading-green" : "text-trading-red")}>{tone === "up" ? "▲" : "▼"} {title}</div>
    {rows.length === 0 ? (
      <p className="mt-3 text-[13px] text-muted-foreground">{tone === "up" ? t("insights.messages.no_gainers") : t("insights.messages.no_losers")}</p>
    ) : rows.map((r) => (
      <article key={r.event.id} data-market-id={r.event.id} className="flex items-center justify-between gap-3 border-t border-[#1D2026] py-2.5 first-of-type:border-t-0">
        <div className="min-w-0"><h3 className="truncate text-[13px] font-semibold"><Link to={marketPath(r.event)} className="hover:text-primary">{r.event.name}</Link> <span className="font-normal text-muted-foreground">· {r.lead.label}</span></h3><Cat r={r} /></div>
        <MoveText r={r} />
      </article>
    ))}
  </div>
);

/* ---------- category table ---------- */
export const CategoryTable = ({ rows }: { rows: MarketRow[] }) => {
  const groups = new Map<string, { slug: string; label: string; n: number; vol24: number; total: number }>();
  let all = 0;
  for (const r of rows) {
    const slug = categorySlugFor(r.event.category);
    const g = groups.get(slug) ?? { slug, label: categoryLabelForKey(r.event.category), n: 0, vol24: 0, total: 0 };
    g.n += 1; g.vol24 += r.activity.volume; g.total += Number(r.event.volume) || 0; all += r.activity.volume;
    groups.set(slug, g);
  }
  const list = [...groups.values()].sort((a, b) => b.vol24 - a.vol24);
  return (
    <div className="trading-card overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead><tr className="text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground"><th className="px-3 py-2">{t("insights.labels.category")}</th><th className="px-3 py-2">{t("insights.labels.markets")}</th><th className="px-3 py-2">{t("insights.labels.volume_24h")}</th><th className="px-3 py-2">{t("insights.labels.share")}</th><th className="px-3 py-2" /></tr></thead>
        <tbody>{list.map((g) => (
          <tr key={g.slug} className="border-t border-[#1D2026]">
            <td className="px-3 py-2.5 font-semibold">{g.label}</td>
            <td className="px-3 py-2.5 font-mono">{g.n}</td>
            <td className="px-3 py-2.5 font-mono">{fmtUsd(g.vol24)}</td>
            <td className="px-3 py-2.5"><div className="h-1.5 w-[120px] overflow-hidden rounded bg-[#1D2026]"><i className="block h-full bg-primary" style={{ width: `${all ? (g.vol24 / all) * 100 : 0}%` }} /></div></td>
            <td className="px-3 py-2.5 text-right"><Link to={`/insights/category/${g.slug}`} className="text-[12px] text-primary hover:underline">{t("insights.actions.category_insights", { category: g.label })} →</Link></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
};

/* ---------- GEO blocks ---------- */
export const CiteBlock = ({ sentence, url }: { sentence: string; url: string }) => (
  <aside className="mt-8 rounded-xl border border-dashed border-[#262A31] bg-card px-4 py-3.5 text-[12px] text-muted-foreground">
    <b className="text-foreground">{t("insights.cite.title")}</b>
    <code className="mt-1.5 block whitespace-pre-wrap font-mono text-foreground/90">{sentence} {t("insights.cite.source")}: {url}</code>
  </aside>
);

export const HowComputed = ({ asOf }: { asOf?: string }) => (
  <section className="mt-6 text-[12px] leading-relaxed text-muted-foreground">
    <h2 className="mb-1 text-[13px] font-semibold text-foreground">{t("insights.how.title")}</h2>
    <p>{t("insights.how.body")}{asOf && <> {t("insights.labels.as_of")} <time dateTime={asOf}>{fmtDateTimeUtc(asOf)}</time>.</>} {t("insights.how.brand")}</p>
  </section>
);

export const Empty = ({ text }: { text: string }) => (
  <div className="rounded-xl border border-dashed border-[#262A31] px-4 py-6 text-center text-[13px] text-muted-foreground">{text}</div>
);

export const untilText = (end: string) => untilLabel(end);
