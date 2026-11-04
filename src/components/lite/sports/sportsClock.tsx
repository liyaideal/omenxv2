// ============================================================
// SPORTS CLOCK — what a sports fixture shows where other events
// show a trading countdown (CPO 2026-11-04).
//   upcoming  Starts in 2h 10m        (countdown to kickoff — accurate)
//   live      ● LIVE · P2 12:04       (match clock; ● LIVE alone if none)
//   final     Final · In review       (trading closed, result pending)
//   settled   Settled
// The estimated end (end_date) is never shown and never reaches 00:00 —
// a match is over only when the feed says so (matchPhase, sportsData.ts).
// Used by: Lite order card + mobile order drawer, Pro header (desktop +
// mobile), event selector rows. Non-sports events keep their countdown.
// ============================================================
import { useEffect, useState } from "react";
import { t } from "@/i18n";
import {
  fixtureKickoffMs,
  fixtureMeta,
  isSportsFixture,
  liveLabelFor,
  liveMinute,
  matchPhase,
  type MatchPhase,
} from "./sportsData";

const K = "events.screen.simple.sports_clock";
const pad = (n: number) => String(n).padStart(2, "0");

export interface SportsClock {
  phase: MatchPhase;
  /** ms until kickoff (0 once started). */
  kickoffInMs: number;
  /** Scoreboard clock (`P2 12:04`, `Q3 8:42`, `63'`, `Map 2`) — null when the feed has none. */
  liveClock: string | null;
}

type ClockInput = Parameters<typeof matchPhase>[0] & { metadata?: unknown };

export const sportsClockAt = (event: ClockInput | null | undefined, now: number = Date.now()): SportsClock | null => {
  if (!event || !isSportsFixture(event)) return null;
  const phase = matchPhase(event, now);
  if (!phase) return null;
  const kickoff = fixtureKickoffMs(event);
  const meta = fixtureMeta(event);
  return {
    phase,
    kickoffInMs: Number.isFinite(kickoff) ? Math.max(0, kickoff - now) : 0,
    liveClock:
      phase === "live"
        ? liveLabelFor(meta, liveMinute(Number.isFinite(kickoff) ? new Date(kickoff) : null, meta.sport))
        : null,
  };
};

/** Ticks every second; null for any non-sports event (callers keep their countdown). */
export const useSportsClock = (event: ClockInput | null | undefined): SportsClock | null => {
  const sports = !!event && isSportsFixture(event);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!sports) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sports]);
  return sports ? sportsClockAt(event, now) : null;
};

/** Lite wording: `2d 19h` · `2h 10m` · `38:12`. */
export const kickoffInShort = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return `${pad(m)}:${pad(s % 60)}`;
};

/** Pro wording: `02:10:00`, `2d 03:10:00` past a day. */
export const kickoffInClock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86_400);
  const hms = `${pad(Math.floor((s % 86_400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  return d > 0 ? `${d}d ${hms}` : hms;
};

/** Plain text, for one-line slots (mobile drawer, mobile Pro header). */
export const sportsClockText = (c: SportsClock, style: "lite" | "pro" = "lite"): string => {
  if (c.phase === "upcoming")
    return t(`${K}.starts_in`, { time: style === "pro" ? kickoffInClock(c.kickoffInMs) : kickoffInShort(c.kickoffInMs) });
  if (c.phase === "live") return c.liveClock ? `${t("common.live")} · ${c.liveClock}` : t("common.live");
  if (c.phase === "final") return `${t(`${K}.final`)} · ${t(`${K}.in_review`)}`;
  return t(`${K}.settled`);
};

const Dot = () => (
  <span aria-hidden className="inline-block h-1.5 w-1.5 flex-none rounded-full bg-trading-red animate-pulse" />
);

/**
 * The status slot itself. `variant="card"` = Lite order card header (right
 * side); `"line"` = inline in a sentence (mobile drawer); `"header"` = Pro
 * title row (sits after `Winner ·`).
 */
export const SportsClockLabel = ({
  clock,
  variant,
}: {
  clock: SportsClock;
  variant: "card" | "line" | "header";
}) => {
  if (clock.phase === "upcoming") {
    return variant === "header" ? (
      <span className="inline-flex items-center gap-1.5">
        <span>{t(`${K}.starts_in_lead`)}</span>
        <span className="font-mono font-medium text-foreground">{kickoffInClock(clock.kickoffInMs)}</span>
      </span>
    ) : (
      <span className={variant === "card" ? "font-mono text-[11px] text-muted-foreground" : undefined}>
        {t(`${K}.starts_in`, { time: kickoffInShort(clock.kickoffInMs) })}
      </span>
    );
  }
  if (clock.phase === "live") {
    return (
      <span
        className={
          variant === "header"
            ? "inline-flex items-center gap-1.5"
            : "inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground"
        }
      >
        {/* The Pro title row already leads with its own pulse dot. */}
        {variant !== "header" && <Dot />}
        <span className={variant === "header" ? undefined : "uppercase tracking-[0.04em]"}>{t("common.live")}</span>
        {clock.liveClock && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono font-medium text-foreground">{clock.liveClock}</span>
          </>
        )}
      </span>
    );
  }
  if (clock.phase === "final") {
    return variant === "card" ? (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        {t(`${K}.final`)} ·
        <span className="rounded-full border border-border px-2 py-px text-[10px] uppercase tracking-[0.04em]">
          {t(`${K}.in_review`)}
        </span>
      </span>
    ) : (
      <span>
        {t(`${K}.final`)} · {t(`${K}.in_review`)}
      </span>
    );
  }
  return <span>{t(`${K}.settled`)}</span>;
};

/** Event selector "Ends in" cell for a sports row: `Starts 2d 19h` · `● Live` · `Final`. */
export const SportsClockCell = ({ clock, compact }: { clock: SportsClock; compact?: string }) => {
  if (clock.phase === "live") {
    return (
      <span className="inline-flex items-center justify-end gap-1.5 font-semibold text-foreground">
        <Dot />
        {t(`${K}.live_word`)}
      </span>
    );
  }
  if (clock.phase === "upcoming") {
    // Lists tick once a minute — under an hour say minutes, not a frozen mm:ss.
    const time =
      compact ??
      (clock.kickoffInMs < 3_600_000 ? `${Math.max(1, Math.ceil(clock.kickoffInMs / 60_000))}m` : kickoffInShort(clock.kickoffInMs));
    return <span className="text-muted-foreground">{t(`${K}.starts`, { time })}</span>;
  }
  if (clock.phase === "final") return <span className="text-muted-foreground">{t(`${K}.final`)}</span>;
  return <span className="text-muted-foreground">{t(`${K}.settled`)}</span>;
};
