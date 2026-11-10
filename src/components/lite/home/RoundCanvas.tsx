// ============================================================
// RoundCanvas — the §2 Crypto chart (C4), ported from the approved
// prototype (Quick Play stage feel): canvas; window = past 72% of the round
// + future 28%, sliding with time; NOW dashed line + shaded future; the close
// line appears once it enters the window; open dashed line across, the OPEN
// label drawn last on a backing plate; cyan fill above the open, lime below;
// pre-open history grey and not scored; range from this round only; eased
// head with a breathing ring; dense series bucket-averaged at 3px.
// ============================================================
import { useEffect, useRef } from "react";
import type { Timeframe } from "@/components/lite/intraday/intradayData";
import { TICK_MS, type RoundSeries } from "./roundSeries";
import { CY, LM, OR, ht, uiLocale } from "./homeAllShell";

// #11 (CPO 2026-11-10): same rule as the price text — ≥ $10,000 whole dollars, below that two decimals.
const money = (v: number) => "$" + (v >= 10000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const hhmm = (ms: number) => new Date(ms).toLocaleTimeString(uiLocale(), { hour: "2-digit", minute: "2-digit", hour12: false });

export interface RoundCanvasProps {
  series: RoundSeries;
  tf: Timeframe;
  big?: boolean;
  height: number;
  /** Frozen clock (style-guide); production animates on its own RAF. */
  nowOverride?: number;
  className?: string;
}

const draw = (cv: HTMLCanvasElement, s: RoundSeries, tf: Timeframe, big: boolean, now: number, disp: number, phase: number) => {
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth;
  const H = cv.clientHeight;
  if (!W || !H) return;
  if (cv.width !== W * dpr || cv.height !== H * dpr) {
    cv.width = W * dpr;
    cv.height = H * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const dur = s.end - s.start;
  const t0 = now - dur * 0.72;
  const t1 = now + dur * 0.28;
  const TOP = big ? 22 : 16;
  const BOT = big ? 18 : 4;
  const X = (tt: number) => ((tt - t0) / (t1 - t0)) * W;
  let vis = s.points.filter((p) => p[0] >= t0 - 1000);
  if (!vis.length) vis = [s.points[s.points.length - 1]];
  const maxPts = Math.max(40, Math.floor(W / 3));
  if (vis.length > maxPts) {
    const k = Math.ceil(vis.length / maxPts);
    const out: [number, number][] = [];
    for (let i = 0; i < vis.length; i += k) {
      const b = vis.slice(i, i + k);
      out.push([b[b.length - 1][0], b.reduce((a, p) => a + p[1], 0) / b.length]);
    }
    out[out.length - 1] = vis[vis.length - 1];
    vis = out;
  }
  const vals = vis.filter((p) => p[0] >= s.start).map((p) => p[1]).concat([s.open, disp]);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  // C4 (CPO 2026-11-10): right after the open this round has almost no path, so a range "from this
  // round only" squeezes the grey pre-open line into full-height streaks. For the first 15% of the
  // round the grey line's range is blended in, fading to "this round only" by 15%.
  const histVals = vis.filter((p) => p[0] < s.start).map((p) => p[1]);
  const early = Math.max(0, Math.min(1, 1 - (now - s.start) / (dur * 0.15)));
  if (early > 0 && histVals.length) {
    lo = Math.min(lo, lo - (lo - Math.min(...histVals)) * early);
    hi = Math.max(hi, hi + (Math.max(...histVals) - hi) * early);
  }
  const pad = Math.max((hi - lo) * 0.22, s.open * 0.0004);
  lo -= pad;
  hi += pad;
  const Y = (v: number) => TOP + ((hi - v) / (hi - lo)) * (H - TOP - BOT);
  const xn = X(now);
  const yo = Y(s.open);
  const yh = Y(disp);

  // future + NOW
  ctx.fillStyle = "rgba(148,163,184,.035)";
  ctx.fillRect(xn, 0, W - xn, H - BOT);
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(148,163,184,.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xn + 0.5, TOP - 6);
  ctx.lineTo(xn + 0.5, H - BOT);
  ctx.stroke();
  ctx.setLineDash([]);
  if (big) {
    ctx.font = "500 10px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#6B7280";
    ctx.textBaseline = "alphabetic";
    const tick = TICK_MS[tf];
    for (let w = Math.ceil(t0 / tick) * tick; w < t1; w += tick) {
      const x = X(w);
      if (x < 6 || x > W - 30) continue;
      ctx.strokeStyle = "rgba(148,163,184,.08)";
      ctx.beginPath();
      ctx.moveTo(x + 0.5, TOP);
      ctx.lineTo(x + 0.5, H - BOT);
      ctx.stroke();
      if (Math.abs(x - xn) > 26) ctx.fillText(hhmm(w), x - 14, H - 4);
    }
    ctx.fillStyle = "#DBE2EA";
    ctx.font = "700 10px 'Space Grotesk', sans-serif";
    const nowTxt = ht("crypto.chart_now");
    ctx.fillText(nowTxt, xn - ctx.measureText(nowTxt).width / 2, H - 4);
  }
  // close line once in the window
  const xe = X(s.end);
  if (xe < W) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,138,61,.55)";
    ctx.beginPath();
    ctx.moveTo(xe + 0.5, TOP - 6);
    ctx.lineTo(xe + 0.5, H - BOT);
    ctx.stroke();
    ctx.setLineDash([]);
    if (big) {
      ctx.fillStyle = OR;
      ctx.font = "700 10px 'Space Grotesk', sans-serif";
      const cl = ht("crypto.closes_at", { time: hhmm(s.end) });
      ctx.fillText(cl, Math.min(xe + 6, W - ctx.measureText(cl).width - 4), TOP - 10);
    }
  }
  // open line
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "rgba(255,138,61,.8)";
  ctx.lineWidth = big ? 1.5 : 1;
  ctx.beginPath();
  ctx.moveTo(0, yo + 0.5);
  ctx.lineTo(W, yo + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
  // pre-open grey
  const pre = vis.filter((p) => p[0] <= s.start);
  const post = vis.filter((p) => p[0] >= s.start);
  if (pre.length > 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, TOP - 8, W, H - BOT - TOP + 8);
    ctx.clip();
    ctx.beginPath();
    // a grey point outside the range breaks the line instead of drawing a streak across the plot
    const inBand = (v: number) => v >= lo && v <= hi;
    let pen = false;
    pre.forEach((p) => {
      if (!inBand(p[1])) {
        pen = false;
        return;
      }
      const x = X(p[0]);
      const y = Y(p[1]);
      if (!pen) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      pen = true;
    });
    if (pen && post.length) ctx.lineTo(X(post[0][0]), Y(post[0][1]));
    ctx.lineWidth = big ? 1.6 : 1.2;
    ctx.strokeStyle = "rgba(148,163,184,.45)";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
  }
  if (!post.length) post.push([s.start, s.open]);
  const path = () => {
    ctx.beginPath();
    post.forEach((p, i) => {
      const x = X(p[0]);
      const y = Y(p[1]);
      if (!i) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xn, yh);
  };
  const x0 = X(post[0][0]);
  ctx.fillStyle = OR;
  ctx.beginPath();
  ctx.arc(x0, yo, big ? 3 : 2, 0, 7);
  ctx.fill();
  const fillSide = (above: boolean) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, above ? 0 : yo, W, above ? yo : H - yo);
    ctx.clip();
    path();
    ctx.lineTo(xn, yo);
    ctx.lineTo(x0, yo);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, above ? TOP : yo, 0, above ? yo : H - BOT);
    if (above) {
      g.addColorStop(0, "rgba(51,214,255,.32)");
      g.addColorStop(1, "rgba(51,214,255,.03)");
    } else {
      g.addColorStop(0, "rgba(207,255,74,.03)");
      g.addColorStop(1, "rgba(207,255,74,.34)");
    }
    ctx.fillStyle = g;
    ctx.fill();
    path();
    ctx.lineWidth = big ? 2.6 : 1.8;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = above ? CY : LM;
    ctx.shadowColor = above ? "rgba(51,214,255,.6)" : "rgba(207,255,74,.6)";
    ctx.shadowBlur = big ? 10 : 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  };
  fillSide(true);
  fillSide(false);
  // head + breathing ring
  const col = disp >= s.open ? CY : LM;
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.35 * (1 - phase);
  ctx.beginPath();
  ctx.arc(xn, yh, (big ? 6 : 4) + phase * (big ? 14 : 8), 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(xn, yh, big ? 5 : 3.5, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "#0B0D11";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // OPEN label last, on a plate
  ctx.font = `500 ${big ? 10.5 : 9.5}px 'Space Grotesk', sans-serif`;
  const olab = ht("crypto.chart_open", { price: money(s.open) });
  const ow = ctx.measureText(olab).width;
  ctx.fillStyle = "rgba(11,13,17,.85)";
  ctx.fillRect(0, yo - (big ? 16 : 14), ow + 8, big ? 14 : 12);
  ctx.fillStyle = OR;
  ctx.fillText(olab, 3, yo - 5);
};

export const RoundCanvas = ({ series, tf, big = false, height, nowOverride, className }: RoundCanvasProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const dispRef = useRef<number>(series.last);
  const seriesRef = useRef(series);
  seriesRef.current = series;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (nowOverride != null) {
      draw(cv, seriesRef.current, tf, big, nowOverride, seriesRef.current.last, 0.3);
      return;
    }
    let raf = 0;
    let last = 0;
    const frame = (ts: number) => {
      const dt = Math.min(100, ts - (last || ts));
      last = ts;
      const s = seriesRef.current;
      // Ease toward the latest print; a jump (new stream round, tab switch) snaps instead of drawing a vertical tail.
      if (Math.abs(s.last - dispRef.current) > s.open * 0.002) dispRef.current = s.last;
      else dispRef.current += (s.last - dispRef.current) * Math.min(1, dt / 420);
      draw(cv, s, tf, big, Date.now(), dispRef.current, (performance.now() % 1600) / 1600);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [tf, big, nowOverride, series]);

  return <canvas ref={ref} className={className} style={{ display: "block", width: "100%", height }} />;
};

export default RoundCanvas;
