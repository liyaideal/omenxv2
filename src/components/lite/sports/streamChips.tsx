// ============================================================
// SPORTS · STREAM ENTRY CHIPS — one implementation for every list
// surface (home Sports card, Sports category view desktop + mobile).
// Solid orange = actionable ("Watch live", match is on now).
// Outlined grey = status only ("Stream at kickoff", not started yet).
// Rendered only when the match carries metadata.stream_url.
// ============================================================
import { MUTED, ORANGE } from "@/components/lite/home/homeShell";
import { t } from "@/i18n";

const SK = "events.screen.simple.sports_view.sports_streams";

const INK = "#2A1200";

/** 9px play triangle used by the Watch live / Stream at kickoff chips. */
export const PlayTriangle = () => (
  <svg
    viewBox="0 0 24 24"
    width={9}
    height={9}
    fill="currentColor"
    style={{ display: "block", flex: "none" }}
  >
    <path d="M7 4v16l13-8z" />
  </svg>
);

/** Solid = actionable. Desktop live-card chip (meta row, stream only). */
export const WatchLiveChip = ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="font-display"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: ".04em",
      borderRadius: 999,
      padding: "2px 9px",
      background: ORANGE,
      color: INK,
      border: "none",
      flex: "none",
    }}
  >
    <PlayTriangle />
    {t(`${SK}.watch_live`)}
  </button>
);

/** Outlined = status, not actionable. Pre-kickoff rows with a stream. */
export const StreamAtKickoffChip = () => (
  <span
    className="font-display"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: ".04em",
      borderRadius: 999,
      padding: "1px 8px",
      border: "1px solid rgba(148,163,184,.26)",
      color: MUTED,
      flex: "none",
    }}
  >
    <PlayTriangle />
    {t(`${SK}.stream_at_kickoff`)}
  </span>
);

/**
 * Mobile stream button. Visual circle stays the spec size; a transparent
 * inset:-8 child expands the touch area to ~44x44 without changing the
 * painted geometry. `placement="corner"` pins it top-right of a relative
 * card (home card); `"inline"` sits at the end of a flex row (Sports view,
 * where the card's top-right already holds the live clock / kickoff row).
 */
export const MobileStreamButton = ({
  size,
  solid,
  label,
  onClick,
  placement = "corner",
}: {
  size: number;
  solid: boolean;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  placement?: "corner" | "inline";
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    style={{
      position: placement === "corner" ? "absolute" : "relative",
      right: placement === "corner" ? 10 : undefined,
      top: placement === "corner" ? 10 : undefined,
      width: size,
      height: size,
      flex: "none",
      borderRadius: 999,
      background: solid ? ORANGE : "transparent",
      border: solid ? "none" : "1px solid rgba(148,163,184,.3)",
      color: solid ? INK : MUTED,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
    }}
  >
    <span style={{ position: "absolute", inset: -8 }} />
    <PlayTriangle />
  </button>
);
