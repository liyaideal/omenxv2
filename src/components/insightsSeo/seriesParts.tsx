/**
 * Insights v2 — shared UI for the asset series / home / accuracy pages (mock insights-ia-mock v3 + mobile mock, CPO 批 2026-09-28).
 * Grammar: Up always left · Down always right, majority bold + coloured on the MARKET axis (--yes / --no);
 * every number mono tabular; 52px desktop rows; mobile = two-line list rows, never a flattened table.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { HELP_GUIDE_URL } from "@/lib/site";
import { fmtDateTimeUtc, fmtUsd, fmtInt } from "@/lib/insights";
import { c, majorityUp, mmss, type LiveRound } from "@/lib/insights/series";
import { useNow } from "@/hooks/useInsightsSeries";

/* ---------- opening (display h1 — BROWSE family, SEO-page exemption for eyebrow + lede) ---------- */
export const SeriesOpening = ({ eyebrow, title, lede, asOf }: { eyebrow: string; title: string; lede: React.ReactNode; asOf?: string }) => (
  <header className="mb-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{eyebrow}</div>
        <h1 className="mt-2 max-w-[24ch] font-display text-[28px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[40px]">{title}</h1>
        <p className="mt-3 max-w-[74ch] text-[13px] leading-relaxed text-muted-foreground md:text-[15px]">{lede}</p>
      </div>
      {asOf && <AsOfLive iso={asOf} />}
    </div>
  </header>
);

export const AsOfLive = ({ iso }: { iso: string }) => (
  <span className="whitespace-nowrap pb-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground/70">
    <i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-trading-green align-[1px]" />As of <time dateTime={iso}>{fmtDateTimeUtc(iso)}</time>
  </span>
);

/* ---------- section head (mock: "01" 12px mono grey + 18px h2, right meta capsule or link) ---------- */
export const SeriesSection = ({ n, title, meta, more, intro, children }: { n?: string; title: string; meta?: string; more?: { label: string; to: string }; intro?: React.ReactNode; children: React.ReactNode }) => (
  <section className="mb-10">
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
      <h2 className="text-[16px] font-semibold tracking-[-0.01em] md:text-[18px]">{n && <span className="mr-2.5 font-mono text-[12px] tracking-[0.06em] text-muted-foreground/60">{n}</span>}{title}</h2>
      {more ? <Link to={more.to} className="text-[12px] font-semibold text-primary">{more.label} →</Link>
        : meta ? <span className="rounded-full border border-[#1D2026] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">{meta}</span> : null}
    </div>
    {intro && <p className="mb-3 max-w-[92ch] text-[12px] leading-relaxed text-muted-foreground md:text-[13px] [&_b]:font-semibold [&_b]:text-foreground">{intro}</p>}
    {children}
  </section>
);

/* ---------- Up · Down pair (Up left, Down right, majority bold) ---------- */
export const UpDownPair = ({ up, down, size = "md" }: { up: number; down: number; size?: "sm" | "md" }) => {
  const upMaj = up >= down;
  const w = size === "sm" ? "w-14" : "w-20";
  const side = size === "sm" ? "w-16 text-[12px]" : "w-[72px] text-[13px]";
  return (
    <span className="inline-flex items-center gap-2 font-mono tabular-nums">
      <span className={cn(side, upMaj ? "font-semibold text-yes" : "text-[11px] text-muted-foreground")}>Up {c(up)}</span>
      <span className={cn("relative h-1 overflow-hidden rounded-sm bg-no", w)}><i className="absolute inset-y-0 left-0 bg-yes" style={{ width: `${Math.round(up * 100)}%` }} /></span>
      <span className={cn(side, !upMaj ? "font-semibold text-no" : "text-[11px] text-muted-foreground")}>Down {c(down)}</span>
    </span>
  );
};

/** Rule 1 (2026-09-30): the one plain sentence every accuracy block opens with. */
export const CROWD_LEDE = "Before every round settles, one side is priced above 50¢ — that's where the crowd leans. We count how often that side actually won. 50% is a coin flip.";
export const CrowdLegend = ({ noun = "round" }: { noun?: string }) => (
  <>Before every {noun} settles, one side is priced above 50¢ — that's where the <b className="font-medium text-foreground">crowd</b> leans. <b className="font-medium text-foreground">Crowd was right</b> is how often that side actually won. 50% is a coin flip.</>
);

export const MajorityTag = ({ up, down, prefix }: { up: number; down: number; prefix?: string }) => {
  const upMaj = up >= down;
  return (
    <span className={cn("inline-flex h-5 items-center whitespace-nowrap rounded-[5px] border px-1.5 font-mono text-[11px] font-semibold", upMaj ? "border-yes/40 text-yes" : "border-no/40 text-no")}>
      {prefix}{upMaj ? `Up ${c(up)}` : `Down ${c(down)}`}
    </span>
  );
};

export const FavTag = ({ label, price }: { label: string; price: number }) => (
  <span className="inline-flex h-5 max-w-full items-center gap-1.5 whitespace-nowrap rounded-[5px] border border-yes/40 px-1.5 font-mono text-[11px] font-semibold text-yes"><span className="truncate">{label}</span>{c(price)}</span>
);

export const LivePill = ({ label = "LIVE" }: { label?: string }) => (
  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-trading-red"><i className="h-1.5 w-1.5 rounded-full bg-trading-red" />{label}</span>
);

export const RightWrong = ({ ok, note }: { ok: boolean; note?: string }) => (
  <span className={cn("font-semibold", ok ? "text-trading-green" : "text-trading-red")}>{ok ? "✓ right" : "✗ wrong"}{note && <span className="font-normal text-muted-foreground"> · {note}</span>}</span>
);

/* ---------- hit % coloured by MONEY axis around 50 ---------- */
export const Hit = ({ v, big }: { v: number | null; big?: boolean }) => (
  <span className={cn("font-mono tabular-nums", big ? "text-[15px] font-semibold" : "", v == null ? "text-muted-foreground" : v >= 55 ? "text-trading-green" : v <= 45 ? "text-trading-red" : "")}>{v == null ? "—" : `${v}%`}</span>
);

/* ---------- countdown ---------- */
export const SettlesIn = ({ end, className }: { end: string; className?: string }) => {
  const now = useNow();
  return <span className={cn("font-mono tabular-nums", className)}>{mmss(new Date(end).getTime() - now)}</span>;
};

/* ---------- live card (asset / sport hero, desktop 5/12 · mobile full) ---------- */
export const LiveCard = ({ eyebrow, when, upLabel = "Up", downLabel = "Down", round, sub, foot, cta }: {
  eyebrow: React.ReactNode; when: React.ReactNode; upLabel?: string; downLabel?: string; round: LiveRound; sub: React.ReactNode; foot: React.ReactNode; cta?: { label: string; to: string };
}) => {
  const upMaj = majorityUp(round);
  const big = upMaj ? `${upLabel} ${Math.round(round.up_price * 100)}%` : `${downLabel} ${Math.round(round.down_price * 100)}%`;
  const small = upMaj ? `${downLabel} ${Math.round(round.down_price * 100)}%` : `${upLabel} ${Math.round(round.up_price * 100)}%`;
  return (
    <div className="trading-card p-4 md:p-6">
      <div className="flex justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span><i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-trading-red" />{eyebrow}</span><span>{when}</span></div>
      <div className="mt-4 flex items-baseline gap-3">
        <b className={cn("font-display text-[44px] font-bold leading-none tracking-[-0.03em] md:text-[56px]", upMaj ? "text-yes" : "text-no")}>{big}</b>
        <span className="font-mono text-[16px] font-semibold text-muted-foreground md:text-[20px]">{small}</span>
      </div>
      <p className="mt-2.5 text-[12px] text-muted-foreground md:text-[13px]">{sub}</p>
      <div className="mt-4 flex h-2 overflow-hidden rounded-[4px]"><i className="bg-yes" style={{ width: `${Math.round(round.up_price * 100)}%` }} /><i className="flex-1 bg-no" /></div>
      <div className="mt-2 flex justify-between font-mono text-[11px]"><span className="text-yes">{upLabel} · {c(round.up_price)}</span><span className="text-no">{downLabel} · {c(round.down_price)}</span></div>
      <div className="mt-5 flex items-center justify-between border-t border-[#1D2026] pt-4">
        <span className="font-mono text-[12px] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">{foot}</span>
        {cta && <Link to={cta.to} className="hidden h-9 items-center rounded-full bg-foreground px-4 text-[13px] font-semibold text-[#0B0D10] md:inline-flex">{cta.label} →</Link>}
      </div>
    </div>
  );
};

/* ---------- 2×2 tiles ---------- */
export interface Tile { l: string; v: React.ReactNode; unit?: string; d?: React.ReactNode }
export const FourTiles = ({ tiles }: { tiles: Tile[] }) => (
  <dl className="trading-card grid grid-cols-2 overflow-hidden">
    {tiles.map((t, i) => (
      <div key={i} className={cn("p-3.5 md:px-6 md:py-5", i % 2 === 1 && "border-l border-[#1D2026]", i >= 2 && "border-t border-[#1D2026]")}>
        <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-[10px]">{t.l}</dt>
        <dd className="mt-2 font-display text-[22px] font-bold leading-[1.1] tracking-[-0.02em] tabular-nums md:text-[30px]">{t.v}{t.unit && <span className="ml-1.5 text-[13px] font-medium text-muted-foreground">{t.unit}</span>}</dd>
        {t.d && <dd className="mt-1.5 font-mono text-[10px] text-muted-foreground/70 md:text-[11px] [&_b]:font-medium">{t.d}</dd>}
      </div>
    ))}
  </dl>
);

/* ---------- platform strip (4 cells, stacked label/value) ---------- */
export const Strip = ({ cells }: { cells: { l: string; v: React.ReactNode; d?: React.ReactNode }[] }) => (
  <dl className="trading-card mb-8 grid grid-cols-2 overflow-hidden md:grid-cols-4">
    {cells.map((x, i) => (
      <div key={i} className={cn("min-w-0 overflow-hidden whitespace-nowrap px-3.5 py-3 md:px-5 md:py-3.5", i % 2 === 1 && "border-l border-[#1D2026]", i >= 2 && "border-t border-[#1D2026] md:border-t-0", i >= 1 && "md:border-l")}>
        <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-[10px]">{x.l}</dt>
        <dd className="mt-2 overflow-hidden text-ellipsis font-display text-[20px] font-bold leading-none tracking-[-0.02em] tabular-nums md:text-[22px]">{x.v}</dd>
        {x.d && <dd className="mt-1.5 truncate font-mono text-[10px] font-medium text-muted-foreground/70 md:text-[11px]">{x.d}</dd>}
      </div>
    ))}
  </dl>
);

/* ---------- desktop table shell (v7 grammar) + mobile list shell ---------- */
export const Table = ({ head, children, minWidth = 960 }: { head: React.ReactNode; children: React.ReactNode; minWidth?: number }) => (
  <div className="trading-card overflow-x-auto">
    <table className="w-full border-collapse text-[13px]" style={{ tableLayout: "fixed", minWidth }}>
      <thead><tr className="h-9 bg-white/[0.02] text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70 [&_th]:whitespace-nowrap [&_th]:px-3">{head}</tr></thead>
      <tbody className="[&_td]:h-[52px] [&_td]:overflow-hidden [&_td]:whitespace-nowrap [&_td]:border-t [&_td]:border-[#1D2026] [&_td]:px-3 [&_tr]:cursor-pointer [&_tr:hover_td]:bg-white/[0.02]">{children}</tbody>
    </table>
  </div>
);
export const Th = ({ w, r, children }: { w?: number; r?: boolean; children?: React.ReactNode }) => <th style={w ? { width: w } : undefined} className={r ? "text-right" : undefined}>{children}</th>;
export const Td = ({ r, dim, mono, className, children }: { r?: boolean; dim?: boolean; mono?: boolean; className?: string; children?: React.ReactNode }) => (
  <td className={cn(r && "text-right", dim && "text-muted-foreground", mono && "font-mono tabular-nums", className)}>{children}</td>
);

export const List = ({ children }: { children: React.ReactNode }) => <div className="trading-card px-3.5 [&>*+*]:border-t [&>*+*]:border-[#1D2026]">{children}</div>;
export const Row = ({ l1, l2, to }: { l1: React.ReactNode; l2?: React.ReactNode; to?: string }) => {
  const inner = (<><div className="flex items-center justify-between gap-2.5">{l1}</div>{l2 && <div className="mt-1.5 flex items-center justify-between gap-2.5">{l2}</div>}</>);
  return to ? <Link to={to} className="block py-2.5">{inner}</Link> : <div className="py-2.5">{inner}</div>;
};
export const Chip = ({ children }: { children: React.ReactNode }) => <span className="flex-none rounded border border-[#262A31] px-1.5 py-[3px] font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">{children}</span>;
export const Name = ({ children, sub, chip }: { children: React.ReactNode; sub?: string; chip?: string }) => (
  <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-semibold"><span className="truncate">{children}</span>{sub && <small className="truncate text-[11px] font-normal text-muted-foreground/70">{sub}</small>}{chip && <Chip>{chip}</Chip>}</span>
);

/* ---------- responsive switch ---------- */
export const Responsive = ({ desktop, mobile }: { desktop: React.ReactNode; mobile: React.ReactNode }) => { const m = useIsMobile(); return <>{m ? mobile : desktop}</>; };

/* ---------- page-end "About this data" card (CPO 2026-09-30: one designed block, not three loose modules) ----------
 * Three columns on desktop, stacked on mobile: who we are · what the numbers mean · a copy-ready quote.
 * Semantics stay for GEO (h2 / dl / aside / code); the visual is one trading-card with an eyebrow. */
export const DataFooter = ({ settle = "Settles on the reference index", legend, sentence, url }: { settle?: string; legend: React.ReactNode; sentence: string; url: string }) => {
  const [copied, setCopied] = useState(false);
  const line = `${sentence} Source: ${url}`;
  const copy = async () => { try { await navigator.clipboard.writeText(line); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ } };
  return (
    <section aria-labelledby="about-this-data" className="trading-card mt-2 overflow-hidden">
      <div className="border-b border-[#1D2026] px-4 py-3 md:px-6">
        <h2 id="about-this-data" className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">About this data</h2>
      </div>
      <div className="grid md:grid-cols-12">
        <div className="px-4 py-4 md:col-span-3 md:px-6 md:py-5">
          <div className="text-[13px] font-semibold">OmenX</div>
          <dl className="mt-2 space-y-1.5 text-[12px] text-muted-foreground md:text-[13px]">
            <dd>Trade Up or Down with up to 10× Boost</dd>
            <dd>{settle}</dd>
            <dd>USDC on Base</dd>
          </dl>
          <a href={HELP_GUIDE_URL} target="_blank" rel="noopener" className="mt-3 inline-block text-[12px] font-semibold text-primary">How it works →</a>
        </div>
        <div className="border-t border-[#1D2026] px-4 py-4 md:col-span-5 md:border-l md:border-t-0 md:px-6 md:py-5">
          <h3 className="text-[13px] font-semibold">What these numbers mean</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground md:text-[13px]">{legend} <a href={HELP_GUIDE_URL} target="_blank" rel="noopener" className="text-primary">Full methodology →</a></p>
        </div>
        <aside className="border-t border-[#1D2026] px-4 py-4 md:col-span-4 md:border-l md:border-t-0 md:px-6 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[13px] font-semibold">Quote this page</h3>
            <button type="button" onClick={copy} className={cn("h-7 rounded-full border px-3 font-mono text-[11px] font-semibold transition-colors", copied ? "border-trading-green/50 text-trading-green" : "border-[#262A31] text-muted-foreground hover:text-foreground")}>{copied ? "Copied" : "Copy"}</button>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground/70">Names the number, the date and where it came from.</p>
          <code className="mt-2.5 block whitespace-pre-wrap rounded-lg bg-white/[0.03] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-[#E6E8EB] md:text-[12px]">{line}</code>
        </aside>
      </div>
    </section>
  );
};
/* legacy pieces kept for the v1 daily / category pages */
export const PlatformLine = ({ settle = "settles on the reference index" }: { settle?: string }) => (
  <div className="mb-8 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[10px] border border-[#1D2026] bg-white/[0.015] px-4 py-3 font-mono text-[11px] text-muted-foreground md:text-[12px]">
    <b className="font-semibold text-foreground">OmenX</b><Dot />Trade Up or Down with up to 10× Boost<Dot />{settle}<Dot />USDC on Base<Dot /><a href={HELP_GUIDE_URL} target="_blank" rel="noopener" className="text-primary">How it works →</a>
  </div>
);
const Dot = () => <i className="h-1 w-1 rounded-full bg-muted-foreground/50" />;
export const HowComputed = ({ children }: { children: React.ReactNode }) => (
  <section className="max-w-[100ch] text-[12px] leading-relaxed text-muted-foreground md:text-[13px]">
    <h2 className="mb-1.5 text-[13px] font-semibold text-foreground md:text-[14px]">What these numbers mean</h2>
    <p>{children} <a href={HELP_GUIDE_URL} target="_blank" rel="noopener" className="text-primary">Full methodology →</a></p>
  </section>
);
export const Cite = ({ sentence, url }: { sentence: string; url: string }) => (
  <aside className="mt-4 rounded-xl border border-dashed border-[#262A31] px-4 py-3 text-[12px] text-muted-foreground md:text-[13px]">
    <b className="text-foreground">Quoting this page?</b> Copy the line below — it names the number, the date and where it came from.
    <code className="mt-2 block whitespace-pre-wrap rounded-lg bg-white/[0.03] px-3 py-2 font-mono text-[12px] leading-relaxed text-[#E6E8EB]">{sentence} Source: {url}</code>
  </aside>
);

/* ---------- sticky mobile CTA ---------- */
export const StickyCta = ({ to, label, sub }: { to: string; label: string; sub?: string }) => (
  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#1D2026] bg-gradient-to-b from-background/0 via-background to-background px-4 pb-4 pt-2.5 md:hidden">
    <Link to={to} className="flex h-[46px] items-center justify-center rounded-full bg-foreground text-[14px] font-semibold text-[#0B0D10]">{label}{sub && <small className="ml-2 font-medium text-[#4B5058]">{sub}</small>}</Link>
  </div>
);

export { fmtUsd, fmtInt };
