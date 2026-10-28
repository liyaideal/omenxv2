// ============================================================
// Quick Play v2 data layer — BTC 30-second calls on the real three-exchange
// index (CPO 2026-10-27/28). Mirrors supabase/migrations/20261028120000_arcade_calls.sql:
//   arcade_table_now()        latest tick + table state + params + my exposure (poll 1 Hz)
//   arcade_index_ticks        the 1-second index history (chart + table road)
//   arcade_place / _cancel    one chip = one 30 s contract; 2 s cancel at the open price
//   arcade_settle_mine()      settle my due calls now (the cron sweep covers everyone)
//   arcade_my_calls()         my record (open + settled)
//   arcade_table_feed()       everyone's open calls, anonymised (TABLE tab)
//   arcade_accept_terms()     the first-entry disclaimer, once per account
// Money math (研发稿 2.2): fee = round_half_up_cent(gross × 3%), net = gross − fee,
// win_payout = floor_to_cent(net / p), credit if won = win_payout − 5% × (win_payout − gross).
// ============================================================
import { supabase } from "@/integrations/supabase/client";

export type CallSide = "up" | "down";
export type CallStatus = "open" | "cancelled" | "won" | "lost" | "void";

export interface ArcadeTick {
  ts: string;
  binance: number | null;
  hyperliquid: number | null;
  coinbase: number | null;
  usdt_usd: number | null;
  idx: number | null;
  valid: boolean;
  reason: string | null;
  p_up: number | null;
  r1?: number | null;
}

export interface ArcadeTableState {
  paused_reason: "index" | "breaker" | "loss" | "full" | "off" | null;
  breaker_until: string | null;
  worst_loss: number;
  open_calls: number;
  open_stake: number;
  updated_at: string;
}

export interface ArcadeTableNow {
  tick: ArcadeTick | null;
  state: ArcadeTableState | null;
  params: Record<string, number | null>;
  now: string;
  my_open: number;
  ack: string | null;
}

export interface ArcadeCall {
  id: string;
  user_id: string | null;
  side: CallSide;
  gross: number;
  fee: number;
  net: number;
  p: number;
  p_up: number;
  win_payout: number;
  quote_ts: string;
  quote_idx: number;
  t0: string;
  t1: string;
  s0: number | null;
  s1: number | null;
  status: CallStatus;
  pnl: number | null;
  commission: number | null;
  cancel_fee: number | null;
  settled_at: string | null;
  created_at: string;
}

export interface ArcadeFeedRow {
  id: string;
  who: string;
  side: CallSide;
  gross: number;
  p: number;
  t0: string;
  t1: string;
  mine: boolean;
}

export const ARCADE_CHIPS_V2 = [5, 10, 25, 50, 100] as const;
export const ARCADE_FEE_RATE_V2 = 0.03;
export const ARCADE_CANCEL_FEE_RATE = 0.0015;
export const ARCADE_COMMISSION_RATE = 0.05;
export const ARCADE_DURATION_MS = 30000;
export const ARCADE_CANCEL_MS = 2000;
export const ARCADE_MAX_OPEN = 500;

const roundHalfUpCent = (n: number) => Math.floor(n * 100 + 0.5) / 100;
export const callFee = (gross: number) => roundHalfUpCent(gross * ARCADE_FEE_RATE_V2);
export const callNet = (gross: number) => Math.round((gross - callFee(gross)) * 100) / 100;
export const callPayout = (gross: number, p: number) => Math.floor((callNet(gross) / p) * 100) / 100;
/** what lands in the balance if the call wins, net of the 5 % commission on profit */
export const callCredit = (gross: number, p: number) => {
  const pay = callPayout(gross, p);
  return Math.round((pay - roundHalfUpCent((pay - gross) * ARCADE_COMMISSION_RATE)) * 100) / 100;
};
/** the +$ shown on the key: profit after commission */
export const callNetWin = (gross: number, p: number) => Math.round((callCredit(gross, p) - gross) * 100) / 100;
export const cancelFee = (gross: number) => roundHalfUpCent(gross * ARCADE_CANCEL_FEE_RATE);

// The tables/functions are newer than the generated Supabase types: go through `any`.
const db = () => supabase as any;
const num = (v: any): number => (v == null ? 0 : Number(v));
const numOrNull = (v: any): number | null => (v == null ? null : Number(v));

const normCall = (r: any): ArcadeCall => ({
  ...r,
  gross: num(r.gross),
  fee: num(r.fee),
  net: num(r.net),
  p: num(r.p),
  p_up: num(r.p_up),
  win_payout: num(r.win_payout),
  quote_idx: num(r.quote_idx),
  s0: numOrNull(r.s0),
  s1: numOrNull(r.s1),
  pnl: numOrNull(r.pnl),
  commission: numOrNull(r.commission),
  cancel_fee: numOrNull(r.cancel_fee),
});

export async function fetchTableNow(): Promise<ArcadeTableNow> {
  const { data, error } = await db().rpc("arcade_table_now");
  if (error) throw error;
  const d = data || {};
  return {
    tick: d.tick ? { ...d.tick, idx: numOrNull(d.tick.idx), p_up: numOrNull(d.tick.p_up) } : null,
    state: d.state
      ? { ...d.state, worst_loss: num(d.state.worst_loss), open_calls: num(d.state.open_calls), open_stake: num(d.state.open_stake) }
      : null,
    params: d.params || {},
    now: d.now,
    my_open: num(d.my_open),
    ack: d.ack ?? null,
  };
}

/** the last `seconds` of index ticks, oldest first (valid and invalid — the chart shows gaps) */
export async function fetchTicks(seconds: number): Promise<ArcadeTick[]> {
  const since = new Date(Date.now() - seconds * 1000).toISOString();
  const { data, error } = await db()
    .from("arcade_index_ticks")
    .select("ts, binance, hyperliquid, coinbase, usdt_usd, idx, valid, reason, p_up")
    .gte("ts", since)
    .order("ts", { ascending: true })
    .limit(seconds + 60);
  if (error) throw error;
  return (data || []).map((t: any) => ({ ...t, idx: numOrNull(t.idx), p_up: numOrNull(t.p_up) }));
}

/** ticks after `afterTs` (exclusive), oldest first */
export async function fetchTicksAfter(afterTs: string): Promise<ArcadeTick[]> {
  const { data, error } = await db()
    .from("arcade_index_ticks")
    .select("ts, binance, hyperliquid, coinbase, usdt_usd, idx, valid, reason, p_up")
    .gt("ts", afterTs)
    .order("ts", { ascending: true })
    .limit(120);
  if (error) throw error;
  return (data || []).map((t: any) => ({ ...t, idx: numOrNull(t.idx), p_up: numOrNull(t.p_up) }));
}

export async function placeCall(side: CallSide, gross: number, quoteTs: string): Promise<ArcadeCall & { balance: number }> {
  const { data, error } = await db().rpc("arcade_place", { p_side: side, p_gross: gross, p_quote_ts: quoteTs });
  if (error) throw new Error(cleanErr(error.message));
  return { ...normCall(data), balance: num(data.balance) };
}

export async function cancelCall(id: string): Promise<{ cancel_fee: number; balance: number }> {
  const { data, error } = await db().rpc("arcade_cancel", { p_id: id });
  if (error) throw new Error(cleanErr(error.message));
  return { cancel_fee: num(data.cancel_fee), balance: num(data.balance) };
}

export async function settleMine(): Promise<{ id: string; status: CallStatus; pnl: number; s0: number | null; s1: number | null }[]> {
  const { data, error } = await db().rpc("arcade_settle_mine");
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, pnl: num(d.pnl), s0: numOrNull(d.s0), s1: numOrNull(d.s1) }));
}

export async function fetchMyCalls(sinceIso: string | null, limit = 60): Promise<ArcadeCall[]> {
  const { data, error } = await db().rpc("arcade_my_calls", { p_since: sinceIso, p_limit: limit });
  if (error) throw error;
  return (data || []).map(normCall);
}

export async function fetchTableFeed(): Promise<ArcadeFeedRow[]> {
  const { data, error } = await db().rpc("arcade_table_feed");
  if (error) throw error;
  return (data || []).map((r: any) => ({ ...r, gross: num(r.gross), p: num(r.p) }));
}

export async function acceptTerms(): Promise<string> {
  const { data, error } = await db().rpc("arcade_accept_terms");
  if (error) throw new Error(cleanErr(error.message));
  return data as string;
}

/** Postgres wraps our RAISE text; keep only the human sentence. */
const cleanErr = (m: string) => (m || "Something went wrong").replace(/^.*?(?:ERROR:|error:)\s*/, "").split("\n")[0].trim();

/* ---------- the table's road: 30-second cells of the index ---------- */
export type RoadCell = "u" | "d";
export interface RoadSlot {
  slot_start: string;
  open_idx: number;
  close_idx: number;
}

export async function fetchRoad(slots = 120): Promise<RoadSlot[]> {
  const { data, error } = await db().rpc("arcade_road", { p_slots: slots });
  if (error) throw error;
  return (data || []).map((r: any) => ({ slot_start: r.slot_start, open_idx: num(r.open_idx), close_idx: num(r.close_idx) }));
}

/**
 * Wall-clock 30 s slots (…:00, :30), oldest first. A cell is the sign of (close − open) of the index in
 * that slot; a flat or missing slot repeats the previous colour so the road has no holes (a tie on the
 * table is a void, not a result — same idea).
 */
export function roadCells(rows: RoadSlot[], slots: number, nowMs: number): RoadCell[] {
  const SLOT = 30000;
  const cur = Math.floor(nowMs / SLOT) * SLOT;
  const first = cur - slots * SLOT;
  const by = new Map<number, RoadSlot>();
  rows.forEach((r) => by.set(new Date(r.slot_start).getTime(), r));
  const cells: RoadCell[] = [];
  let prev: RoadCell | null = null;
  for (let i = 0; i < slots; i++) {
    const r = by.get(first + i * SLOT);
    if (!r) {
      if (prev) cells.push(prev);
      continue;
    }
    const cell: RoadCell = r.close_idx > r.open_idx ? "u" : r.close_idx < r.open_idx ? "d" : prev || "u";
    cells.push(cell);
    prev = cell;
  }
  return cells;
}
