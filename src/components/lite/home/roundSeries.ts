// ============================================================
// Deterministic price path for a crypto Up/Down round (home §2 chart, C4).
//
// The Lovable blueprint has no tick feed for the 5m–1D rounds, so the chart
// draws a seeded random walk: same event id → same path on every client,
// and the whole history is available at once (no warm-up). When a live
// print is known (the Quick Play stream feeds the tape), the path's head is
// pulled onto it with a linear blend so the number on screen matches the
// tape without the curve jumping. 真平台 swaps this for the underlying
// trend points (`underlyingTrendPoints`, 5s) — the drawing code is shared.
// ============================================================
import { TF_SECONDS, type QuickEvent, type Timeframe } from "@/components/lite/intraday/intradayData";

export type SeriesPoint = [number, number];

/** Per-second relative step size, per round length (mock SIG). */
const SIG: Record<Timeframe, number> = { "5m": 0.00009, "15m": 0.00009, "1h": 0.00008, "4h": 0.00007, "1d": 0.00006 };
/** Sampling step (ms) — dense enough for the 3px bucket average, cheap for 1D. */
export const STEP_MS: Record<Timeframe, number> = { "5m": 1000, "15m": 1000, "1h": 5000, "4h": 20000, "1d": 60000 };
/** Time-axis ticks (ms) — C4. */
export const TICK_MS: Record<Timeframe, number> = { "5m": 60e3, "15m": 180e3, "1h": 600e3, "4h": 3600e3, "1d": 3 * 3600e3 };

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (rnd: () => number) => {
  const u = Math.max(1e-9, rnd());
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * Walk from `open` at `startMs` forward to `untilMs` (inclusive, clamped to
 * `endMs`). Inertia: drift = .85·drift + .6·σ·g, step = drift + .4·σ·g.
 */
const walk = (seed: number, open: number, startMs: number, untilMs: number, stepMs: number, sig: number): SeriesPoint[] => {
  const rnd = mulberry32(seed);
  const out: SeriesPoint[] = [[startMs, open]];
  let v = open;
  let drift = 0;
  for (let t = startMs + stepMs; t <= untilMs; t += stepMs) {
    drift = drift * 0.85 + gauss(rnd) * sig * 0.6;
    v = v * (1 + drift + gauss(rnd) * sig * 0.4);
    out.push([t, v]);
  }
  return out;
};

export interface RoundSeries {
  open: number;
  start: number;
  end: number;
  /** Points from ~0.8·round before the open up to `now` (pre-open part included). */
  points: SeriesPoint[];
  /** Last value on the path (= the figure shown as the price). */
  last: number;
}

/**
 * Build the series for `event` at `now`. `live` (optional) anchors the head.
 * The pre-open tail is the previous round's walk ending exactly at `open`.
 */
export const roundSeries = (event: QuickEvent, now: number, live?: number | null): RoundSeries | null => {
  const open = event.base_price;
  if (open == null || !event.start_date || !event.end_date) return null;
  const start = new Date(event.start_date).getTime();
  const end = new Date(event.end_date).getTime();
  const tf = event.tf;
  const dur = TF_SECONDS[tf] * 1000;
  const step = STEP_MS[tf];
  const sig = SIG[tf] * Math.sqrt(step / 1000);
  const seed = hash(event.id);
  const until = Math.min(now, end);

  // Pre-open: a walk generated backwards from the open (reverse of a forward walk).
  const preLen = Math.floor(dur * 0.8);
  const back = walk(seed ^ 0x9e3779b9, open, 0, preLen, step, sig);
  const pre: SeriesPoint[] = back
    .map(([t, v]): SeriesPoint => [start - t, v])
    .reverse()
    .filter(([t]) => t < start);

  const main = walk(seed, open, start, until, step, sig);
  // Anchor the head onto the live print with a linear blend (no jump).
  if (live != null && main.length > 1) {
    const diff = live - main[main.length - 1][1];
    const n = main.length - 1;
    for (let i = 1; i <= n; i += 1) main[i] = [main[i][0], main[i][1] + (diff * i) / n];
  }
  const points = pre.concat(main);
  return { open, start, end, points, last: points[points.length - 1][1] };
};
