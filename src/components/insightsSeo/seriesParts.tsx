/**
 * Insights v2 — shared UI for the asset series / home / accuracy pages (mock insights-ia-mock v3 + mobile mock, CPO 批 2026-09-28).
 * Grammar: Up always left · Down always right, majority bold + coloured on the MARKET axis (--yes / --no);
 * every number mono tabular; 52px desktop rows; mobile = two-line list rows, never a flattened table.
 *
 * Brand backflow 2026-10-12 (Figma omenx_lite · pc 1000:10405 @1440 / mobile 1004:21 @390, ratio 1:1 — the 1232px content
 * column equals our max-w-7xl − px-6): SeriesOpening gains a right-hand illustration + blue eyebrow + 48px H1 with accent;
 * SeriesSection becomes a two-column editorial head (blue "01 CRYPTO" eyebrow · 30px display title · lede · 18px link | 745×162 art);
 * Strip tiles grow to 48px numbers with blue labels; DataFooter splits into section heading + two cards + quote card.
 * Kept per site rules, not the draft: container py-10 (draft 60), mobile px-4 (draft 24), page/card colours stay on tokens
 * (draft #05070E / #111316 are same-colour drift), copy follows production.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { HELP_GUIDE_URL } from "@/lib/site";
import { fmtDateTimeUtc, fmtUsd, fmtInt } from "@/lib/insights";
import { c, majorityUp, mmss, type LiveRound } from "@/lib/insights/series";
import { useNow } from "@/hooks/useInsightsSeries";
import type { Art } from "@/lib/insights/art";

/* ---------- opening (display h1 — BROWSE family, SEO-page exemption for eyebrow + lede) ----------
 * Figma 1000:10485 (pc): text column 744 · gap 32 · art 456×341 right, top-aligned; eyebrow Archivo 600 11/15 tracking 2px primary;
 * H1 Space Grotesk 700 48/1.2 with `accent` substring in primary; lede Archivo 18/24 muted (<b> = white).
 * Figma 1004:34 (mobile): eyebrow 12/17 · H1 28/32 · lede 14/18 · art 342×256 band · "As of" below. */
export const SeriesOpening = ({ eyebrow, title, accent, lede, asOf, art }: { eyebrow: string; title: string; accent?: string; lede: React.ReactNode; asOf?: string; art?: Art }) => {
  const i = accent ? title.indexOf(accent) : -1;
  const heading = i >= 0 ? <>{title.slice(0, i)}<span className="text-primary">{accent}</span>{title.slice(i + accent!.length)}</> : title;
  return (
    <header className="mb-10 md:mb-8">
      {/* Figma: the text column is exactly (1232 − art width) wide and vertically centred on the art (home 1000:10485: 744 | 456;
          hubs 1001:15935 etc.: 700 | 532, 620 | 612). Flex row, no gap, art at natural size. */}
      <div className={cn(art && "md:flex md:items-center")}>
        <div className={cn("min-w-0", art ? "md:flex-1 md:pr-6" : "md:max-w-[744px]")}>
          <div className="text-[12px] font-semibold uppercase leading-[17px] tracking-[0.04em] text-primary md:text-[11px] md:leading-[15px] md:tracking-[2px]">{eyebrow}</div>
          <h1 className="mt-2 font-display text-[28px] font-bold leading-[1.15] tracking-[-0.02em] md:mt-2.5 md:max-w-[744px] md:text-[48px] md:leading-[1.2] md:tracking-normal">{heading}</h1>
          <p className="mt-3 text-[14px] leading-[18px] text-muted-foreground md:mt-5 md:max-w-[744px] md:text-[18px] md:leading-6 [&_b]:font-medium [&_b]:text-foreground">{lede}</p>
        </div>
        {art && <Illustration art={art} variant="hero" />}
      </div>
      {asOf && <div className="mt-4 flex justify-end md:mt-0"><AsOfLive iso={asOf} /></div>}
    </header>
  );
};

/** Editorial illustration — flat Figma export with the fade-to-background baked in; decorative only. */
export const Illustration = ({ art, variant, className }: { art: Art; variant: "hero" | "section"; className?: string }) => (
  <>
    <img src={art.mobile} width={art.mw} height={art.mh} alt="" aria-hidden loading={variant === "hero" ? "eager" : "lazy"} decoding="async" draggable={false}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      className={cn("pointer-events-none mt-4 block h-auto w-full select-none md:hidden", variant === "hero" ? "rounded-xl" : "rounded-[4px]", className)} />
    <img src={art.pc} width={art.w} height={art.h} alt="" aria-hidden loading={variant === "hero" ? "eager" : "lazy"} decoding="async" draggable={false}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      className={cn("pointer-events-none hidden h-auto shrink-0 select-none md:block", variant === "hero" ? "max-w-[50%] rounded-xl" : "max-w-[60%] rounded-xl", className)} />
  </>
);

export const AsOfLive = ({ iso }: { iso: string }) => (
  <span className="whitespace-nowrap pb-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground/70">
    <i className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-trading-green align-[1px]" />As of <time dateTime={iso}>{fmtDateTimeUtc(iso)}</time>
  </span>
);

/* ---------- section head ----------
 * Figma 1000:10535 (pc): two columns — left 485: eyebrow "01 CRYPTO" (Archivo 600 11/15 tracking 2px primary) · title Space Grotesk 500 30 · lede 14/20 muted (pt-12) · link Archivo 600 18 primary (gap 20);
 * right: art 745×162 rounded 12. Meta capsule (when no art / no link) stays top-right. Table starts 60 below the head (pt-12 + mt-12).
 * Figma 1004:132 (mobile): eyebrow 12/17 · title Space Grotesk 600 20 · link 14/20 · art 342×164 band rounded 4 · list 20 below. */
export const SeriesSection = ({ n, eyebrow, title, meta, more, intro, art, children }: { n?: string; eyebrow?: string; title: string; meta?: string; more?: { label: string; to: string }; intro?: React.ReactNode; art?: Art; children: React.ReactNode }) => (
  <section className="mb-10 md:mb-12">
    <div className={cn("mb-5 md:mb-6", art && "md:flex md:items-start md:justify-between md:gap-6")}>
      <div className={cn("min-w-0", art ? "md:max-w-[485px] md:flex-1" : "flex flex-col items-start gap-3 md:flex-row md:justify-between")}>
        <div className={cn("min-w-0", !art && "flex-1 md:max-w-[760px]")}>
          {(n || eyebrow) && <div className="text-[12px] font-semibold uppercase leading-[17px] tracking-[0.04em] text-primary md:text-[11px] md:leading-[15px] md:tracking-[2px]">{[n, eyebrow].filter(Boolean).join(" ")}</div>}
          <h2 className={cn("mt-1.5 font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.01em] md:mt-2.5 md:text-[30px] md:font-medium md:leading-[36px]", art && "capitalize")}>{title}</h2>
          {intro && <p className="mt-3 text-[13px] leading-[19px] text-muted-foreground md:text-[14px] md:leading-5 [&_b]:font-semibold [&_b]:text-foreground">{intro}</p>}
          {more && <Link to={more.to} className="mt-3 inline-block text-[14px] font-semibold text-primary md:mt-5 md:text-[18px]">{more.label} →</Link>}
        </div>
        {!art && meta && <span className="shrink-0 rounded-full md:mt-1 border border-[#1D2026] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70">{meta}</span>}
      </div>
      {art && <Illustration art={art} variant="section" />}
    </div>
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
      <div key={i} className={cn("flex flex-col p-3.5 md:px-6 md:py-5", i % 2 === 1 && "border-l border-[#1D2026]", i >= 2 && "border-t border-[#1D2026]")}>
        <dt className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-[10px]">{t.l}</dt>
        <div className="mt-auto pt-2">
          <dd className="font-display text-[22px] font-bold leading-[1.1] tracking-[-0.02em] tabular-nums md:text-[30px]">{t.v}{t.unit && <span className="ml-1.5 text-[13px] font-medium text-muted-foreground">{t.unit}</span>}</dd>
          {t.d && <dd className="mt-1.5 font-mono text-[10px] text-muted-foreground/70 md:text-[11px] [&_b]:font-medium">{t.d}</dd>}
        </div>
      </div>
    ))}
  </dl>
);

/* ---------- platform strip ----------
 * Figma 1000:10500 (pc): one card, four 308×173 cells (px-20 py-24): label Space Grotesk 600 10/15 tracking 1.2 primary · value Space Grotesk 700 48/66 · sub Space Grotesk 500 11.
 * Figma 1004:42 (mobile): 2×2 separate cards 165×115 gap 12 (p-16): label 12 · value 32/38 · sub 12. */
export const Strip = ({ cells, cols = 4 }: { cells: { l: string; v: React.ReactNode; d?: React.ReactNode; small?: boolean }[]; cols?: 3 | 4 }) => (
  <dl className={cn("mb-8 grid md:mb-12 md:block md:gap-0", cols === 3 ? "grid-cols-3 gap-2" : "grid-cols-2 gap-3")}>
    <div className={cn("contents md:grid md:overflow-hidden md:rounded-xl md:border md:border-[#1D2026] md:bg-card", cols === 3 ? "md:grid-cols-3" : "md:grid-cols-4")}>
      {/* Cross-cell alignment rule (CPO 2026-10-12): label sits at the top, number + sub-line are anchored to the bottom (mt-auto) so the
          numbers line up across cells even when one label wraps to two lines. Cells are equal height (grid stretch). */}
      {cells.map((x, i) => (
        <div key={i} className={cn("flex min-w-0 flex-col overflow-hidden whitespace-nowrap rounded-xl border border-[#1D2026] bg-card md:rounded-none md:border-0 md:px-5 md:py-6", cols === 3 ? "px-2.5 py-4" : "p-4", i >= 1 && "md:border-l md:border-[#1D2026]")}>
          <dt className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-primary", cols === 3 && "whitespace-normal leading-[15px]")}>{x.l}</dt>
          <div className="mt-auto pt-1.5 md:pt-4">
            <dd className={cn("overflow-hidden text-ellipsis font-display font-bold leading-[38px] tracking-[-0.02em] tabular-nums md:leading-[66px]", x.small ? "text-[22px] md:text-[36px]" : cols === 3 ? "text-[24px] md:text-[48px]" : "text-[28px] md:text-[48px]")}>{x.v}</dd>
            <dd className="mt-2 h-[16px] truncate font-mono text-[11px] font-medium text-muted-foreground/70 md:mt-3.5">{x.d ?? "\u00a0"}</dd>
          </div>
        </div>
      ))}
    </div>
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
/* ---------- About this data ----------
 * Figma 1000:11238 (pc, 1232 wide): divider · section heading (eyebrow "06 · DATA & METHODOLOGY" + "About this data" Space Grotesk 500 30/36, gap 8)
 * · row of two cards 432 + 776, gap 24, p-24, h 211 (OmenX wordmark 102×15 / three 14/22 lines / "How it works →" 14 primary ‖ "What these numbers mean" 20/26 · legend 14/21 · "Full methodology →")
 * · quote card: bg #091117 border primary/20 p-24: title 20/26 + 12/18 guidance (240) | code 12/19.5 on white/3 rounded 12 | Copy 96×36 bg primary text #04070F 14/600.
 * Mobile (1004:*): the same blocks stacked, cards full width. */
export const DataFooter = ({ n = "06", settle = "Settles on the reference index", legend, sentence, url }: { n?: string; settle?: string; legend: React.ReactNode; sentence: string; url: string }) => {
  const [copied, setCopied] = useState(false);
  const line = `${sentence} Source: ${url}`;
  const copy = async () => { try { await navigator.clipboard.writeText(line); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ } };
  return (
    <section aria-labelledby="about-this-data" className="border-t border-[#1D2026] pt-6 md:-mt-2">
      <div className="text-[12px] font-semibold uppercase leading-[17px] tracking-[0.04em] text-primary md:text-[11px] md:leading-[15px] md:tracking-[2px]">{n} · Data &amp; methodology</div>
      <h2 id="about-this-data" className="mt-1.5 font-display text-[20px] font-semibold leading-[1.2] md:mt-2 md:text-[30px] md:font-medium md:leading-[36px]">About this data</h2>
      <div className="mt-5 grid gap-4 md:mt-6 md:grid-cols-[432px_minmax(0,1fr)] md:gap-6">
        <div className="trading-card p-5 md:p-6">
          <div className="font-display text-[15px] font-bold uppercase tracking-[0.04em]">OmenX</div>
          <dl className="mt-3 space-y-2 text-[13px] leading-[22px] text-muted-foreground md:mt-4 md:text-[14px]">
            <dd>Trade Up or Down with up to 10× Boost</dd>
            <dd>{settle}</dd>
            <dd>USDC on Base</dd>
          </dl>
          <a href={HELP_GUIDE_URL} target="_blank" rel="noopener" className="mt-3 inline-block text-[14px] font-semibold text-primary">How it works →</a>
        </div>
        <div className="trading-card p-5 md:p-6">
          <h3 className="font-display text-[17px] font-medium md:text-[20px] md:leading-[26px]">What these numbers mean</h3>
          <p className="mt-2.5 text-[13px] leading-[20px] text-muted-foreground md:mt-3 md:text-[14px] md:leading-[21px]">{legend}</p>
          <a href={HELP_GUIDE_URL} target="_blank" rel="noopener" className="mt-5 inline-block text-[14px] font-semibold text-primary md:mt-8">Full methodology →</a>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-primary/20 bg-[#091117] p-5 md:mt-6 md:flex md:items-center md:gap-6 md:p-6">
        <div className="md:w-[240px] md:shrink-0">
          <h3 className="font-display text-[17px] font-medium md:text-[20px] md:leading-[26px]">Quote this page</h3>
          <p className="mt-1 text-[12px] leading-[18px] text-muted-foreground">Names the number, the date and where it came from.</p>
        </div>
        <code className="mt-3 block min-w-0 flex-1 whitespace-pre-wrap rounded-xl bg-white/[0.03] px-3 py-2.5 font-mono text-[12px] leading-[19.5px] text-[#E6E8EB] md:mt-0">{line}</code>
        <button type="button" onClick={copy} className={cn("mt-3 h-9 w-24 shrink-0 rounded-lg text-[14px] font-semibold transition-colors md:mt-0", copied ? "bg-trading-green text-[#04070F]" : "bg-primary text-[#04070F] hover:bg-primary/90")}>{copied ? "Copied" : "Copy"}</button>
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
