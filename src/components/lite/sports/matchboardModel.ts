// ============================================================
// matchboardModel — the single source of truth for a fixture's
// segment scores and decided-segment tally. Every surface that
// shows those numbers (matchboard, stage capsules, board group
// headers) must read them from here, never recompute locally.
// ============================================================
import { useMemo, useSyncExternalStore } from "react";
import { SPORT_SEGMENTS, type SegmentSpec } from "@/lib/sportSegments";
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
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `m:ss`, clamped to [0,300]. */
export const clockText = (raw: number | null | undefined): string => {
  const s = Math.max(0, Math.min(300, Number(raw ?? 0)));
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
  const spec = meta.segments_key ? SPORT_SEGMENTS[meta.segments_key] : undefined;
  const isMma = (meta.sport || "").toLowerCase() === "mma";
  const total = spec?.total ?? 0;
  const raw = (meta.segment_results || []) as (SegResult | null)[];
  const results: (SegResult | null)[] = Array.from(
    { length: total },
    (_, i) => raw[i] ?? null,
  );
  const idx = meta.segment_index ?? null;
  const live = isFixtureLive(event, now);
  const kickoff = meta.kickoff_at
    ? new Date(meta.kickoff_at).getTime()
    : event.start_date
      ? new Date(event.start_date).getTime()
      : NaN;

  const current = idx != null ? (results[idx - 1] ?? null) : null;
  const inBreak = isMma
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
  const decided = (r: SegResult | null, n: number) => {
    if (!r) return false;
    if (spec?.decisiveThreshold == null) return false;
    return Math.max(r.home, r.away) >= spec.decisiveThreshold;
  };
  let homeMaps = 0;
  let awayMaps = 0;
  results.forEach((r, i) => {
    if (!decided(r, i + 1) || !r) return;
    if (r.home > r.away) homeMaps += 1;
    else if (r.away > r.home) awayMaps += 1;
  });

  const league = meta.league || "";
  const unitWord = spec?.unit === "round" ? "Round" : "Map";
  const ctx =
    status === "live" && idx != null
      ? `${league} · ${unitWord} ${idx}`
      : status === "break" && idx != null
        ? isMma
          ? `${league} · Between rounds`
          : `${league} · Map ${idx} starting`
        : status === "upcoming" && isMma && total > 0
          ? `${league} · ${total} rounds`
          : league;

  const scoreText = `${homeMaps}–${awayMaps}`;
  const rightValue =
    status === "upcoming" && Number.isFinite(kickoff)
      ? startsIn(kickoff, now)
      : status === "break"
        ? "—"
        : status === "live"
          ? isMma
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
    showTotals: !isMma,
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
  // Parents re-render with a fresh `event` object literal on every price tick.
  // Memoising on the object identity would hand every consumer a new model each
  // render; memoise on the fields `buildModel` actually reads instead.
  const {
    id,
    name,
    is_resolved: isResolved,
    start_date: startDate,
    end_date: endDate,
    winning_option_id: winningOptionId,
    event_subtype: eventSubtype,
    metadata,
  } = event;
  return useMemo(
    () =>
      buildModel(
        {
          id,
          name,
          is_resolved: isResolved,
          start_date: startDate,
          end_date: endDate,
          winning_option_id: winningOptionId,
          event_subtype: eventSubtype,
          metadata,
        },
        now,
      ),
    [
      id,
      name,
      isResolved,
      startDate,
      endDate,
      winningOptionId,
      eventSubtype,
      metadata,
      now,
    ],
  );
};
