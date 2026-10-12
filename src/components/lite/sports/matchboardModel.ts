// ============================================================
// matchboardModel — the single source of truth for a fixture's
// segment scores and decided-segment tally. Every surface that
// shows those numbers (matchboard, stage capsules, board group
// headers) must read them from here, never recompute locally.
// ============================================================
import { useMemo, useSyncExternalStore } from "react";
import { SPORT_SEGMENTS, SPORT_FALLBACK, ordinal, type SegmentSpec } from "@/lib/sportSegments";
import { fixtureMeta, isFixtureLive, type FixtureMeta } from "./sportsData";
import { formatGamePoints } from "./tennisScore";

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
  /** 棒球：该半局还没轮到打时为 null（格子写 `—`）。其他运动恒为数字。 */
  home: number | null;
  away: number | null;
  /** 网球抢七点数。盘打到 6–6 进入抢七时写入并随每分更新；盘以 7–6 / 6–7 结束后保留为终值。 */
  tb?: { home: number; away: number } | null;
}

/** 该盘是否由抢七决出（7–6 / 6–7 且带 tb）。只有这种盘的格子才带上标。 */
export const isTiebreakSet = (r: SegResult | null | undefined): r is SegResult & { tb: { home: number; away: number } } =>
  !!r && !!r.tb && r.home != null && r.away != null && Math.max(r.home, r.away) === 7 && Math.abs(r.home - r.away) === 1;

/** 该盘抢七是否正在进行（6–6 且带 tb）。 */
export const isTiebreakLive = (r: SegResult | null | undefined): r is SegResult & { tb: { home: number; away: number } } =>
  !!r && !!r.tb && r.home === 6 && r.away === 6;

/** 一方未出场的半局当 0 算（总分、胜负判定都用它）。 */
export const n0 = (v: number | null | undefined): number => v ?? 0;

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
  /** 网球：当前盘抢七进行中。右值改显抢七点数，上下文行插 `Tiebreak`。 */
  tiebreakLive: boolean;
  /** 右值前缀（橙色）：网球抢七 `TB`、棒球半局箭头 `▲` / `▼`。null = 无前缀。 */
  rightPrefix: string | null;
  cellMode: "score" | "winloss";
  totalsWord: string;
  colWidth: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `m:ss`, clamped to [0, max]（默认 300 = UFC 回合；NBA 720 / NFL 900 / NHL 1200 由 SegmentSpec.clockMax 给）。 */
export const clockText = (raw: number | null | undefined, max = 300): string => {
  const s = Math.max(0, Math.min(max, Number(raw ?? 0)));
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
    // MOBA：当前局在打完前没有可写的比分，`current == null` 不代表间歇。
    spec?.cell === "winloss"
      ? false
      : spec?.unit === "half"
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
    if (spec?.decisiveThreshold != null) return Math.max(n0(r.home), n0(r.away)) >= spec.decisiveThreshold;
    // 无决胜分的项目（网球盘、MOBA 局）：不是当前段就算打完。
    return idx == null || n !== idx;
  };
  let homeMaps = 0;
  let awayMaps = 0;
  if (spec?.totalsRule === "sum") {
    results.forEach((r) => {
      homeMaps += n0(r?.home);
      awayMaps += n0(r?.away);
    });
  } else {
    results.forEach((r, i) => {
      if (!decided(r, i + 1) || !r) return;
      if (n0(r.home) > n0(r.away)) homeMaps += 1;
      else if (n0(r.away) > n0(r.home)) awayMaps += 1;
    });
  }

  const league = meta.league || "";
  const segName = (n: number) => spec?.segName(n) ?? `Map ${n}`;
  // `server` / `game_points` 尚未入库（RawMeta 未声明），这里做局部读取。
  const metaBag = meta as unknown as Record<string, unknown>;
  const server = typeof metaBag.server === "string" ? metaBag.server : null;
  const gamePoints = formatGamePoints(
    typeof metaBag.game_points === "string" ? metaBag.game_points : null,
  );
  const tiebreakLive =
    status === "live" && spec?.unit === "set" && isTiebreakLive(current);
  // 美式足球球权（`metadata.possession` = 队伍缩写），缺失不显示。
  const possession =
    spec?.unit === "quarter" && typeof metaBag.possession === "string" && metaBag.possession
      ? ` · ${metaBag.possession} ball`
      : "";
  // 棒球半局 + 出局数（`metadata.half` = top | bottom，`outs` = 0–2）。
  const half = metaBag.half === "bottom" ? "bottom" : metaBag.half === "top" ? "top" : null;
  const outs = typeof metaBag.outs === "number" ? metaBag.outs : null;
  const ctx =
    status === "live" && idx != null
      ? `${league} · ${segName(idx)}${tiebreakLive ? " · Tiebreak" : ""}${possession}${spec?.unit === "set" && server ? ` · ${server} serving` : ""}`
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
            : spec?.rightValue === "inning" && idx != null
            ? `${ordinal(idx)}${outs != null ? ` · ${outs} out` : ""}`
            : spec?.rightValue === "clock" && !isMma
            ? clockText(meta.clock, spec.clockMax)
            : spec?.rightValue === "points"
            ? tiebreakLive && current?.tb
              ? `${current.tb.home}–${current.tb.away}`
              : (gamePoints ?? "—")
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
    clockText: clockText(meta.clock, spec?.clockMax),
    winnerHome: event.winning_option_id
      ? event.winning_option_id.endsWith("-o1")
      : null,
    current,
    scoreText,
    tiebreakLive,
    rightPrefix:
      status === "live" && tiebreakLive
        ? "TB"
        : status === "live" && spec?.rightValue === "inning" && half
          ? half === "top" ? "\u25B2" : "\u25BC"
          : null,
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
