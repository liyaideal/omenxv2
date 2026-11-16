// ============================================================
// Live price for crypto Up/Down rounds — DEMO-STATE.
//
// CPO 2026-11-16: the round chart draws the LIVE price (what users expect a
// price chart to be) and shows the settlement price — the 60-second average
// that decides Up or Down — as a horizontal line with a tag.
//
// Lovable has no live feed, so this hook draws one: a walk that leads the
// settlement price the way a spot price leads its own trailing average.
// Production: live = the real-time feed; settlement = Chainlink's 60-second
// average of the same asset. Nothing here is a spec for the numbers.
// ============================================================
import { useRef } from "react";

export interface LivePoint {
  /** epoch ms */
  t: number;
  v: number;
}

interface Store {
  key: string;
  points: LivePoint[];
}

const MAX_POINTS = 360;

/**
 * The demo live price at second `tSec`: the round's open, skewed by the Up
 * odds (so the price sits on the side the market favours), plus a fast and a
 * slow wave and a little jitter. Deterministic for a given round.
 */
export const demoLiveAt = (base: number, upOdds: number, seed: number, tSec: number): number => {
  const skew = (upOdds - 0.5) * 0.012;
  const fast = Math.sin(tSec / 4 + (seed % 7)) * 0.0007 + Math.sin(tSec / 9.3 + (seed % 5)) * 0.0006;
  const slow = Math.sin(tSec / 23 + (seed % 11)) * 0.0009;
  const x = Math.sin(seed * 41.13 + tSec * 7.79) * 10000;
  const jitter = (x - Math.floor(x) - 0.5) * 0.00022;
  return base * (1 + skew + fast + slow + jitter);
};

/** The settlement price at `tSec`: the average of the live price over the last 60 seconds. */
export const demoSettlementAt = (base: number, upOdds: number, seed: number, tSec: number): number => {
  let sum = 0;
  for (let k = 0; k < 60; k += 1) sum += demoLiveAt(base, upOdds, seed, tSec - k);
  return sum / 60;
};

/**
 * Live series from round start to now (one point every `step`) plus the
 * settlement price right now. History is frozen once drawn; the caller
 * re-renders every second and the series grows.
 */
export const useRoundLivePrice = ({
  key,
  seed,
  startMs,
  endMs,
  base,
  upOdds,
  now = Date.now(),
}: {
  key: string;
  seed: number;
  startMs: number | null;
  endMs: number | null;
  base: number | null;
  upOdds: number;
  now?: number;
}): { points: LivePoint[]; last: number | null; settlement: number | null } => {
  const ref = useRef<Store | null>(null);
  if (base == null || startMs == null || endMs == null || endMs <= startMs) {
    return { points: [], last: null, settlement: null };
  }
  const span = endMs - startMs;
  const step = Math.max(1000, Math.round(span / 300 / 1000) * 1000);
  const until = Math.min(now, endMs);
  const at = (ms: number) => demoLiveAt(base, upOdds, seed, Math.floor(ms / 1000));

  if (!ref.current || ref.current.key !== key) {
    const points: LivePoint[] = [];
    for (let ms = startMs; ms <= until; ms += step) points.push({ t: ms, v: at(ms) });
    if (points.length === 0) points.push({ t: startMs, v: at(startMs) });
    ref.current = { key, points: points.slice(-MAX_POINTS) };
  }
  const s = ref.current;
  let lastT = s.points[s.points.length - 1].t;
  while (lastT + step <= until) {
    lastT += step;
    s.points.push({ t: lastT, v: at(lastT) });
    if (s.points.length > MAX_POINTS) s.points.shift();
  }
  return {
    points: s.points,
    last: s.points[s.points.length - 1].v,
    settlement: demoSettlementAt(base, upOdds, seed, Math.floor(until / 1000)),
  };
};
