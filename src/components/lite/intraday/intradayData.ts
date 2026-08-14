// ============================================================
// Intraday band — data layer.
// Reads the rolling quick-round crypto events and the daily
// stock up/down spot events. Display-only; no writes.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const QUICK_SUBTYPE = "CRYPTO_QUICK_UPDOWN_SPOT";
export const US_STOCK_SUBTYPE = "US_STOCK_DAILY_UPDOWN_SPOT";
export const HK_STOCK_SUBTYPE = "HK_STOCK_DAILY_UPDOWN_SPOT";
export const KR_STOCK_SUBTYPE = "KR_STOCK_DAILY_UPDOWN_SPOT";

export const INTRADAY_SUBTYPES = [
  QUICK_SUBTYPE,
  US_STOCK_SUBTYPE,
  HK_STOCK_SUBTYPE,
  KR_STOCK_SUBTYPE,
] as const;

export type Timeframe = "5m" | "15m" | "1h" | "4h" | "1d";

export const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1h", label: "1h" },
  { id: "4h", label: "4h" },
  { id: "1d", label: "1D" },
];

export const TF_SECONDS: Record<Timeframe, number> = {
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

export const COINS = ["btc", "eth", "sol"] as const;
export type Coin = (typeof COINS)[number];

export const COIN_META: Record<Coin, { ticker: string; name: string }> = {
  btc: { ticker: "BTC", name: "Bitcoin" },
  eth: { ticker: "ETH", name: "Ethereum" },
  sol: { ticker: "SOL", name: "Solana" },
};

export interface QuickOption {
  id: string;
  label: string;
  price: number;
  is_winner: boolean | null;
}

export interface QuickEvent {
  id: string;
  name: string;
  coin: Coin;
  tf: Timeframe;
  period: string;
  base_price: number | null;
  start_date: string | null;
  end_date: string | null;
  volume: number;
  is_resolved: boolean;
  options: QuickOption[];
}

/** crypto-{coin}-updown-{tf}-{period} */
export const parseQuickId = (
  id: string,
): { coin: Coin; tf: Timeframe; period: string } | null => {
  const m = /^crypto-([a-z]+)-updown-(5m|15m|1h|4h|1d)-(\d+)$/.exec(id);
  if (!m) return null;
  if (!(COINS as readonly string[]).includes(m[1])) return null;
  return { coin: m[1] as Coin, tf: m[2] as Timeframe, period: m[3] };
};

const toQuick = (row: {
  id: string;
  name: string;
  base_price: number | string | null;
  start_date: string | null;
  end_date: string | null;
  volume: string | number | null;
  is_resolved: boolean;
  event_options?: { id: string; label: string; price: number | string; is_winner: boolean | null }[];
}): QuickEvent | null => {
  const parsed = parseQuickId(row.id);
  if (!parsed) return null;
  return {
    id: row.id,
    name: row.name,
    coin: parsed.coin,
    tf: parsed.tf,
    period: parsed.period,
    base_price: row.base_price != null ? Number(row.base_price) : null,
    start_date: row.start_date,
    end_date: row.end_date,
    volume: Number(row.volume ?? 0),
    is_resolved: row.is_resolved,
    options: (row.event_options || []).map((o) => ({
      id: o.id,
      label: o.label,
      price: Number(o.price),
      is_winner: o.is_winner,
    })),
  };
};

export const upOptionOf = (e: QuickEvent | null | undefined) =>
  e?.options.find((o) => /up/i.test(o.label)) ?? e?.options[0] ?? null;
export const downOptionOf = (e: QuickEvent | null | undefined) => {
  const up = upOptionOf(e);
  return e?.options.find((o) => o.id !== up?.id) ?? null;
};

/** Live quick rounds + recent settled history, grouped by coin+tf. */
export const useQuickRounds = (enabled: boolean, refreshKey: number = 0) => {
  const [live, setLive] = useState<QuickEvent[]>([]);
  const [settled, setSettled] = useState<QuickEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  // Rounds roll every minute — refresh on a slow cadence.
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setTick((n) => n + 1), 20_000);
    return () => clearInterval(t);
  }, [enabled]);

  // Expiry watchdog — the moment a bound round's end_date passes, refetch once
  // so the tiles roll to the next round instead of sitting at 00:00.
  useEffect(() => {
    if (!enabled || live.length === 0) return;
    let fired = false;
    const t = setInterval(() => {
      if (fired) return;
      const now = Date.now();
      const expired = live.some(
        (e) => e.end_date && new Date(e.end_date).getTime() <= now,
      );
      if (expired) {
        fired = true;
        setTick((n) => n + 1);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [enabled, live]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    (async () => {
      const [{ data: liveRows }, { data: doneRows }] = await Promise.all([
        supabase
          .from("events")
          .select(
            "id, name, base_price, start_date, end_date, volume, is_resolved, event_options(id, label, price, is_winner)",
          )
          .eq("event_subtype", QUICK_SUBTYPE)
          .eq("is_resolved", false),
        supabase
          .from("events")
          .select(
            "id, name, base_price, start_date, end_date, volume, is_resolved, event_options(id, label, price, is_winner)",
          )
          .eq("event_subtype", QUICK_SUBTYPE)
          .eq("is_resolved", true)
          .order("end_date", { ascending: false })
          .limit(300),
      ]);
      if (!alive) return;
      setLive(((liveRows || []) as never[]).map(toQuick).filter(Boolean) as QuickEvent[]);
      setSettled(((doneRows || []) as never[]).map(toQuick).filter(Boolean) as QuickEvent[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [enabled, tick, refreshKey]);

  const currentFor = useMemo(() => {
    const map = new Map<string, QuickEvent>();
    for (const e of live) {
      const k = `${e.coin}-${e.tf}`;
      const prev = map.get(k);
      if (!prev || (e.period > prev.period)) map.set(k, e);
    }
    return map;
  }, [live]);

  /** Last N settled outcomes for a coin+tf, oldest → newest. */
  const historyFor = useMemo(() => {
    const map = new Map<string, ("up" | "down")[]>();
    const grouped = new Map<string, QuickEvent[]>();
    for (const e of settled) {
      const k = `${e.coin}-${e.tf}`;
      const arr = grouped.get(k) || [];
      arr.push(e);
      grouped.set(k, arr);
    }
    for (const [k, arr] of grouped) {
      arr.sort((a, b) => a.period.localeCompare(b.period));
      map.set(
        k,
        arr.map((e) => {
          const up = upOptionOf(e);
          return up?.is_winner ? "up" : "down";
        }),
      );
    }
    return map;
  }, [settled]);

  return { live, currentFor, historyFor, loading };
};

// ---------------- Stocks closing today ----------------
export interface StockEventRow {
  id: string;
  name: string;
  base_price: number | null;
  start_date: string | null;
  end_date: string | null;
  freeze_time: string | null;
  event_subtype: string | null;
  upPrice: number;
  downPrice: number;
}

export const useIntradayStocks = (enabled: boolean) => {
  const [rows, setRows] = useState<StockEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select(
          "id, name, base_price, start_date, end_date, freeze_time, event_subtype, event_options(id, label, price)",
        )
        .in("event_subtype", [US_STOCK_SUBTYPE, HK_STOCK_SUBTYPE])
        .eq("is_resolved", false)
        .order("end_date", { ascending: true });
      if (!alive) return;
      const list: StockEventRow[] = (data || []).map((e) => {
        const opts = (e.event_options || []) as { label: string; price: number | string }[];
        const up = opts.find((o) => /up/i.test(o.label)) || opts[0];
        const down = opts.find((o) => o !== up);
        return {
          id: e.id,
          name: e.name,
          base_price: e.base_price != null ? Number(e.base_price) : null,
          start_date: (e as { start_date?: string | null }).start_date ?? null,
          end_date: e.end_date,
          freeze_time: (e as { freeze_time?: string | null }).freeze_time ?? null,
          event_subtype: e.event_subtype,
          upPrice: up ? Number(up.price) : 0.5,
          downPrice: down ? Number(down.price) : 0.5,
        };
      });
      setRows(list);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [enabled]);

  return { rows, loading };
};

// ---------------- Deterministic price synth ----------------
/** Stable pseudo-random in [0,1) from a numeric seed. */
const rnd = (seed: number) => {
  const x = Math.sin(seed * 41.13 + 7.79) * 10000;
  return x - Math.floor(x);
};

export const seedFromId = (id: string) =>
  id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

/**
 * Deterministic intraday-looking walk anchored on `base`, drifting to `end`.
 * Same technique as the existing stock chart synth.
 */
export const synthSeries = (
  seed: number,
  base: number,
  end: number,
  points: number,
  amplitude: number,
): number[] => {
  const out: number[] = [];
  for (let i = 0; i < points; i += 1) {
    const p = points === 1 ? 1 : i / (points - 1);
    const drift = (rnd(seed + i * 3.1) - 0.5) * 2 * amplitude;
    const wave = Math.sin(p * Math.PI * 1.7 + seed) * amplitude * 0.45;
    out.push(base + (end - base) * p + drift + wave);
  }
  return out;
};

/** One pass of a 3-point moving average (endpoints preserved). */
const smoothOnce = (xs: number[]): number[] =>
  xs.map((v, i) =>
    i === 0 || i === xs.length - 1 ? v : (xs[i - 1] + v + xs[i + 1]) / 3,
  );

/**
 * Smooth deterministic random walk used by the intraday tile plots.
 * Per-step relative sigma, optional per-step drift, then two smoothing passes.
 */
export const smoothWalk = (
  seed: number,
  start: number,
  points: number,
  sigma: number,
  drift = 0,
): number[] => {
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < points; i += 1) {
    const step = (rnd(seed + i * 2.37) - 0.5) * 2 * sigma + drift;
    v = v * (1 + step);
    out.push(v);
  }
  return smoothOnce(smoothOnce(out));
};

/** Live-ish price for a coin round: base_price nudged by the current odds. */
export const derivedPrice = (
  base: number | null,
  upOdds: number,
  seed: number,
  t: number,
): number | null => {
  if (base == null) return null;
  const skew = (upOdds - 0.5) * 0.012;
  const wobble = Math.sin(t / 4 + (seed % 7)) * 0.0015;
  return base * (1 + skew + wobble);
};

export const compactUsd = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

/** mm:ss for short rounds, h:mm:ss beyond an hour. */
export const formatCountdown = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

/**
 * Zero-padded ladder used by the two trade pages (`HH:MM:SS`, or `Nd HHh`
 * once a day or more remains and `days` is on). Same rendered format the
 * pages shipped with their private copies of this hook.
 */
export const formatClockCountdown = (ms: number, days = false): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  if (ms <= 0) return "00:00:00";
  const d = Math.floor(ms / 86_400_000);
  if (days && d > 0) return `${d}d ${pad(Math.floor((ms % 86_400_000) / 3_600_000))}h`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/** Shared trade-page countdown. Ticks every second while a target exists. */
export const useTradeCountdown = (
  target: Date | null,
  opts?: { days?: boolean },
) => {
  const days = opts?.days ?? false;
  const [text, setText] = useState("--:--:--");
  const [diffMs, setDiffMs] = useState<number>(Infinity);
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = target.getTime() - Date.now();
      setText(formatClockCountdown(diff, days));
      setDiffMs(Math.max(0, diff));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target, days]);
  return { text, diffMs };
};

/** Second-resolution clock shared by the band's countdowns. */
export const useSecondTick = () => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return n;
};