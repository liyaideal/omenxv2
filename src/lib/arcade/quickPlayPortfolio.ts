// ============================================================
// Quick Play → Lite portfolio view-models (CPO 2026-10-29).
// A session (one sitting, closed by 30 minutes without a call) is one row
// in Settled › Standard, and one detail page at /portfolio/quick-play/:key.
// Copy rules live here so the list, the detail page and the style guide
// read from one place.
// ============================================================
import type { ArcadeCall, ArcadeSession } from "@/lib/arcade/arcadeCalls";
import type { ArcadeRunShare } from "@/pages/arcade/arcadeEngine";
import { arcadeSessionMinutes, arcadeSessionSpan } from "@/lib/arcade/session";
import type { LiteSettledRow } from "@/hooks/useLitePortfolio";

/** Whole dollars when whole, cents otherwise: $5 · $12.50 */
const whole = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/** "$5 a call" / "$5 – $25 a call" */
export const quickPlayStakeLine = (min: number | null, max: number | null): string => {
  if (min == null || max == null) return "";
  return min === max ? `${whole(min)} a call` : `${whole(min)} – ${whole(max)} a call`;
};

/** "8 calls @ $5 – $25" — the Staked card sub-line. */
export const quickPlayStakeSub = (s: ArcadeSession): string => {
  if (s.calls === 0 || s.min_stake == null || s.max_stake == null) return "no call went to settlement";
  const range = s.min_stake === s.max_stake ? whole(s.min_stake) : `${whole(s.min_stake)} – ${whole(s.max_stake)}`;
  return `${s.calls} call${s.calls === 1 ? "" : "s"} @ ${range}`;
};

export const QUICK_PLAY_MARKET = "BTC 30-second calls";

export const quickPlayTitle = (s: Pick<ArcadeSession, "started_at" | "ended_at">) =>
  `${QUICK_PLAY_MARKET} · ${arcadeSessionSpan(s.started_at, s.ended_at)}`;

/** The Settled › Standard row for one session. */
export const quickPlayRow = (s: ArcadeSession): LiteSettledRow => {
  const meta: string[] = [];
  if (s.calls > 0) {
    meta.push(`${s.calls} call${s.calls === 1 ? "" : "s"}`, `won ${s.won} of ${s.calls}`);
    if (s.best_run >= 2) meta.push(`best run ${s.best_run}`);
    // the stake range stays on the detail page (CPO 2026-10-31: not a list field)
  }
  if (s.refunded) meta.push(`${s.refunded} refunded`);
  if (s.cancelled) meta.push(`${s.cancelled} cancelled`);
  return {
    id: `qp-${s.session_key}`,
    title: quickPlayTitle(s),
    metaParts: meta,
    remark: "none",
    net: s.pnl,
    segment: "standard",
    closedAt: s.last_settled_at ?? s.ended_at,
    isSeries: false,
    won: s.pnl > 0,
    kind: "quickplay",
    sessionKey: s.session_key,
    mobile: { title: arcadeSessionSpan(s.started_at, s.ended_at), metaParts: ["BTC", ...meta] },
  };
};

/** The run poster, fed from a session instead of the live cabinet. */
export const quickPlayShareRun = (s: ArcadeSession): ArcadeRunShare => ({
  pnl: s.pnl,
  won: s.won,
  lost: s.lost,
  bestRun: s.best_run,
  biggestWin: s.biggest_win,
  minutes: arcadeSessionMinutes(s.started_at, s.ended_at),
  calls: s.calls,
  stakeLine: s.min_stake != null && s.min_stake === s.max_stake ? `${whole(s.min_stake)} each` : `${whole(s.staked)} staked`,
});

/* ---------------- detail page view-model ---------------- */

export interface QuickPlayCallVM {
  id: string;
  /** when the call went down (ISO) */
  time: string;
  side: "up" | "down";
  gross: number;
  /** price paid for the side, 0–1 */
  p: number;
  status: "won" | "lost" | "void" | "cancelled";
  pnl: number;
}

export interface QuickPlaySessionVM {
  sessionKey: string;
  title: string;
  startedAt: string;
  endedAt: string;
  lastSettledAt: string;
  calls: number;
  won: number;
  lost: number;
  refunded: number;
  cancelled: number;
  bestRun: number;
  staked: number;
  payout: number;
  fees: number;
  commission: number;
  pnl: number;
  stakeLine: string;
  stakeSub: string;
  rows: QuickPlayCallVM[];
  hasMore: boolean;
  loadingMore: boolean;
}

export const quickPlayCallVM = (c: ArcadeCall): QuickPlayCallVM => ({
  id: c.id,
  time: c.created_at,
  side: c.side === "up" ? "up" : "down",
  gross: c.gross,
  p: c.p,
  status: c.status === "won" || c.status === "lost" || c.status === "void" ? c.status : "cancelled",
  pnl: c.pnl ?? 0,
});

export const quickPlaySessionVM = (
  s: ArcadeSession,
  calls: ArcadeCall[],
  paging: { hasMore: boolean; loading: boolean },
): QuickPlaySessionVM => ({
  sessionKey: s.session_key,
  title: quickPlayTitle(s),
  startedAt: s.started_at,
  endedAt: s.ended_at,
  lastSettledAt: s.last_settled_at ?? s.ended_at,
  calls: s.calls,
  won: s.won,
  lost: s.lost,
  refunded: s.refunded,
  cancelled: s.cancelled,
  bestRun: s.best_run,
  staked: s.staked,
  payout: s.payout,
  fees: s.fees,
  commission: s.commission,
  pnl: s.pnl,
  stakeLine: quickPlayStakeLine(s.min_stake, s.max_stake),
  stakeSub: quickPlayStakeSub(s),
  rows: calls.map(quickPlayCallVM),
  hasMore: paging.hasMore,
  loadingMore: paging.loading,
});
