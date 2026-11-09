// ============================================================
// StreamPreview — "tap to watch" picture for a live stream (CPO 2026-11-09,
// canvas「直播：点了才播」R1, option C). Used by the home stage and the Sports
// view stage, desktop + phone. It never touches the stream: one still (the
// server's 10-minute snapshot → the event cover → a dark stage), dimmed, an
// orange LIVE pill and an orange play button "Watch live". The whole box is the
// button; what it does is the caller's (usePlayStream: signed in → trade page
// plays; guest → sign in first).
// ============================================================
import { t } from "@/i18n";
import { streamPicture, type StreamPictureInput } from "./streamPicture";

const ORANGE = "#FF8A3D";
const INK = "#2A1200";
const K = "events.screen.simple.sports_view.sports_streams";

export const StreamPreview = ({
  match,
  onPlay,
  compact,
  nowMs,
  radius = 0,
  fixture,
}: {
  match: StreamPictureInput;
  onPlay: () => void;
  /** Phone / narrow column: smaller pill, button and label. */
  compact?: boolean;
  /** Style-guide: freeze the 10-minute window. Absent ⇒ wall clock. */
  nowMs?: number;
  radius?: number;
  /** Style-guide only: force the fallback picture (no snapshot → cover; no cover → dark). Not passed in production. */
  fixture?: "cover" | "none";
}) => {
  const pic = fixture
    ? fixture === "cover"
      ? { kind: "cover" as const, src: match.coverUrl || "/card-bg/sports.jpg" }
      : { kind: "none" as const }
    : streamPicture(match, nowMs ?? Date.now());
  const btn = compact ? 48 : 64;
  const label = t(`${K}.watch_live`);
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={label}
      data-stream-preview={pic.kind}
      className="relative block w-full overflow-hidden"
      style={{
        aspectRatio: "16 / 9",
        borderRadius: radius,
        border: 0,
        padding: 0,
        cursor: "pointer",
        color: "inherit",
        background:
          pic.kind === "none"
            ? "radial-gradient(120% 95% at 50% 45%, #1A2130 0%, #0E1218 55%, #090B0F 100%)"
            : "#000",
      }}
    >
      {pic.kind !== "none" && (
        <img
          src={pic.src}
          alt=""
          loading="lazy"
          draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      {pic.kind !== "none" && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.55) 100%)",
          }}
        />
      )}
      <span
        className="absolute inline-flex items-center"
        style={{
          left: compact ? 10 : 14,
          top: compact ? 10 : 14,
          gap: 6,
          background: ORANGE,
          borderRadius: 999,
          padding: "3px 9px",
        }}
      >
        <i style={{ width: 5, height: 5, borderRadius: 999, background: INK, display: "block" }} />
        <b style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: INK, lineHeight: 1.2 }}>
          {t("common.live")}
        </b>
      </span>
      <span
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ gap: compact ? 8 : 12 }}
      >
        <span
          className="grid place-items-center"
          style={{
            width: btn,
            height: btn,
            borderRadius: 999,
            background: ORANGE,
            boxShadow: "0 0 0 6px rgba(255,138,61,.16), 0 8px 24px rgba(255,138,61,.35)",
          }}
        >
          <svg viewBox="0 0 24 24" width={compact ? 22 : 28} height={compact ? 22 : 28} aria-hidden>
            <path d="M8 5.5v13l11-6.5z" fill={INK} />
          </svg>
        </span>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: compact ? 13 : 15,
            letterSpacing: ".02em",
            color: "#fff",
            textShadow: "0 1px 6px rgba(0,0,0,.6)",
          }}
        >
          {label}
        </span>
      </span>
    </button>
  );
};

export default StreamPreview;
