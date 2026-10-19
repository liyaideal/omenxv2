// ============================================================
// Quick Play (arcade) price path — the JS twin of public.arcade_path.
//
// Every round row carries (seed, open_price, steps, sigma). Both sides walk
// the same 32-bit LCG in IEEE doubles with the same op order, so the price
// the player watched tick and the close the engine settles on are the same
// number (verified to the last digit, 2026-10-19). 4 points per second:
// a 30s round has 120 draws → 121 points (open first).
//
// Demo engine only — the real platform settles on a real reference price.
// ============================================================

export interface ArcadeRoundRow {
  id: string;
  symbol: string;
  kind: "crypto" | "stock";
  tf: "30s" | "1m";
  start_at: string;
  end_at: string;
  open_price: number;
  close_price: number | null;
  seed: number;
  steps: number;
  sigma: number;
  winner: "up" | "down" | "void" | null;
}

export const ARCADE_STEP_MS = 250;

export const arcadePath = (seed: number, open: number, steps: number, sigma: number): number[] => {
  let x = seed % 4294967296;
  let p = open;
  const out = [open];
  for (let i = 1; i <= steps; i++) {
    x = (x * 1664525 + 1013904223) % 4294967296;
    const r = x / 4294967296;
    p = p * (1 + (r - 0.5) * 2 * sigma);
    out.push(p);
  }
  return out;
};

export const arcadeAdvance = (seed: number, n: number): number => {
  let x = seed % 4294967296;
  for (let i = 0; i < n; i++) x = (x * 1664525 + 1013904223) % 4294967296;
  return x;
};

export const arcadeClose = (r: Pick<ArcadeRoundRow, "seed" | "open_price" | "steps" | "sigma">) =>
  arcadePath(r.seed, r.open_price, r.steps, r.sigma)[r.steps];

export const arcadeWinner = (r: Pick<ArcadeRoundRow, "seed" | "open_price" | "steps" | "sigma">): "up" | "down" | "void" => {
  const c = arcadeClose(r);
  return c > r.open_price ? "up" : c < r.open_price ? "down" : "void";
};

/** Price at wall-clock `nowMs` inside a round: linear between the two
 *  surrounding path points, clamped to the open before start / close after end. */
export const arcadePriceAt = (path: number[], startMs: number, nowMs: number): number => {
  const f = (nowMs - startMs) / ARCADE_STEP_MS;
  if (f <= 0) return path[0];
  const i = Math.floor(f);
  if (i >= path.length - 1) return path[path.length - 1];
  const t = f - i;
  return path[i] + (path[i + 1] - path[i]) * t;
};

/** The next round of the same table when the server row is not here yet:
 *  same stream, continued. (The server writes the identical row.) */
export const arcadeNextOf = (r: ArcadeRoundRow): ArcadeRoundRow => {
  const secs = r.tf === "30s" ? 30 : 60;
  const start = new Date(r.end_at);
  const end = new Date(start.getTime() + secs * 1000);
  const ts = start.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return {
    ...r,
    id: `arcade-${r.symbol.toLowerCase()}-${r.tf}-${ts}`,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    open_price: arcadeClose(r),
    close_price: null,
    seed: arcadeAdvance(r.seed, r.steps),
    winner: null,
  };
};

/** events.name written by arcade_open_round — positions and posters key on it. */
export const arcadeEventName = (r: Pick<ArcadeRoundRow, "symbol" | "tf" | "start_at">) => {
  const d = new Date(r.start_at);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${r.symbol} — up or down? (${r.tf} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC)`;
};
