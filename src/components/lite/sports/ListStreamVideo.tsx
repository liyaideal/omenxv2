// ============================================================
// ListStreamVideo — the muted inline player used by the Sports
// category view's live-stream stage (desktop + mobile).
// One player per page: the stage swaps `src`, it never mounts a
// second <video>. Score never renders here — the panel next to /
// under the video owns it (one number, one renderer).
// ============================================================
import { useHlsVideo } from "@/hooks/useHlsVideo";
import { PlayTriangle } from "./streamChips";

const ORANGE = "#FF8A3D";
const INK = "#2A1200";

const LivePill = ({ label }: { label: string }) => (
  <span
    className="inline-flex items-center"
    style={{ gap: 6, background: ORANGE, borderRadius: 999, padding: "3px 9px" }}
  >
    <i
      style={{
        width: 5,
        height: 5,
        borderRadius: 999,
        background: INK,
        display: "block",
        animation: "lsv-bl 1.6s ease-in-out infinite",
      }}
    />
    <b style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: INK, lineHeight: 1.2 }}>
      {label}
    </b>
  </span>
);

const RoundBtn = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="flex items-center justify-center"
    style={{
      width: 32,
      height: 32,
      borderRadius: 999,
      background: "rgba(8,10,13,.62)",
      border: "1px solid rgba(255,255,255,.14)",
      color: "#fff",
      backdropFilter: "blur(6px)",
    }}
  >
    {children}
  </button>
);

export const ListStreamVideo = ({
  src,
  onOpen,
  compact,
  fixture,
}: {
  src: string;
  onOpen: () => void;
  compact?: boolean;
  /** Style-guide only: freeze the player in one state, no HLS attached. Not passed in production. */
  fixture?: "loading" | "blocked";
}) => {
  const hls = useHlsVideo(src, !fixture);
  const { ref, muted, setMuted, play } = hls;
  const state = fixture ?? hls.state;
  const busy = state === "idle" || state === "loading" || state === "buffering";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      className="relative cursor-pointer overflow-hidden"
      style={{ aspectRatio: "16 / 9", background: "#06080B", width: "100%" }}
    >
      <video
        ref={ref}
        playsInline
        loop
        muted={muted}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* top scrim keeps the pill legible on bright frames */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 70%, rgba(0,0,0,.5) 100%)",
          pointerEvents: "none",
        }}
      />
      <div className="absolute flex items-center" style={{ left: compact ? 10 : 14, top: compact ? 10 : 14, gap: 8 }}>
        <LivePill label="LIVE" />
      </div>
      <div className="absolute flex items-center" style={{ right: compact ? 10 : 14, bottom: compact ? 10 : 14, gap: 8 }}>
        <RoundBtn
          label={muted ? "Unmute" : "Mute"}
          onClick={(e) => {
            e.stopPropagation();
            setMuted(!muted);
          }}
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" />}
          </svg>
        </RoundBtn>
      </div>
      {busy && (
        <span
          className="absolute"
          style={{
            left: "50%",
            top: "50%",
            width: 26,
            height: 26,
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,.18)",
            borderTopColor: "#fff",
            transform: "translate(-50%,-50%)",
            animation: "lsv-sp .9s linear infinite",
          }}
        />
      )}
      {(state === "blocked" || state === "paused") && (
        <button
          type="button"
          aria-label="Play"
          onClick={(e) => {
            e.stopPropagation();
            play();
          }}
          className="absolute flex items-center justify-center"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 52,
            height: 52,
            borderRadius: 999,
            background: ORANGE,
            color: INK,
          }}
        >
          <PlayTriangle />
        </button>
      )}
      <style>{`@keyframes lsv-bl{0%,100%{opacity:1}50%{opacity:.25}}@keyframes lsv-sp{to{transform:translate(-50%,-50%) rotate(360deg)}}`}</style>
    </div>
  );
};

export default ListStreamVideo;
