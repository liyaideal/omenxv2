// ============================================================
// HOME · §3 STOCKS (首页 All 改版 · R-A · K1–K6, 2026-11-09)
// Market tabs on one line (US / Hong Kong / Korea; CN later) + one status
// line; top 10 by round volume in two columns of five; each row = icon ·
// code + full name (never truncated) · 96×28 since-last-close sparkline ·
// price + % vs base · Up / Down 88px buttons. Three sparkline moments (K4):
// ① regular session → solid 1-minute line; ② closed but still printing
// (US after-hours / overnight) → same colour at half opacity; ③ closed, no
// prints yet (HK / KR after 16:00) → no chart, "Base price" beside the price.
// Mobile (M-Stocks): top 5, each stock on two lines.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import {
  HK_STOCK_SUBTYPE,
  KR_STOCK_SUBTYPE,
  US_STOCK_SUBTYPE,
  type StockEventRow,
} from "@/components/lite/intraday/intradayData";
import { deriveTickerFromEvent, stockCompanyName } from "@/components/SpotStatsHeader";
import { formatMarketPrice, getStockSessionState, resolveStockMarket, type StockMarket } from "@/lib/usStockSessions";
import { CY, DownButton, GREEN, OR, RED, SectionHead, UpButton, ht, leftText, rich, tradeLink } from "./homeAllShell";
import { t as tr, useT } from "@/i18n";

export type MarketKey = "us" | "hk" | "kr";
const MARKETS: { key: MarketKey; label: string; subtype: string; extendedPrints: boolean }[] = [
  { key: "us", label: "US", subtype: US_STOCK_SUBTYPE, extendedPrints: true },
  { key: "hk", label: "Hong Kong", subtype: HK_STOCK_SUBTYPE, extendedPrints: false },
  { key: "kr", label: "Korea", subtype: KR_STOCK_SUBTYPE, extendedPrints: false },
];

/* ------------------------- deterministic prints ------------------------- */
const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
export type PrintMode = "regular" | "extended" | "none";
export interface StockPrints {
  mode: PrintMode;
  /** 1-minute closes since the last official close (≤ 48 samples). */
  pts: number[];
  last: number;
}
/** Prints since the last close for the blueprint (真平台 → /underlying/bars?range=SINCE_CLOSE). */
export const printsFor = (row: StockEventRow, market: StockMarket, extendedPrints: boolean, now: Date): StockPrints => {
  const base = row.base_price ?? 0;
  const s = getStockSessionState(market, now);
  if (s.phase === "live") {
    const openAt = s.closeAt ? s.closeAt.getTime() - ((market.closeMinutes ?? 960) - (market.openMinutes ?? 570)) * 60_000 : now.getTime() - 3_600_000;
    return { mode: "regular", ...walk(row.id, base, Math.max(2, Math.floor((now.getTime() - openAt) / 60_000)), 0.004) };
  }
  if (!extendedPrints) return { mode: "none", pts: [], last: base };
  const since = s.lastCloseAt ? Math.floor((now.getTime() - s.lastCloseAt.getTime()) / 60_000) : 60;
  return { mode: "extended", ...walk(row.id, base, Math.max(2, since), 0.006) };
};
const walk = (id: string, base: number, minutes: number, sigTotal: number): { pts: number[]; last: number } => {
  // Fixed total move whatever the span: ≤ 48 samples, per-step σ = σ_total / √n.
  const rnd = mulberry32(hash(id));
  const n = Math.min(48, Math.max(2, minutes));
  const sig = sigTotal / Math.sqrt(n);
  const out: number[] = [base];
  let v = base;
  let drift = 0;
  for (let i = 1; i < n; i += 1) {
    const g1 = Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(2 * Math.PI * rnd());
    drift = drift * 0.6 + g1 * sig * 0.35;
    v = v * (1 + drift + (rnd() - 0.5) * sig * 0.8);
    out.push(v);
  }
  return { pts: out, last: v };
};

/* ------------------------------ sparkline ------------------------------ */
const Spark = ({ p, base, w, h }: { p: StockPrints; base: number; w: number; h: number }) => {
  if (p.mode === "none") {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={OR} strokeOpacity=".55" strokeDasharray="3 3" />
        <circle cx={w - 3} cy={h / 2} r="2.5" fill="#0B0D11" stroke="#6B7280" strokeWidth="1.2" />
      </svg>
    );
  }
  const vals = p.pts.concat([base]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.15, base * 0.0005);
  const Y = (v: number) => 2 + ((hi + pad - v) / (hi - lo + 2 * pad)) * (h - 4);
  const X = (i: number) => (i / Math.max(1, p.pts.length - 1)) * (w - 2) + 1;
  const col = p.last >= base ? GREEN : RED;
  const d = p.pts.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <line x1="0" y1={Y(base).toFixed(1)} x2={w} y2={Y(base).toFixed(1)} stroke={OR} strokeOpacity=".55" strokeDasharray="3 3" />
      <path d={d} fill="none" stroke={col} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity={p.mode === "extended" ? 0.5 : 1} />
    </svg>
  );
};

/* -------------------------------- rows --------------------------------- */
const pct = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}%`;

export interface HomeStocksSectionProps {
  stockRows: StockEventRow[];
  isMobile: boolean;
  /** Opens the Finance view (Show all). */
  onOpenAll: () => void;
  nowOverride?: Date;
  /** Fixture: force the sparkline moment regardless of the clock. */
  printModeOverride?: PrintMode;
  /** Fixture: which market tab starts selected (default US). Not passed in production. */
  initialMarket?: MarketKey;
}

export const HomeStocksSection = ({ stockRows, isMobile, onOpenAll, nowOverride, printModeOverride, initialMarket = "us" }: HomeStocksSectionProps) => {
  const navigate = useNavigate();
  useT(); // re-render on language change / catalog arrival
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (nowOverride) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [nowOverride]);
  const now = nowOverride ?? new Date(Date.now() + tick * 0);
  const [sel, setSel] = useState<MarketKey>(initialMarket);

  const byMarket = useMemo(() => {
    const m: Record<MarketKey, StockEventRow[]> = { us: [], hk: [], kr: [] };
    for (const r of stockRows) {
      const mk = MARKETS.find((x) => x.subtype === r.event_subtype);
      if (mk) m[mk.key].push(r);
    }
    return m;
  }, [stockRows]);
  const available = MARKETS.filter((m) => byMarket[m.key].length > 0);
  const cur = available.find((m) => m.key === sel) ?? available[0];
  if (!cur) return null;
  const market = resolveStockMarket(byMarket[cur.key][0]);
  const session = getStockSessionState(market, now);
  // K3: top 10 by this round's volume (mobile top 5); ties keep the feed order.
  const rows = [...byMarket[cur.key]].sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)).slice(0, isMobile ? 5 : 10);
  const prints = rows.map((r) => {
    const p = printsFor(r, market, cur.extendedPrints, now);
    if (!printModeOverride) return p;
    if (printModeOverride === "none") return { mode: "none" as const, pts: [], last: r.base_price ?? 0 };
    return { ...p, mode: printModeOverride };
  });
  const total = available.reduce((a, m) => a + byMarket[m.key].length, 0);
  // K2: Y = the next settlement still ahead. A round whose settle time has passed but the engine
  // hasn't rolled yet reads "settling now" — never "settles in 0s".
  const ends = rows.map((r) => (r.end_date ? new Date(r.end_date).getTime() : null)).filter((t): t is number => t != null);
  const ahead = ends.filter((t) => t > now.getTime());
  const settleAt = ahead.length ? Math.min(...ahead) : null;
  const settlingNow = !ahead.length && ends.length > 0;
  const status =
    session.phase === "live"
      ? ht("stocks.open_closes_in", { time: leftText(session.closeAt!.getTime() - now.getTime()) })
      : ht("stocks.opens_in", { time: leftText(session.nextOpenAt.getTime() - now.getTime()) });
  const statusLine = `${status}${settleAt ? ht("stocks.settles_in", { time: leftText(settleAt - now.getTime()) }) : settlingNow ? ht("stocks.settling_now") : ""}`;
  const live = prints.filter((p) => p.mode !== "none");
  const ups = rows.filter((r, i) => prints[i].mode !== "none" && prints[i].last > (r.base_price ?? 0)).length;
  // G3: stock rounds are spot events → /spot (not the contract page), with the side preselected.
  const go = (r: StockEventRow, side: "yes" | "no") => () => navigate(tradeLink(r.id, { side, spot: true }));

  const tabs = (
    <div className="row" style={{ gap: isMobile ? 18 : 22 }}>
      {available.map((m) => (
        <button key={m.key} type="button" className={`tab${m.key === cur.key ? " on" : ""}`} onClick={() => setSel(m.key)}>
          {ht(`stocks.market_${m.key}`)}
          <i>{byMarket[m.key].length}</i>
        </button>
      ))}
    </div>
  );
  const eyebrow = ht("stocks.eyebrow", { count: total });
  const question = <>{rich(ht("stocks.question"))}</>;

  const row = (r: StockEventRow, i: number, hr: boolean) => {
    const ticker = deriveTickerFromEvent(r.id, r.name);
    // Full name never truncates (K3); the short name rides in the event name ("Tencent (0700.HK) — …").
    const name = stockCompanyName(ticker, r.name);
    const base = r.base_price ?? 0;
    const p = prints[i];
    const chg = base ? ((p.last - base) / base) * 100 : 0;
    const cls = chg >= 0 ? "g" : "r";
    const priceTxt = formatMarketPrice(p.last, market);
    if (isMobile) {
      return (
        <div key={r.id} className="mstk">
          <AssetAvatar symbol={ticker} kind="equity" size={26} />
          <span style={{ minWidth: 0 }}>
            <span className="t" style={{ display: "block", fontWeight: 700, color: "#fff", fontSize: 14 }}>
              {ticker} <span style={{ color: "#98A1AD", fontWeight: 500, fontSize: 11.5 }}>{name}</span>
            </span>
          </span>
          <span style={{ textAlign: "right" }}>
            <span className="m" style={{ display: "block", color: "#fff", fontWeight: 600, fontSize: 14 }}>
              {priceTxt}
            </span>
            <span className={`m ${cls}`} style={{ display: "block", fontSize: 11 }}>
              {p.mode === "none" ? <span style={{ color: "#98A1AD" }}>{ht("stocks.base_price")}</span> : pct(chg)}
            </span>
          </span>
          <span className="l2">
            <Spark p={p} base={base} w={120} h={26} />
            <span className="row" style={{ gap: 6 }}>
              <UpButton price={r.upPrice} onClick={go(r, "yes")} />
              <DownButton price={r.downPrice} onClick={go(r, "no")} />
            </span>
          </span>
        </div>
      );
    }
    return (
      <div key={r.id} className={`srow${hr ? " hr" : ""}`}>
        <AssetAvatar symbol={ticker} kind="equity" size={26} />
        <span style={{ minWidth: 0 }}>
          <span className="t">{ticker}</span>
          <span className="n">{name}</span>
        </span>
        <Spark p={p} base={base} w={96} h={28} />
        <span style={{ minWidth: 0 }}>
          <span className="p m">{priceTxt}</span>
          <span className={`pc m ${cls}`}>{p.mode === "none" ? <span style={{ color: "#98A1AD" }}>{ht("stocks.base_price")}</span> : pct(chg)}</span>
        </span>
        <span className="row" style={{ gap: 8 }}>
          <UpButton price={r.upPrice} onClick={go(r, "yes")} />
          <DownButton price={r.downPrice} onClick={go(r, "no")} />
        </span>
      </div>
    );
  };

  const foot = (
    <div className="row" style={{ marginTop: isMobile ? 16 : 22, justifyContent: "space-between" }}>
      <span className="kv" style={{ fontSize: isMobile ? 11.5 : 12.5 }}>
        {live.length > 0 ? (
          <>
            {rich(ht(isMobile ? "stocks.above_base_short" : "stocks.above_base", { n: live.length }), { ups: <b style={{ color: GREEN }}>{ups}</b> })}
          </>
        ) : null}
      </span>
      <button type="button" className="lnk" style={{ fontSize: isMobile ? 13 : 13.5 }} onClick={onOpenAll}>
        {tr("events.screen.simple.home.show_all", { count: byMarket[cur.key].length })}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <section className="sec">
        <SectionHead eyebrow={eyebrow} eyebrowColor={CY} question={question} isMobile />
        <div style={{ marginTop: 18 }}>{tabs}</div>
        <div className="kv" style={{ fontSize: 11.5, marginTop: 10 }}>
          {statusLine}
        </div>
        <div style={{ marginTop: 6 }}>{rows.map((r, i) => row(r, i, true))}</div>
        {foot}
      </section>
    );
  }

  const left = rows.slice(0, 5);
  const right = rows.slice(5, 10);
  return (
    <section className="sec">
      <SectionHead
        eyebrow={eyebrow}
        eyebrowColor={CY}
        question={question}
        right={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {tabs}
            <span className="kv">{statusLine}</span>
          </div>
        }
      />
      {/* R7: 1280+ two columns of five; 768–1279 (still desktop) one column of ten — two columns don't fit there. */}
      <div className="stk2" style={{ marginTop: 28 }}>
        <div className="stk2-l">{left.map((r, i) => row(r, i, i < left.length - 1 || right.length > 0))}</div>
        <div className="stk2-r">
          {right.map((r, i) => row(r, i + 5, i < right.length - 1))}
        </div>
      </div>
      {foot}
    </section>
  );
};

export default HomeStocksSection;
