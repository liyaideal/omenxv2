// ============================================================
// HOME · §2 CRYPTO (首页 All 改版 · 方案 B · 图表 V1 · C1–C8, 2026-11-09)
// One clock for the three coins in the section head (C2); BTC main block
// bare on 8 columns (C3–C6); ETH / SOL in a right panel (C7); at the end of
// a round the Last-8 strip takes the result and the next round opens at the
// last price (C8 — rounds roll from the data hook).
// Mobile (M-Crypto): clock + tabs → BTC card → ETH / SOL as two half cards;
// "BTC · last 8" sits right under the BTC chart so it reads as BTC's
// (Liya 2026-11-09 15:28).
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  COINS,
  TIMEFRAMES,
  type Coin,
  type QuickEvent,
  type Timeframe,
  upOptionOf,
} from "@/components/lite/intraday/intradayData";
import { CY, DownButton, LM, MU, OR, SectionHead, UpButton, hhmm, ht, mmss, rich, tradeLink } from "./homeAllShell";
import { t as tr, useT } from "@/i18n";

const upWord = () => tr("events.screen.simple.home.home_crypto_card.up");
const downWord = () => tr("events.screen.simple.home.home_crypto_card.down");
import { RoundCanvas } from "./RoundCanvas";
import { roundSeries, type RoundSeries } from "./roundSeries";

const COIN_UI: Record<Coin, { sym: string; bg: string; code: string }> = {
  btc: { sym: "₿", bg: "#F7931A", code: "BTC" },
  eth: { sym: "Ξ", bg: "#627EEA", code: "ETH" },
  sol: { sym: "S", bg: "#9945FF", code: "SOL" },
};
// #11 (CPO 2026-11-10): ≥ $10,000 whole dollars; below that two decimals — thousands separators always ($74,643 / $3,464.52 / $51.38).
const money = (v: number) =>
  "$" +
  (v >= 10000
    ? v.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const kUsd = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}k`);

export interface HomeCryptoSectionProps {
  currentFor: Map<string, QuickEvent>;
  historyFor: Map<string, ("up" | "down")[]>;
  /** C3 "Traded today" (BTC, all lengths, since 00:00 UTC). Absent (style-guide fixtures) → the BTC rounds on screen. */
  btcTodayVolume?: number;
  tf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  /** Live prints from the Quick Play stream (tape) — anchor the chart head. */
  livePrices?: Record<string, number | undefined>;
  isMobile: boolean;
  /** Frozen clock for style-guide fixtures. */
  nowOverride?: number;
}

const useNow = (nowOverride?: number) => {
  const [t, setT] = useState(() => nowOverride ?? Date.now());
  useEffect(() => {
    if (nowOverride != null) {
      setT(nowOverride);
      return;
    }
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, [nowOverride]);
  return t;
};

const Last8 = ({ history, label, big, labelColor }: { history: ("up" | "down")[]; label: string; big: boolean; labelColor?: string }) => {
  const H = [14, 9, 18, 6, 12, 20, 8, 15];
  const recent = history.slice(-8);
  const upWon = recent.filter((r) => r === "up").length;
  const lastR = recent[recent.length - 1];
  return (
    <div className="row" style={{ marginTop: big ? 22 : 12, gap: big ? 14 : 10, rowGap: 6, flexWrap: big ? "nowrap" : "wrap" }}>
      <span className="lbl" style={{ fontSize: big ? 10 : 9.5, color: labelColor, whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span className="l8" style={{ gap: big ? 5 : 4, height: big ? 22 : 20 }}>
        {recent.map((r, k) => (
          <i
            key={k}
            className={k === recent.length - 1 ? "last" : undefined}
            style={{
              width: big ? 12 : 10,
              height: H[k],
              background: r === "up" ? CY : LM,
              outlineColor: r === "up" ? "rgba(51,214,255,.35)" : "rgba(207,255,74,.35)",
            }}
          />
        ))}
      </span>
      <span className="kv" style={{ fontSize: big ? 12.5 : 10.5, marginLeft: big ? 0 : "auto", whiteSpace: "nowrap" }}>
        {big ? (
          <>
            {rich(ht("crypto.history_long"), {
              up: <b style={{ color: CY }}>{upWon}</b>,
              down: <b style={{ color: LM }}>{recent.length - upWon}</b>,
              last: <b style={{ color: lastR === "up" ? CY : LM }}>{lastR === "up" ? upWord() : downWord()}</b>,
            })}
          </>
        ) : (
          <>
            {rich(ht("crypto.history_short"), {
              up: <b style={{ color: CY }}>{upWon}</b>,
              down: <b style={{ color: LM }}>{recent.length - upWon}</b>,
              last: <b style={{ color: lastR === "up" ? CY : LM }}>{lastR === "up" ? upWord() : downWord()}</b>,
            })}
          </>
        )}
      </span>
    </div>
  );
};

export const HomeCryptoSection = ({ currentFor, historyFor, btcTodayVolume, tf, onSelectTf, livePrices, isMobile, nowOverride }: HomeCryptoSectionProps) => {
  const navigate = useNavigate();
  useT(); // re-render on language change / catalog arrival
  const now = useNow(nowOverride);
  const ev = (c: Coin) => currentFor.get(`${c}-${tf}`) ?? null;
  const btc = ev("btc");

  // Series are rebuilt once per second (the hook's cadence); the canvas eases between them.
  const series = useMemo(() => {
    const out: Partial<Record<Coin, RoundSeries | null>> = {};
    for (const c of COINS) {
      const e = ev(c);
      out[c] = e ? roundSeries(e, now, livePrices?.[COIN_UI[c].code]) : null;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFor, tf, now, livePrices]);

  if (!btc || !series.btc) return null;
  const sBtc = series.btc;
  // #8 (CPO 2026-11-10): between a round's end and the next round arriving the clock reads "Settling…", not 00:00.
  const rem = Math.max(0, sBtc.end - now);
  const prog = Math.min(100, Math.max(0, ((now - sBtc.start) / (sBtc.end - sBtc.start)) * 100));
  // C3: BTC only (was every coin's current rounds — 2026-11-10 cold-read finding).
  const todayVol = btcTodayVolume ?? [...currentFor.values()].filter((e) => e.coin === "btc").reduce((a, e) => a + (e.volume || 0), 0);
  const go = (e: QuickEvent, side: "yes" | "no") => () => navigate(tradeLink(e.id, { side }));

  const numbers = (c: Coin) => {
    const e = ev(c);
    const s = series[c];
    if (!e || !s) return null;
    const up = upOptionOf(e)?.price ?? 0.5;
    const chg = s.last / s.open - 1;
    return { e, s, up, upc: Math.round(up * 100), chg };
  };
  const B = numbers("btc")!;

  const tabs = (
    <div className="row" style={{ gap: isMobile ? 20 : 22, marginBottom: isMobile ? 0 : 2 }}>
      {TIMEFRAMES.map((t) => (
        <button key={t.id} type="button" className={`tab${t.id === tf ? " on" : ""}`} onClick={() => onSelectTf(t.id)}>
          {t.id === "1d" ? "1D" : t.label}
        </button>
      ))}
    </div>
  );

  const eyebrow = `● ${ht(`crypto.eyebrow_${tf}`)}`;
  const question = <>{rich(ht("crypto.question"))}</>;

  // C3 / C8 (CPO 2026-11-10): exactly at the open is a tie and a tie settles Down (backend `cls > base → Up`),
  // so it reads grey "$0 · 0.00% · at the open · Down wins" — never green "+0.00% above the open · Up wins".
  const flat = B.s.last === B.s.open;
  const upNow = !flat && B.chg > 0;
  const chgLine = (big: boolean) => (
    <>
      <span className={`m ${flat ? "" : upNow ? "g" : "r"}`} style={{ fontSize: big ? 18 : 14, fontWeight: 600, color: flat ? "#98A1AD" : undefined }}>
        {flat ? "" : upNow ? "+" : "−"}${Math.abs(B.s.last - B.s.open).toLocaleString("en-US", { maximumFractionDigits: 0 })} · {flat ? "" : upNow ? "+" : "−"}
        {(Math.abs(B.chg) * 100).toFixed(2)}%
      </span>
      <span className="kv" style={{ fontSize: big ? 11.5 : 10.5 }}>
        {/* CPO 2026-11-10: once the bell has rung the round has closed — drop "if it closed now" */}
        {rich(ht(`${flat ? "crypto.at_open" : upNow ? "crypto.above_open" : "crypto.below_open"}${rem > 0 ? "" : "_closed"}`), {
          win: <b style={{ color: upNow ? CY : LM }}>{ht(upNow ? "crypto.up_wins" : "crypto.down_wins")}</b>,
        })}
      </span>
    </>
  );

  const crowd = (big: boolean) => (
    <span style={{ display: "flex", flexDirection: "column", gap: big ? 6 : 5 }}>
      <span className="cbar" style={{ height: big ? 8 : 6 }}>
        <i style={{ width: `${B.upc}%`, background: CY }} />
        <i style={{ flex: 1, background: LM }} />
      </span>
      <span className="row" style={{ justifyContent: "space-between", fontSize: big ? 11 : 10.5, color: MU }}>
        <span>
          {rich(ht("crypto.money_on_up"), { pct: <b style={{ color: CY }}>{B.upc}%</b> })}
        </span>
        <span>
          {rich(ht("crypto.money_on_down"), { pct: <b style={{ color: LM }}>{100 - B.upc}%</b> })}
        </span>
      </span>
    </span>
  );

  /* ------------------------------ mobile ------------------------------ */
  if (isMobile) {
    const alt = (c: Coin) => {
      const n = numbers(c);
      if (!n) return null;
      return (
        <div key={c} className="altcard">
          <div className="row" style={{ gap: 6 }}>
            <span className="ico" style={{ background: COIN_UI[c].bg, width: 22, height: 22, fontSize: 10 }}>
              {COIN_UI[c].sym}
            </span>
            <b style={{ color: "#fff", fontSize: 13 }}>{COIN_UI[c].code}</b>
            <span className="m" style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginLeft: "auto" }}>
              {money(n.s.last)}
            </span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 2 }}>
            <span className={`m ${n.chg > 0 ? "g" : n.chg < 0 ? "r" : ""}`} style={{ fontSize: 10.5, color: n.chg === 0 ? "#98A1AD" : undefined }}>
              {n.chg > 0 ? "+" : n.chg < 0 ? "−" : ""}
              {(Math.abs(n.chg) * 100).toFixed(2)}%
            </span>
            <span className="kv" style={{ fontSize: 10 }}>
              {rem > 0 ? ht("crypto.closes_at", { time: hhmm(n.s.end) }) : ht("crypto.settling")}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <RoundCanvas series={n.s} tf={tf} height={64} nowOverride={nowOverride} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
            <UpButton price={n.up} onClick={go(n.e, "yes")} style={{ padding: "7px 6px", gap: 4, fontSize: 11.5, justifyContent: "center" }} />
            <DownButton price={1 - n.up} onClick={go(n.e, "no")} style={{ padding: "7px 6px", gap: 4, fontSize: 11.5, justifyContent: "center" }} />
          </div>
        </div>
      );
    };
    return (
      <section className="sec">
        <SectionHead eyebrow={eyebrow} eyebrowColor={OR} question={question} isMobile />
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 7 }}>
          <span className="eye" style={{ color: OR, fontSize: 10 }}>
            {rem > 0 ? <>{ht("crypto.closes_in")} </> : null}
            <span className="m" style={{ fontSize: 24, letterSpacing: 0, marginLeft: 6, lineHeight: 1 }}>
              {rem > 0 ? mmss(rem) : ht("crypto.settling")}
            </span>
          </span>
          <span className="cprog">
            <i style={{ width: `${prog.toFixed(0)}%` }} />
          </span>
        </div>
        <div style={{ marginTop: 14 }}>{tabs}</div>

        <div style={{ marginTop: 22 }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="ico" style={{ background: COIN_UI.btc.bg, width: 28, height: 28, fontSize: 12 }}>
              ₿
            </span>
            <span className="d" style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
              BTC
            </span>
            <span className="kv" style={{ fontSize: 11.5 }}>
              {rich(ht("crypto.round"), { range: <b className="m">{hhmm(sBtc.start)} → {hhmm(sBtc.end)}</b> })}
            </span>
            <span className="kv" style={{ marginLeft: "auto", fontSize: 11.5 }}>
              {rich(ht("crypto.today"), { vol: <b>{kUsd(todayVol)}</b> })}
            </span>
          </div>
          <div className="row" style={{ gap: 12, marginTop: 8, alignItems: "baseline" }}>
            <span className="m" style={{ fontSize: 48, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: "-.04em" }}>
              {money(sBtc.last)}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>{chgLine(false)}</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <RoundCanvas series={sBtc} tf={tf} big height={150} nowOverride={nowOverride} />
          </div>
          <Last8 history={historyFor.get(`btc-${tf}`) ?? []} label={ht("crypto.btc_last", { count: Math.min(8, (historyFor.get(`btc-${tf}`) ?? []).length) })} big={false} labelColor="#DBE2EA" />
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <UpButton price={B.up} onClick={go(B.e, "yes")} style={{ padding: "12px 0", fontSize: 15, justifyContent: "center" }} />
            <DownButton price={1 - B.up} onClick={go(B.e, "no")} style={{ padding: "12px 0", fontSize: 15, justifyContent: "center" }} />
          </div>
          <div style={{ marginTop: 10 }}>{crowd(false)}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 32 }}>
          {alt("eth")}
          {alt("sol")}
        </div>
      </section>
    );
  }

  /* ------------------------------ desktop ----------------------------- */
  const right = (
    <div className="row" style={{ gap: 26, alignItems: "flex-end" }}>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
        <span className="eye" style={{ color: OR, fontSize: 11 }}>
          {rem > 0 ? <>{ht("crypto.closes_in")} </> : null}
          <span className="m" style={{ fontSize: 28, letterSpacing: 0, marginLeft: 8, lineHeight: 1 }}>
            {rem > 0 ? mmss(rem) : ht("crypto.settling")}
          </span>
        </span>
        <span className="cprog" style={{ width: 220 }}>
          <i style={{ width: `${prog.toFixed(1)}%` }} />
        </span>
      </span>
      <span style={{ width: 1, height: 34, background: "rgba(148,163,184,.18)", marginBottom: 4 }} />
      {tabs}
    </div>
  );

  const altRow = (c: Coin, k: number) => {
    const n = numbers(c);
    if (!n) return null;
    return (
      <div
        key={c}
        className={k === 0 ? "hr" : undefined}
        style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, padding: k === 0 ? "0 0 22px" : "22px 0 0" }}
      >
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="row" style={{ gap: 8 }}>
            <span className="ico" style={{ background: COIN_UI[c].bg }}>
              {COIN_UI[c].sym}
            </span>
            <b style={{ color: "#fff", fontSize: 15 }}>{COIN_UI[c].code}</b>
            <span className="m" style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>
              {money(n.s.last)}
            </span>
            <span className={`m ${n.chg > 0 ? "g" : n.chg < 0 ? "r" : ""}`} style={{ fontSize: 11, color: n.chg === 0 ? "#98A1AD" : undefined }}>
              {n.chg > 0 ? "+" : n.chg < 0 ? "−" : ""}
              {(Math.abs(n.chg) * 100).toFixed(2)}%
            </span>
          </span>
          <span className="kv" style={{ fontSize: 11 }}>
            {rem > 0 ? ht("crypto.closes_at", { time: hhmm(n.s.end) }) : ht("crypto.settling")}
          </span>
        </div>
        <RoundCanvas series={n.s} tf={tf} height={80} nowOverride={nowOverride} />
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: 10, alignItems: "center" }}>
          <UpButton price={n.up} onClick={go(n.e, "yes")} />
          <span className="cbar" style={{ height: 5 }}>
            <i style={{ width: `${n.upc}%`, background: CY }} />
            <i style={{ flex: 1, background: LM }} />
          </span>
          <DownButton price={1 - n.up} onClick={go(n.e, "no")} />
        </div>
      </div>
    );
  };

  return (
    <section className="sec">
      <SectionHead eyebrow={eyebrow} eyebrowColor={OR} question={question} right={right} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 20, marginTop: 40, alignItems: "stretch" }}>
        <div style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", paddingRight: 28 }}>
          <div className="row" style={{ gap: 14 }}>
            <span className="ico" style={{ background: COIN_UI.btc.bg, width: 34, height: 34, fontSize: 13 }}>
              ₿
            </span>
            <span className="d" style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
              BTC
            </span>
            <span className="kv">
              {rich(ht("crypto.round"), { range: <b className="m">{hhmm(sBtc.start)} → {hhmm(sBtc.end)}</b> })}
            </span>
            <span className="kv" style={{ marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: LM, boxShadow: `0 0 8px ${LM}` }} />
              {rich(ht("crypto.this_round"), { vol: <b className="m">${Math.round(btc.volume).toLocaleString("en-US")}</b> })}
            </span>
            <span className="kv" style={{ marginLeft: "auto" }}>
              {rich(ht("crypto.traded_today"), { vol: <b>{kUsd(todayVol)}</b> })}
            </span>
          </div>
          <div className="row" style={{ gap: 18, marginTop: 10, alignItems: "baseline" }}>
            <span className="m" style={{ fontSize: 84, fontWeight: 700, color: "#fff", lineHeight: 1, letterSpacing: "-.04em" }}>
              {money(sBtc.last)}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>{chgLine(true)}</span>
          </div>
          <div style={{ position: "relative", marginTop: 8 }}>
            <RoundCanvas series={sBtc} tf={tf} big height={206} nowOverride={nowOverride} />
          </div>
          <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: 14, alignItems: "center" }}>
            <UpButton price={B.up} onClick={go(B.e, "yes")} style={{ padding: "12px 26px", fontSize: 15, boxShadow: "0 0 18px rgba(51,214,255,.12)" }} />
            {crowd(true)}
            <DownButton price={1 - B.up} onClick={go(B.e, "no")} style={{ padding: "12px 26px", fontSize: 15, boxShadow: "0 0 18px rgba(207,255,74,.12)" }} />
          </div>
          <Last8 history={historyFor.get(`btc-${tf}`) ?? []} label={ht("crypto.last_rounds", { count: Math.min(8, (historyFor.get(`btc-${tf}`) ?? []).length) })} big />
        </div>
        <div className="panel" style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", paddingTop: 24, paddingBottom: 24 }}>
          {altRow("eth", 0)}
          {altRow("sol", 1)}
        </div>
      </div>
    </section>
  );
};

export default HomeCryptoSection;
