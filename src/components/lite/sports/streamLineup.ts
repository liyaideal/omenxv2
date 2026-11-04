// ============================================================
// STREAM LINEUP — which live matches sit on the stage and which
// stay in Playing now, for the Sports category view (desktop +
// mobile share this so both count the same way).
//   live      = in play this second (liveAt, re-derived per tick)
//   streamed  = live + stream_url + the player has not failed on it,
//               busiest first; equal volume → earlier kickoff first
//   others    = every other live match (no stream, or its stream
//               failed this visit) → Playing now
// A stream whose player reports error / forbidden leaves the stage
// for the rest of the visit (reload to retry) — CPO 2026-11-04.
// ============================================================
import { useCallback, useMemo, useState } from "react";
import { liveAt, type SportsMatch } from "./sportsData";

export const byStageOrder = (a: SportsMatch, b: SportsMatch) =>
  b.volume - a.volume || (a.kickoff?.getTime() ?? 0) - (b.kickoff?.getTime() ?? 0);

export const useStreamLineup = (scoped: SportsMatch[], now: number) => {
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  const live = useMemo(() => scoped.filter((m) => liveAt(m, now)), [scoped, now]);
  const isOnStream = useCallback((m: SportsMatch) => !!m.streamUrl && !failed.has(m.id), [failed]);
  const streamed = useMemo(() => live.filter(isOnStream).sort(byStageOrder), [live, isOnStream]);
  const others = useMemo(() => live.filter((m) => !isOnStream(m)), [live, isOnStream]);
  const markFailed = useCallback(
    (id: string) => setFailed((prev) => (prev.has(id) ? prev : new Set(prev).add(id))),
    [],
  );
  return { live, streamed, others, isOnStream, markFailed };
};
