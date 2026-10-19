// ============================================================
// Quick Play entry banner — Events "All" view, above the stage.
// CPO 2026-10-19: desktop = V1-B steel panel, mobile = V1-A CRT strip
// (entry 比稿 v4). It is a live readout of the BTC 30s table: the same
// deterministic path the cabinet draws, so the banner's price, countdown
// and Up/Down cents are what the player sees after the click.
// Numbers are never placeholders — with no open round the banner shows the
// next-session line instead of a fake price. No player counts (no source).
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ARCADE_STEP_MS, arcadePath, arcadePriceAt, type ArcadeRoundRow } from "@/lib/arcade/arcadePath";
import { ARCADE_ASSETS, fetchArcadeTable, tfSeconds } from "@/lib/arcade/arcadeTables";
import { ensureArcadeFonts } from "@/lib/arcade/arcadeFonts";
import { arcadeNextOf } from "@/lib/arcade/arcadePath";

/** V1-B+ ring of marquee lights (CPO 2026-10-19: on). */
export const ARCADE_BANNER_LIGHTS = true; // CPO 2026-10-19: 横幅带灯

const SYMBOL = "BTC";
const TF = "30s" as const;
const PIX = '"Jersey 10","VT323",ui-monospace,monospace';
const LCD = '"CPs","Chakra Petch",system-ui,sans-serif';
const UI = '"Chakra Petch","Arial Narrow",system-ui,sans-serif';
const PX_CLIP =
  "polygon(0 6px,3px 6px,3px 3px,6px 3px,6px 0,calc(100% - 6px) 0,calc(100% - 6px) 3px,calc(100% - 3px) 3px,calc(100% - 3px) 6px,100% 6px,100% calc(100% - 6px),calc(100% - 3px) calc(100% - 6px),calc(100% - 3px) calc(100% - 3px),calc(100% - 6px) calc(100% - 3px),calc(100% - 6px) 100%,6px 100%,6px calc(100% - 3px),3px calc(100% - 3px),3px calc(100% - 6px),0 calc(100% - 6px))";

const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = (n: number) => String(n).padStart(2, "0");

interface Tick {
  round: ArcadeRoundRow | null;
  price: number;
  open: number;
  secLeft: number;
  up: number;
  pts: number[];
}

/** Live readout of one table — polls the round every 15 s, ticks the path at 4 Hz. */
export const useArcadeTicker = (symbol = SYMBOL, tf: "30s" | "1m" = TF, enabled = true): Tick => {
  const [tick, setTick] = useState<Tick>({ round: null, price: 0, open: 0, secLeft: 0, up: 50, pts: [] });
  const roundRef = useRef<ArcadeRoundRow | null>(null);
  const nextRef = useRef<ArcadeRoundRow | null>(null);
  const pathRef = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const adopt = (r: ArcadeRoundRow) => {
      roundRef.current = r;
      pathRef.current = arcadePath(r.seed, r.open_price, r.steps, r.sigma);
    };
    const load = async () => {
      try {
        const s = await fetchArcadeTable(symbol, tf, 1);
        if (!alive) return;
        if (s.current && (!roundRef.current || roundRef.current.id !== s.current.id)) adopt(s.current);
        nextRef.current = s.next;
      } catch (e) {
        /* keep ticking on the stream */
      }
    };
    void load();
    const poll = setInterval(load, 15000);
    const k = ARCADE_ASSETS[symbol]?.k ?? 1;
    const step = setInterval(() => {
      const r = roundRef.current;
      if (!r) return;
      const now = Date.now();
      const start = new Date(r.start_at).getTime();
      const dur = tfSeconds(r.tf);
      if (now >= start + dur * 1000) {
        const n = nextRef.current && nextRef.current.start_at === r.end_at ? nextRef.current : arcadeNextOf(r);
        nextRef.current = null;
        adopt(n);
        return;
      }
      const path = pathRef.current;
      const price = arcadePriceAt(path, start, now);
      const rem = Math.max(0, (start + dur * 1000 - now) / 1000) / dur;
      const z = (price - r.open_price) / ((60 + 520 * rem) * k);
      const up = Math.min(99, Math.max(1, Math.round(50 + 49 * Math.tanh(z))));
      const i = Math.max(0, Math.min(r.steps, Math.floor((now - start) / ARCADE_STEP_MS)));
      setTick({ round: r, price, open: r.open_price, secLeft: Math.ceil(Math.max(0, start + dur * 1000 - now) / 1000), up, pts: path.slice(0, i + 1) });
    }, 250);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(step);
    };
  }, [symbol, tf, enabled]);
  return tick;
};

/** style-guide fixture: a frozen readout (no network, no clock) */
export type ArcadeBannerFixture = Tick;

const Spark = ({ pts, open, dim }: { pts: number[]; open: number; dim?: boolean }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    if (!r.width) return;
    const d = devicePixelRatio || 1;
    if (c.width !== r.width * d) {
      c.width = r.width * d;
      c.height = r.height * d;
    }
    const x = c.getContext("2d");
    if (!x) return;
    x.setTransform(d, 0, 0, d, 0, 0);
    const W = r.width,
      H = r.height;
    x.clearRect(0, 0, W, H);
    if (pts.length < 2) return;
    const padY = dim ? H * 0.18 : 0;
    const lo = Math.min(...pts, open) - 4,
      hi = Math.max(...pts, open) + 4;
    const X = (i: number) => (i / Math.max(1, pts.length - 1)) * W;
    const Y = (v: number) => H - padY - ((v - lo) / (hi - lo)) * (H - padY * 2);
    x.globalAlpha = dim ? 0.55 : 1;
    x.strokeStyle = "rgba(51,214,255,.35)";
    x.setLineDash([4, 4]);
    x.beginPath();
    x.moveTo(0, Y(open));
    x.lineTo(W, Y(open));
    x.stroke();
    x.setLineDash([]);
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(51,214,255,.35)");
    g.addColorStop(1, "rgba(51,214,255,0)");
    x.beginPath();
    pts.forEach((v, i) => (i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v))));
    x.strokeStyle = "#fff";
    x.lineWidth = 2.5;
    x.shadowColor = "rgba(51,214,255,.8)";
    x.shadowBlur = 8;
    x.stroke();
    x.shadowBlur = 0;
    x.lineTo(X(pts.length - 1), H);
    x.lineTo(0, H);
    x.closePath();
    x.fillStyle = g;
    x.fill();
    const lx = X(pts.length - 1),
      ly = Y(pts[pts.length - 1]);
    x.fillStyle = "#fff";
    x.beginPath();
    x.arc(lx, ly, 5, 0, 7);
    x.fill();
    x.fillStyle = "rgba(51,214,255,.5)";
    x.beginPath();
    x.arc(lx, ly, 10, 0, 7);
    x.fill();
    x.globalAlpha = 1;
  }, [pts, open, dim]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true" />;
};

const Lcd = ({ sec, size = 28 }: { sec: number; size?: number }) => (
  <span
    style={{
      display: "inline-grid",
      placeItems: "center",
      height: size + 6,
      minWidth: size * 3,
      font: `400 ${size}px/1 ${PIX}`,
      letterSpacing: 1,
      fontVariantNumeric: "tabular-nums",
      background: "#020b10",
      color: sec <= 5 && sec > 0 ? "#ff7a7a" : "#05d7ed",
      border: "2px solid #07090f",
      boxShadow: sec <= 5 && sec > 0 ? "inset 0 0 0 2px #3a1515,0 0 14px rgba(255,92,92,.4)" : "inset 0 0 0 2px #1b2a33,0 0 14px rgba(5,215,237,.25)",
      textShadow: "0 0 8px rgba(5,215,237,.7)",
    }}
  >
    {pad(Math.floor(sec / 60))}:{pad(sec % 60)}
  </span>
);

const Odd = ({ side, cents, big }: { side: "up" | "down"; cents: number; big?: boolean }) => (
  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", font: `400 12px/1 ${LCD}`, letterSpacing: 1.5, color: side === "up" ? "#33d6ff" : "#cfff4a" }}>
    <b style={{ font: `400 ${big ? 30 : 22}px/.8 ${PIX}`, marginBottom: 5 }}>{cents}¢</b>
    {side === "up" ? "UP" : "DOWN"}
  </span>
);

const PlayKey = ({ label = "Play ▸", wide }: { label?: string; wide?: boolean }) => (
  <span
    style={{
      display: "inline-block",
      background: "linear-gradient(180deg,#e6ff8a,#a6d61c)",
      color: "#020c10",
      border: "2px solid #07090f",
      clipPath: PX_CLIP,
      boxShadow: "inset 3px 3px 0 #efff9e,inset -3px -3px 0 #6f9a0a",
      font: `600 ${wide ? 15 : 13}px/1 ${UI}`,
      letterSpacing: ".06em",
      padding: wide ? "16px 10px" : "12px 14px",
      textTransform: "uppercase",
      textAlign: "center",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

const Lights = ({ hostRef }: { hostRef: React.RefObject<HTMLElement> }) => {
  const [bulbs, setBulbs] = useState<{ x: number; y: number }[]>([]);
  const [t, setT] = useState(0);
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const W = el.clientWidth,
      H = el.clientHeight,
      inset = 7,
      gap = 20,
      w = W - inset * 2,
      h = H - inset * 2,
      nx = Math.max(2, Math.round(w / gap)),
      ny = Math.max(1, Math.round(h / gap));
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < nx; i++) pts.push({ x: inset + (i / nx) * w, y: inset });
    for (let i = 0; i < ny; i++) pts.push({ x: W - inset, y: inset + (i / ny) * h });
    for (let i = 0; i < nx; i++) pts.push({ x: W - inset - (i / nx) * w, y: H - inset });
    for (let i = 0; i < ny; i++) pts.push({ x: inset, y: H - inset - (i / ny) * h });
    setBulbs(pts);
    const iv = setInterval(() => setT((v) => v + 1), 220);
    return () => clearInterval(iv);
  }, [hostRef]);
  return (
    <span style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
      {bulbs.map((b, i) => {
        const k = (i + t) % 4;
        const on = k === 0 || k === 2;
        const col = k === 2 ? "#05d7ed" : "#cfff4a";
        return <i key={i} style={{ position: "absolute", left: b.x - 2.5, top: b.y - 2.5, width: 5, height: 5, borderRadius: "50%", background: on ? col : "#2a3140", boxShadow: on ? `0 0 8px ${col}` : "none" }} />;
      })}
    </span>
  );
};

export const ArcadeEntryBanner = ({ isMobile, fixture }: { isMobile: boolean; fixture?: ArcadeBannerFixture }) => {
  const liveTick = useArcadeTicker(SYMBOL, TF, !fixture);
  const t = fixture ?? liveTick;
  const host = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ensureArcadeFonts();
  }, []);
  const chg = t.price - t.open;
  const chgTxt = `${chg >= 0 ? "▲ +" : "▼ −"}${money(Math.abs(chg))}`;
  const live = !!t.round;
  const to = `/arcade?table=${SYMBOL}&tf=${TF}`;

  if (isMobile) {
    // V1-A · CRT strip folded into three rows
    return (
      <Link
        to={to}
        aria-label="Quick Play · 30s and 1m Up/Down"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          padding: "10px 12px 12px",
          marginBottom: 12,
          background: "radial-gradient(130% 120% at 50% 40%,#06202a 0%,#04131b 55%,#020b10 100%)",
          border: "3px solid #1b2a33",
          boxShadow: "inset 0 0 0 2px #1b2a33,inset 0 0 28px rgba(5,215,237,.12)",
          clipPath: PX_CLIP,
          overflow: "hidden",
          color: "#f0f5ff",
          textDecoration: "none",
        }}
      >
        <Spark pts={t.pts} open={t.open} dim />
        <span style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ font: `400 28px/.9 ${PIX}`, color: "#05d7ed", textShadow: "0 0 14px rgba(5,215,237,.6)" }}>QUICK PLAY</span>
          {live ? <Lcd sec={t.secLeft} size={24} /> : <span style={{ font: `400 13px/1 ${LCD}`, color: "#7f8a99", letterSpacing: 1 }}>OPENING…</span>}
        </span>
        <span style={{ position: "relative", font: `600 13.5px/1.25 ${UI}` }}>
          Will <b style={{ color: "#cfff4a" }}>BTC</b> close above <b style={{ color: "#cfff4a" }}>{live ? money(t.open) : "the open"}</b>?
        </span>
        <span style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center" }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 3, font: `400 24px/.9 ${PIX}`, textShadow: "0 0 12px rgba(51,214,255,.6)" }}>
            {live ? money(t.price) : "—"}
            <small style={{ font: `400 13px/1 ${LCD}`, letterSpacing: 1, color: chg >= 0 ? "#33d6ff" : "#cfff4a" }}>{live ? chgTxt : "30S · 1M · CRYPTO 24/7"}</small>
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 4, font: `400 13px/1 ${LCD}`, letterSpacing: 1 }}>
            <span style={{ color: "#33d6ff" }}>
              UP <b style={{ font: `400 18px/.8 ${PIX}`, marginLeft: 4 }}>{t.up}¢</b>
            </span>
            <span style={{ color: "#cfff4a" }}>
              DOWN <b style={{ font: `400 18px/.8 ${PIX}`, marginLeft: 4 }}>{100 - t.up}¢</b>
            </span>
          </span>
          <PlayKey />
        </span>
      </Link>
    );
  }

  // V1-B · steel panel
  return (
    <Link
      ref={host}
      to={to}
      aria-label="Quick Play · 30s and 1m Up/Down"
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "170px 1fr auto 150px",
        gap: 14,
        alignItems: "center",
        padding: ARCADE_BANNER_LIGHTS ? "18px 22px" : "12px 16px",
        marginBottom: 16,
        minHeight: 104,
        background: "linear-gradient(180deg,#3a4052,#2b3040)",
        border: "3px solid #07090f",
        clipPath: PX_CLIP,
        color: "#f0f5ff",
        textDecoration: "none",
      }}
    >
      {ARCADE_BANNER_LIGHTS && <Lights hostRef={host} />}
      <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ font: `400 34px/.9 ${PIX}`, color: "#e9eefb" }}>QUICK PLAY</span>
        <span style={{ font: `400 13px/1 ${LCD}`, letterSpacing: 1.5, color: "#9aa4b9" }}>30S · 1M · CRYPTO 24/7</span>
      </span>
      <span
        style={{
          position: "relative",
          height: 72,
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          background: "radial-gradient(130% 120% at 50% 40%,#06202a 0%,#04131b 55%,#020b10 100%)",
          border: "3px solid #07090f",
          boxShadow: "inset 0 0 0 2px #1b2a33,inset 0 0 28px rgba(5,215,237,.12)",
          clipPath: PX_CLIP,
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <Spark pts={t.pts} open={t.open} dim />
        <span style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5, font: `400 30px/.9 ${PIX}`, textShadow: "0 0 12px rgba(51,214,255,.6)" }}>
          {live ? money(t.price) : "OPENING…"}
          <small style={{ font: `400 15px/1 ${LCD}`, letterSpacing: 1, color: "#9ca3ac" }}>
            BTC · OPEN {live ? money(t.open) : "—"} · <span style={{ color: chg >= 0 ? "#33d6ff" : "#cfff4a" }}>{live ? chgTxt : ""}</span>
          </small>
        </span>
      </span>
      <span
        style={{
          height: 72,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "radial-gradient(130% 120% at 50% 40%,#06202a 0%,#04131b 55%,#020b10 100%)",
          border: "3px solid #07090f",
          boxShadow: "inset 0 0 0 2px #1b2a33,inset 0 0 28px rgba(5,215,237,.12)",
          clipPath: PX_CLIP,
        }}
      >
        <Odd side="up" cents={t.up} big />
        {live ? <Lcd sec={t.secLeft} /> : <span style={{ font: `400 13px/1 ${LCD}`, color: "#7f8a99" }}>—</span>}
        <Odd side="down" cents={100 - t.up} big />
      </span>
      <PlayKey wide />
    </Link>
  );
};

export default ArcadeEntryBanner;
