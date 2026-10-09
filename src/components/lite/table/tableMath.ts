// ============================================================
// TABLE — shared constants & pure helpers (no React).
// Colours follow DESIGN.md §2 Market Axis: Up = Pulse Blue, Down = Volt,
// Intraday orange only for the countdown. Money axis (gain/loss) separate.
// ============================================================
export const UP = "#33D6FF";
export const DOWN = "#CFFF4A";
export const HOT = "#FF8A3D";
export const LOSS = "#FF5C5C";
export const BG = "#0A0A10";
export const LINE = "#1C1F26";
export const DIM = "#6B7280";
export const MFG = "#9CA3AC";

export type TableSide = "up" | "down";
export const sideColor = (s: TableSide) => (s === "up" ? UP : DOWN);
export const sideLabel = (s: TableSide) => (s === "up" ? "Up" : "Down");

export const CHIP_VALUES = [10, 25, 50, 100, 500] as const;
export type ChipValue = (typeof CHIP_VALUES)[number];
export const BOOSTS = [1, 2, 5, 10] as const;
export type Boost = (typeof BOOSTS)[number];
export const DEFAULT_CHIP: ChipValue = 50;
export const DEFAULT_BOOST: Boost = 2;

/** Chip face colours (matte; the edge rings are drawn in CSS). */
export const CHIP_STYLE: Record<ChipValue, { bg: string; fg: string }> = {
  10: { bg: "#D9DDE3", fg: "#0A0B0D" },
  25: { bg: UP, fg: "#04222C" },
  50: { bg: DOWN, fg: "#1A2408" },
  100: { bg: "#FFFFFF", fg: "#0A0B0D" },
  500: { bg: HOT, fg: "#1A0B00" },
};

/** A chip placed on a side, waiting out the 1.5 s cancel window. */
export const PENDING_MS = 1500;

// ---------------- ladder range ----------------
// Half-range steps the ladder may snap to ("nice" numbers). The same table
// serves $ (≥ $1 assets) and % (sub-$1 assets).
const NICE = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 4, 5, 10, 20, 40, 50, 100, 200, 400, 500, 1000, 2000, 4000, 5000];
export const niceStep = (x: number) => NICE.find((n) => n >= x) ?? Math.ceil(x / 5000) * 5000;

/** Opening half-range for a round: 0.06 % of the open ($) or 0.06 (%). */
export const initialLadderRange = (open: number, pct: boolean) => niceStep(pct ? 0.06 : open * 0.0006);

/** Grow-only within a round: past 80 % of the range, jump to the next step. */
export const nextLadderRange = (range: number, deviation: number) =>
  Math.abs(deviation) > range * 0.8 ? niceStep(Math.abs(deviation) * 1.25) : range;

export const formatDeviation = (d: number, pct: boolean) =>
  pct ? `${Math.abs(d).toFixed(2)}%` : `$${Math.abs(d).toFixed(2)}`;

export const formatTick = (v: number, pct: boolean) => {
  const sign = v > 0 ? "+" : "−";
  const a = Math.abs(v);
  if (pct) return `${sign}${Number(a.toFixed(2))}%`;
  return `${sign}$${a < 1 ? a.toFixed(2).replace(/0$/, "") : a}`;
};

// ---------------- roads ----------------
/** Big road columns: same result stacks down (max 6), a change starts a new column. */
export const bigRoadColumns = (history: TableSide[], maxRows = 6) => {
  const cols: { side: TableSide; idx: number[] }[] = [];
  let cur: { side: TableSide; idx: number[] } | null = null;
  history.forEach((s, i) => {
    if (!cur || cur.side !== s || cur.idx.length >= maxRows) {
      cur = { side: s, idx: [] };
      cols.push(cur);
    }
    cur.idx.push(i);
  });
  return cols;
};

export const currentStreak = (history: TableSide[]) => {
  if (!history.length) return { side: null as TableSide | null, n: 0 };
  const last = history[history.length - 1];
  let n = 0;
  for (let i = history.length - 1; i >= 0 && history[i] === last; i--) n++;
  return { side: last, n };
};

export const longestStreak = (history: TableSide[]) => {
  let best = 0;
  let side: TableSide | null = null;
  let run = 0;
  history.forEach((s, i) => {
    run = i > 0 && history[i - 1] === s ? run + 1 : 1;
    if (run > best) {
      best = run;
      side = s;
    }
  });
  return { side, n: best };
};

export const chunk = <T,>(arr: T[], n: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

export const money = (n: number) => `${n < 0 ? "−" : "+"}$${Math.abs(n).toFixed(2)}`;
export const utcHHMM = (ms: number) => new Date(ms).toISOString().slice(11, 16);
