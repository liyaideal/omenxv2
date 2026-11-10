/**
 * ProWatchLive — "▶ Watch live" on the Pro contract terminal header (CPO 2026-11-10, S5).
 *
 * The Pro terminals have no stream player; live streams live on the Lite trade page. When the
 * match on screen is live AND has a stream, the header status line ends with this pill. It does
 * what every play button does (`usePlayStream`): opens `/trade?event=<match>&play=1`, which renders
 * the Lite trade page and starts the stream — the reader's saved view (Pro) is not changed, and
 * choosing Pro on the switch there brings the terminal back (SurfaceWatchOverride).
 *
 * Shown only when live + stream (same condition as the Lite stage's picture); before kick-off, or
 * live without a stream, nothing renders. Visual = the approved canvas (orange, tinted, 22px pill).
 */
import { useT } from "@/i18n";
import { ChevronDown } from "lucide-react";
import { usePlayStream } from "@/hooks/usePlayStream";
import { fixtureMeta } from "@/components/lite/sports/sportsData";
import { SportsClockLabel, type SportsClock } from "@/components/lite/sports/sportsClock";

const ORANGE = "#FF8A3D";

export const proWatchLiveTarget = (
  match: { id: string; metadata?: unknown } | null | undefined,
  phase: string | null | undefined,
): string | null => {
  if (!match || phase !== "live") return null;
  return fixtureMeta(match).stream_url ? match.id : null;
};

export const ProWatchLive = ({
  eventId,
  onPlay,
}: {
  /** The match (winner event) to open; null = render nothing. */
  eventId: string | null;
  /** Style-guide only — replaces navigation so the frame stays put. */
  onPlay?: () => void;
}) => {
  const play = usePlayStream();
  const { t } = useT(); // re-render when the language catalog arrives
  if (!eventId) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onPlay) onPlay();
        else play(eventId);
      }}
      className="flex-shrink-0 hover:brightness-125 transition-[filter]"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 22,
        padding: "0 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,138,61,.45)",
        background: "rgba(255,138,61,.10)",
        color: ORANGE,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill={ORANGE} aria-hidden="true">
        <path d="M6 4l14 8-14 8z" />
      </svg>
      {t("events.screen.simple.sports_view.sports_streams.watch_live")}
    </button>
  );
};

/** Desktop placement: after the event-picker button, its middle on the status line (not inside the button). */
export const ProHeaderWatchLive = ({ eventId, onPlay }: { eventId: string | null; onPlay?: () => void }) =>
  eventId ? (
    <div className="self-end pb-[1px] -ml-1">
      <ProWatchLive eventId={eventId} onPlay={onPlay} />
    </div>
  ) : null;

/** Phone placement: in the header stats row after the clock (row gap 16 → 10 to the clock, as approved). */
export const ProMobileWatchLive = ({ eventId, onPlay }: { eventId: string | null; onPlay?: () => void }) =>
  eventId ? (
    <span style={{ marginLeft: -6, display: "inline-flex" }}>
      <ProWatchLive eventId={eventId} onPlay={onPlay} />
    </span>
  ) : null;

/**
 * The Pro desktop terminal title block (inside the event-picker button): event name + chevron, then the
 * status line — red dot while live / not sports, the line caption, then the sports clock or "Ends in".
 * Shared by DesktopTrading and the style-guide frames (Pro 页头 · Watch live).
 */
export const ProEventTitleBlock = ({
  name,
  open,
  caption,
  sportsClock,
  countdown,
}: {
  name: string;
  open: boolean;
  caption?: string | null;
  sportsClock: SportsClock | null;
  countdown: string;
}) => {
  const { t } = useT();
  return (
  <div className="min-w-0">
    <div className="flex items-center gap-2">
      <span className="font-semibold text-foreground truncate">{name}</span>
      <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
    </div>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
      {(!sportsClock || sportsClock.phase === "live") && (
        <span className="w-1.5 h-1.5 bg-trading-red rounded-full animate-pulse" />
      )}
      {caption && (
        <>
          <span className="text-foreground/80">{caption}</span>
          <span>·</span>
        </>
      )}
      {sportsClock ? (
        <SportsClockLabel clock={sportsClock} variant="header" />
      ) : (
        <>
          <span>{t("market.ends_in")}</span>
          <span className="text-trading-red font-mono font-medium">{countdown}</span>
        </>
      )}
    </div>
  </div>
  );
};

/**
 * Desktop header lead: the event-picker button (title block) followed by "▶ Watch live" when there is a
 * stream. DesktopTrading mounts it inside its header row; the style-guide frames PW-1…3 mount the same.
 */
export const ProEventHeaderLead = ({
  name,
  open,
  onToggle,
  caption,
  sportsClock,
  countdown,
  watchEventId,
  onPlay,
}: {
  name: string;
  open: boolean;
  onToggle: () => void;
  caption?: string | null;
  sportsClock: SportsClock | null;
  countdown: string;
  watchEventId: string | null;
  onPlay?: () => void;
}) => (
  <>
    <button
      onClick={onToggle}
      className="flex items-center gap-2 min-w-0 hover:bg-muted/30 rounded-lg p-1 transition-colors"
      data-event-dropdown-trigger
      aria-expanded={open}
      aria-haspopup="listbox"
    >
      <ProEventTitleBlock name={name} open={open} caption={caption} sportsClock={sportsClock} countdown={countdown} />
    </button>
    <ProHeaderWatchLive eventId={watchEventId} onPlay={onPlay} />
  </>
);
