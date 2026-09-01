// ============================================================
// matchboardModel — the single source of truth for a fixture's
// segment scores and decided-segment tally. Every surface that
// shows those numbers (matchboard, stage capsules, board group
// headers) must read them from here, never recompute locally.
// ============================================================
import { useMemo, useSyncExternalStore } from "react";
import { SPORT_SEGMENTS, SPORT_FALLBACK, type SegmentSpec } from "@/lib/sportSegments";
import { fixtureMeta, isFixtureLive, type FixtureMeta } from "./sportsData";

export interface MatchboardEvent {
  id: string;
  name: string;
  is_resolved?: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
  winning_option_id?: string | null;
  event_subtype?: string | null;
  metadata?: unknown;
}

export type Status = "live" | "break" | "upcoming" | "finished" | "settled";

export interface SegResult {
  home: number;
  away: number;
}

export interface Model {
  meta: FixtureMeta;
  spec: SegmentSpec | undefined;
  status: Status;
  isMma: boolean;
  showTotals: boolean;
  total: number;
  results: (SegResult | null)[];
  idx: number | null;
  home: string;
  away: string;
  homeMaps: number;
  awayMaps: number;
  ctx: string;
  rightValue: string;
  sealed: boolean;
  clockText: string;
  winnerHome: boolean | null;
  current: SegResult | null;
  scoreText: string;
  cellMode: "score" | "winloss";
  totalsWord: string;
  colWidth: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `m:ss`, clamped to [0,300]. */
export const clockText = (raw: number | null | undefined): string => {
  const s = Math.max(0, Math.min(300, Number(raw ?? 0)));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};

/** "24:10" — 已进行时长，无上限（对比 clockText 钳在 300 秒）。 */
export const elapsedText = (raw: number | null | undefined): string => {
  const s = Math.max(0, Math.floor(Number(raw ?? 0)));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};

/** "Starts in 2h 14m" / "Starts in 5d 4h". */
export const startsIn = (kickoff: number, now: number): string => {
  const ms = Math.max(0, kickoff - now);
  const mins = Math.floor(ms / 60_000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `Starts in ${d}d ${h}h`;
  if (h > 0) return `Starts in ${h}h ${m}m`;
  return `Starts in ${m}m`;
};

export const buildModel = (event: MatchboardEvent, now: number): Model => {
  const meta = fixtureMeta(event);
  const spec =
    (meta.segments_key ? SPORT_SEGMENTS[meta.segments_key] : undefined) ??
    SPORT_FALLBACK[(meta.sport || "").toLowerCase()];
  const isMma = (meta.sport || "").toLowerCase() === "mma";
  const raw = (meta.segment_results || []) as (SegResult | null)[];
  // 篮球打加时：段数被数据撑开（overtime 为 false 的项目一律用 baseTotal，行为不变）。
  const baseTotal = spec?.total ?? 0;
  const total =
    spec?.overtime && raw.length > baseTotal ? raw.length : baseTotal;
  const results: (SegResult | null)[] = Array.from(
    { length: total },
    (_, i) => raw[i] ?? null,
  );
  const live = isFixtureLive(event, now);
  const kickoff = meta.kickoff_at
    ? new Date(meta.kickoff_at).getTime()
    : event.start_date
      ? new Date(event.start_date).getTime()
      : NaN;

  // Soccer carries no `metadata.segment_index`; the current half is inferred
  // from the elapsed minute (>45 ⇒ 2H).
  const rawIdx = meta.segment_index ?? null;
  const idx =
    rawIdx != null
      ? rawIdx
      : spec?.unit === "half" && live && Number.isFinite(kickoff)
        ? Math.min(2, Math.floor((now - kickoff) / 60_000) > 45 ? 2 : 1)
        : null;

  const current = idx != null ? (results[idx - 1] ?? null) : null;
  // Half-time is out of scope this round: a `half` fixture never enters BREAK.
  const inBreak =
    spec?.unit === "half"
      ? false
      : isMma
        ? live && meta.phase === "BREAK"
        : live && idx != null && idx > 1 && current == null;

  const status: Status = event.is_resolved
    ? "settled"
    : live
      ? inBreak
        ? "break"
        : "live"
      : Number.isFinite(kickoff) && kickoff > now
        ? "upcoming"
        : "finished";

  // Decided segments only. `decisiveThreshold` = null (UFC) means the
  // segment carries no published score, so nothing is counted.
  // UFC 零变化：它的 `segment_results` 全是 `null`，第一行就返回 false；
  // 且它 `totalsWord: null`，根本不渲染总数列。
  const decided = (r: SegResult | null, n: number) => {
    if (!r) return false;
    if (spec?.decisiveThreshold != null) return Math.max(r.home, r.away) >= spec.decisiveThreshold;
    // 无决胜分的项目（网球盘、MOBA 局）：不是当前段就算打完。
    return idx == null || n !== idx;
  };
  let homeMaps = 0;
  let awayMaps = 0;
  if (spec?.totalsRule === "sum") {
    results.forEach((r) => {
      homeMaps += r?.home ?? 0;
      awayMaps += r?.away ?? 0;
    });
  } else {
    results.forEach((r, i) => {
      if (!decided(r, i + 1) || !r) return;
      if (r.home > r.away) homeMaps += 1;
      else if (r.away > r.home) awayMaps += 1;
    });
  }

  const league = meta.league || "";
  const segName = (n: number) => spec?.segName(n) ?? `Map ${n}`;
  // `server` / `game_points` 尚未入库（RawMeta 未声明），这里做局部读取。
  const metaBag = meta as unknown as Record<string, unknown>;
  const server = typeof metaBag.server === "string" ? metaBag.server : null;
  const gamePoints =
    typeof metaBag.game_points === "string" ? metaBag.game_points : null;
  const ctx =
    status === "live" && idx != null
      ? `${league} · ${segName(idx)}${spec?.unit === "set" && server ? ` · ${server} serving` : ""}`
      : status === "break" && idx != null
        ? isMma
          ? `${league} · Between rounds`
          : `${league} · Map ${idx} starting`
        : status === "upcoming" && isMma && total > 0
          ? `${league} · ${total} rounds`
          : league;

  const scoreText = `${homeMaps}–${awayMaps}`;
  const minuteText = `${Math.max(1, Math.min(90, Math.floor((now - kickoff) / 60_000)))}′`;
  const rightValue =
    status === "upcoming" && Number.isFinite(kickoff)
      ? startsIn(kickoff, now)
      : status === "break"
        ? "—"
        : status === "live"
          ? spec?.rightValue === "minute" && Number.isFinite(kickoff)
            ? minuteText
            : spec?.rightValue === "points"
            ? (gamePoints ?? "—")
            : spec?.rightValue === "elapsed"
            ? elapsedText(meta.clock)
            : isMma
              ? clockText(meta.clock)
              : current
                ? `${current.home}–${current.away}`
                : "—"
          : "";

  return {
    meta,
    spec,
    status,
    isMma,
    showTotals: spec ? spec.totalsWord !== null : !isMma,
    total,
    results,
    idx,
    home: meta.home || "",
    away: meta.away || "",
    homeMaps,
    awayMaps,
    ctx,
    rightValue,
    sealed: isMma,
    clockText: clockText(meta.clock),
    winnerHome: event.winning_option_id
      ? event.winning_option_id.endsWith("-o1")
      : null,
    current,
    scoreText,
    cellMode: spec?.cell ?? "score",
    totalsWord: spec ? (spec.totalsWord ?? "") : "maps",
    colWidth: spec?.colWidth ?? 62,
  };
};

// ============================================================
// One clock for every consumer. Two components each running their
// own 30s timer can be up to 30s apart, which is a second way for
// the same number to disagree with itself. This module ticks once
// and everyone recomputes together.
// ============================================================
let clockNow = Date.now();
const clockListeners = new Set<() => void>();
let clockTimer: number | null = null;

const ensureClock = () => {
  if (clockTimer != null) return;
  clockTimer = window.setInterval(() => {
    clockNow = Date.now();
    clockListeners.forEach((l) => l());
  }, 30_000);
};

const subscribeClock = (cb: () => void) => {
  clockListeners.add(cb);
  ensureClock();
  return () => {
    clockListeners.delete(cb);
    if (clockListeners.size === 0 && clockTimer != null) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }
  };
};

/** The shared matchboard model. Every surface that shows a fixture's
 *  score must read it from here — never recompute it locally. */
export const useMatchboardModel = (event: MatchboardEvent): Model => {
  const now = useSyncExternalStore(
    subscribeClock,
    () => clockNow,
    () => clockNow,
  );
  return useMemo(() => buildModel(event, now), [event, now]);
};
