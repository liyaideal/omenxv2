import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActivationState } from "@/hooks/useActivationState";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { usePositions } from "@/hooks/usePositions";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";

/**
 * One sortable feed item. The `kind` discriminator drives the rendered card.
 * `compact` is set during post-processing for 2nd+ consecutive same-kind item.
 */
export type FeedItem =
  | { kind: "onboarding"; score: number; tier: 1; compact?: boolean }
  | { kind: "welcomeBack"; score: number; tier: 1; compact?: boolean }
  | { kind: "positionAlert"; positionId: string; severity: number; score: number; tier: 1; compact?: boolean }
  | { kind: "settlingSoon"; eventId: string; secondsLeft: number; score: number; tier: 2; compact?: boolean }
  | { kind: "watchlistMove"; eventId: string; absChange: number; score: number; tier: 2; compact?: boolean }
  | { kind: "airdropOpportunity"; score: number; tier: 2; compact?: boolean }
  | { kind: "trending"; eventId: string; volume: number; score: number; tier: 2 | 3; compact?: boolean }
  | { kind: "newListing"; eventId: string; score: number; tier: 3; compact?: boolean }
  | { kind: "learn"; topicId: string; score: number; tier: 3; compact?: boolean };

const parseVolume = (v: string | null | undefined): number => {
  if (!v) return 0;
  const m = v.replace(/[$,]/g, "").match(/^([\d.]+)\s*([KMB])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const mult = m[2]?.toUpperCase() === "B" ? 1e9 : m[2]?.toUpperCase() === "M" ? 1e6 : m[2]?.toUpperCase() === "K" ? 1e3 : 1;
  return n * mult;
};

const parsePnlPercent = (s: string): number => {
  const n = parseFloat(s.replace(/[+%]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const LEARN_TOPICS = ["what-is-prediction", "how-leverage-works", "read-glossary"];

interface UseHomeFeedReturn {
  items: FeedItem[];
  isLoading: boolean;
}

export function useHomeFeed(): UseHomeFeedReturn {
  const { user } = useAuth();
  const isAuthed = !!user;
  const { state, isLoading: activationLoading } = useActivationState();
  const { events, isLoading: eventsLoading } = useActiveEvents();
  const { positions } = usePositions();
  const { watchlist } = useWatchlist();
  const { airdrops } = useAirdropPositions();
  const pendingAirdrops = airdrops.filter((a) => a.status === "pending").length;

  const isLoading = eventsLoading || (isAuthed && activationLoading);

  const items = useMemo<FeedItem[]>(() => {
    if (isLoading) return [];

    const candidates: FeedItem[] = [];
    const now = Date.now();

    // — Tier 1 —

    // positionAlert: any position with |pnlPercent| >= 10%
    if (isAuthed) {
      for (const p of positions) {
        const pct = Math.abs(parsePnlPercent(p.pnlPercent));
        if (pct >= 10) {
          const severity = Math.min(5, Math.floor(pct / 10)); // 1..5
          candidates.push({
            kind: "positionAlert",
            positionId: p.id,
            severity,
            score: 1000 + severity * 100,
            tier: 1,
          });
        }
      }
    }

    // onboarding: only S0/S1
    if (isAuthed && (state === "S0_NEW" || state === "S1_DEPOSITED")) {
      candidates.push({ kind: "onboarding", score: 900, tier: 1 });
    }

    // welcomeBack: S2/S3 (sleeping heuristic — 7d-away wiring later)
    if (isAuthed && (state === "S2_TRADED" || state === "S3_ACTIVE")) {
      candidates.push({ kind: "welcomeBack", score: 850, tier: 1 });
    }

    // — Tier 2 —

    // airdropOpportunity
    if (isAuthed && pendingAirdrops > 0) {
      candidates.push({ kind: "airdropOpportunity", score: 800, tier: 2 });
    }

    // settlingSoon: events ending in next 24h
    for (const ev of events) {
      if (!ev.end_date) continue;
      const endMs = new Date(ev.end_date).getTime();
      const secondsLeft = Math.floor((endMs - now) / 1000);
      if (secondsLeft > 0 && secondsLeft <= 24 * 3600) {
        const urgency = (24 - secondsLeft / 3600) * 10;
        candidates.push({
          kind: "settlingSoon",
          eventId: ev.id,
          secondsLeft,
          score: 600 + urgency,
          tier: 2,
        });
      }
    }

    // watchlistMove: not wired to real 24h delta yet — placeholder using volume
    // proxy so watched events bubble up. Real delta wiring lands with realtime
    // 24h-change feed.
    for (const ev of events) {
      if (!watchlist.has(ev.id)) continue;
      const vol = parseVolume(ev.volume);
      candidates.push({
        kind: "watchlistMove",
        eventId: ev.id,
        absChange: 0,
        score: 500 + Math.log10(Math.max(1, vol)) * 5,
        tier: 2,
      });
    }

    // — Tier 3 —

    // trending: every active event, scored by volume
    for (const ev of events) {
      const vol = parseVolume(ev.volume);
      candidates.push({
        kind: "trending",
        eventId: ev.id,
        volume: vol,
        score: 200 + Math.log10(Math.max(1, vol)) * 10,
        tier: 3,
      });
    }

    // newListing: created in last 48h
    for (const ev of events) {
      const createdMs = new Date(ev.created_at).getTime();
      const hoursAgo = (now - createdMs) / 3600_000;
      if (hoursAgo >= 0 && hoursAgo <= 48) {
        const decay = (48 - hoursAgo) / 48; // 1..0
        candidates.push({
          kind: "newListing",
          eventId: ev.id,
          score: 150 * decay + 100,
          tier: 3,
        });
      }
    }

    // learn: padding only
    for (const t of LEARN_TOPICS) {
      candidates.push({ kind: "learn", topicId: t, score: 50, tier: 3 });
    }

    // Sort by score desc
    candidates.sort((a, b) => b.score - a.score);

    // De-dupe events that appear under multiple kinds — keep highest-score one
    const seenEventKey = new Set<string>();
    const deduped: FeedItem[] = [];
    for (const c of candidates) {
      const evId =
        "eventId" in c ? c.eventId : "positionId" in c ? `pos:${c.positionId}` : null;
      if (evId) {
        if (seenEventKey.has(evId)) continue;
        seenEventKey.add(evId);
      }
      deduped.push(c);
    }

    // Tier 1 cap: keep at most 1
    const tier1Seen = { count: 0 };
    const afterTier1Cap = deduped.filter((c) => {
      if (c.tier === 1) {
        if (tier1Seen.count >= 1) return false;
        tier1Seen.count++;
      }
      return true;
    });

    // Total cap
    const cap = isAuthed ? 12 : 8;
    let result = afterTier1Cap.slice(0, cap);

    // Force first slot to be tier 1 or tier 2 — promote highest tier 2 if needed
    if (result.length > 0 && result[0].tier === 3) {
      const idx = result.findIndex((c) => c.tier === 2);
      if (idx > 0) {
        const [item] = result.splice(idx, 1);
        result.unshift(item);
      } else {
        // No tier 2 candidate — promote first trending visually
        const first = result[0];
        if (first.kind === "trending") {
          result[0] = { ...first, tier: 2 };
        }
      }
    }

    // Ensure learn items only appear when feed would otherwise be too short
    const nonLearn = result.filter((c) => c.kind !== "learn");
    if (nonLearn.length >= 8) {
      result = nonLearn.slice(0, cap);
    }

    // Same-kind degradation: 2nd+ consecutive same-kind → compact
    let prevKind: string | null = null;
    result = result.map((c) => {
      const compact = c.kind === prevKind;
      prevKind = c.kind;
      return compact ? { ...c, compact: true } : c;
    });

    return result;
  }, [isAuthed, state, events, positions, watchlist, pendingAirdrops, isLoading]);

  return { items, isLoading };
}

