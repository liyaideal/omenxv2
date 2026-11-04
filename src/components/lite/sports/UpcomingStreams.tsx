// ============================================================
// UPCOMING STREAMS — stream previews for the Sports category view
// (CPO 2026-11-04). A match that will be streamed and kicks off within
// 48h gets a preview card in the "Coming up on stream" rail:
//   page order = Live on stream (stage) → Coming up on stream (this rail)
//                → Playing now (live, no stream) → ledger.
// The rail shows whether or not anything is streaming right now — there is
// no preview stage. The ledger below is untouched (rows keep
// `Stream at kickoff`); a preview also stays in its ledger row.
// ============================================================
import { useEffect, useState } from "react";
import { getI18nLanguage, t } from "@/i18n";
import type { SportsMatch } from "./sportsData";
import { Crest } from "@/components/lite/shared/primitives";
import { PlayTriangle } from "./streamChips";

export const PREVIEW_WINDOW_MS = 48 * 3_600_000;
const ORANGE = "#FF8A3D";
const K = "events.screen.simple.sports_view.sports_streams";

/** Weekday in the viewer's language (`Fri`, `周五`, `금`…). */
const weekday = (d: Date) => d.toLocaleDateString(getI18nLanguage(), { weekday: "short" });

/** Streamed, not started, kicks off within 48h — soonest first; same kickoff → busier first. No cap on count. */
export const upcomingStreams = (rows: SportsMatch[], now: number = Date.now()) =>
  rows
    .filter(
      (m) =>
        !m.live &&
        !!m.streamUrl &&
        !!m.kickoff &&
        m.kickoff.getTime() > now &&
        m.kickoff.getTime() - now <= PREVIEW_WINDOW_MS,
    )
    .sort(
      (a, b) =>
        (a.kickoff as Date).getTime() - (b.kickoff as Date).getTime() || b.volume - a.volume,
    );

/** Re-render every second — countdowns under an hour tick in seconds. */
export const useNowTick = (frozen?: number) => {
  const [now, setNow] = useState(() => frozen ?? Date.now());
  useEffect(() => {
    if (frozen != null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [frozen]);
  return frozen ?? now;
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Countdown copy. < 1h → `38:12` (ticks every second, orange);
 * < 24h → `5h 19m`; otherwise the kickoff itself (`Tomorrow 19:14` / `Fri 19:00`).
 */
export const streamCountdown = (kickoff: Date, now: number) => {
  const ms = Math.max(0, kickoff.getTime() - now);
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h < 1) return { lead: t(`${K}.starts_in`), value: `${pad(m)}:${pad(s % 60)}`, soon: true };
  if (h < 24) return { lead: t(`${K}.starts_in`), value: `${h}h ${pad(m)}m`, soon: false };
  const today = new Date(now);
  const tmrw = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const day = kickoff.toDateString() === tmrw.toDateString() ? t(`${K}.tomorrow`) : weekday(kickoff);
  const time = kickoff.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { lead: t(`${K}.starts`), value: `${day} ${time}`, soon: false };
};

/** Card meta row kickoff: `Today 12:55` · `Tmrw 10:15` · `Fri 19:15`. */
export const kickoffShort = (kickoff: Date, now: number = Date.now()) => {
  const n = new Date(now);
  const day0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const k0 = new Date(kickoff.getFullYear(), kickoff.getMonth(), kickoff.getDate()).getTime();
  const diff = Math.round((k0 - day0) / 86_400_000);
  const day = diff === 0 ? t(`${K}.today`) : diff === 1 ? t(`${K}.tmrw`) : weekday(kickoff);
  const time = kickoff.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day} ${time}`;
};

/** Outline status pill on the poster — `▶ Stream`. */
const PosterTag = () => (
  <span
    className="inline-flex items-center"
    style={{
      gap: 6,
      padding: "3px 9px",
      borderRadius: 999,
      border: "1px solid rgba(255,138,61,.5)",
      background: "rgba(10,8,6,.55)",
      color: ORANGE,
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: ".14em",
      textTransform: "uppercase",
    }}
  >
    <PlayTriangle />
    {t(`${K}.stream_tag`)}
  </span>
);

/**
 * Poster — the stream placeholder before kickoff: crests face off over a warm
 * stage glow, the countdown is the hero number. 150 tall on vertical cards;
 * `fill` makes it take the card's height on the wide (1–2 cards) layout.
 */
export const StreamPoster = ({
  match,
  now,
  fill,
}: {
  match: SportsMatch;
  now: number;
  fill?: boolean;
}) => {
  const cd = streamCountdown(match.kickoff as Date, now);
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        height: fill ? "100%" : 150,
        minHeight: fill ? 150 : undefined,
        width: "100%",
        // Content clears the top-left tag (≈ 22px tall at a 10px inset).
        paddingTop: 30,
        gap: 8,
        background:
          "radial-gradient(120% 90% at 50% 0%, rgba(255,138,61,.20) 0%, rgba(255,138,61,0) 55%), linear-gradient(180deg, #17130F 0%, #0B0D10 100%)",
      }}
    >
      {/* faint pitch lines — "a broadcast will be here", without an image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 1px, transparent 1px 64px)",
          pointerEvents: "none",
        }}
      />
      <div className="absolute" style={{ left: 10, top: 10 }}>
        <PosterTag />
      </div>
      <div className="relative flex items-center" style={{ gap: 14 }}>
        <Crest abbr={match.homeAbbr} size={40} />
        <span
          className="font-display"
          style={{ fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 700, letterSpacing: ".14em" }}
        >
          VS
        </span>
        <Crest abbr={match.awayAbbr} size={40} />
      </div>
      <div className="relative flex flex-col items-center" style={{ gap: 3 }}>
        <span
          style={{ fontSize: 9, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", fontWeight: 700 }}
        >
          {cd.lead}
        </span>
        <span
          className="font-display"
          style={{ fontSize: 22, fontWeight: 700, color: cd.soon ? ORANGE : "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1.05 }}
        >
          {cd.value}
        </span>
      </div>
    </div>
  );
};

const Bell = ({ on }: { on: boolean }) =>
  on ? (
    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );

/**
 * Remind me ⇄ Reminder set. State comes from useStreamReminders (one row in
 * stream_reminders per user × event); at kickoff the reminder becomes a
 * `system.stream_live` notification. Tapping again removes it.
 */
export const RemindButton = ({
  on,
  onToggle,
  height = 38,
}: {
  on: boolean;
  onToggle: () => void;
  /** The button is a full-width row in a column card: the card stretches it, never `flex: 1`. */
  height?: number;
}) => (
  <button
    type="button"
    aria-pressed={on}
    data-remind=""
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className="flex items-center justify-center"
    style={{
      height,
      flex: "none",
      padding: "0 14px",
      gap: 7,
      borderRadius: 10,
      border: `1px solid ${on ? "rgba(255,138,61,.5)" : "#2A2E36"}`,
      background: on ? "rgba(255,138,61,.1)" : "transparent",
      color: on ? ORANGE : "#E6E8EB",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    <Bell on={on} />
    {on ? t(`${K}.reminder_set`) : t(`${K}.remind_me`)}
  </button>
);
