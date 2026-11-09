// ============================================================
// ListStreamVideo — the muted inline player used by the Sports
// category view's live-stream stage (desktop + mobile).
// One player per page: the stage swaps `src`, it never mounts a
// second <video>. Score never renders here — the panel next to /
// under the video owns it (one number, one renderer).
// Off screen or in a background tab the player pauses (no data
// burnt on a picture nobody sees); back in view it resumes at the
// live edge. error / forbidden → onFail, and the stage drops that
// stream (CPO 2026-11-04).
// ============================================================
import { useEffect, useRef } from "react";
import { useHlsVideo } from "@/hooks/useHlsVideo";
import { t } from "@/i18n";
import { PlayTriangle } from "./streamChips";

const K = "events.screen.simple.sports_view.sports_streams";

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
  onFail,
  compact,
  fixture,
  preview,
}: {
  src: string;
  onOpen: () => void;
  /** The stream can't play (error / forbidden) — the stage takes it off. */
  onFail?: () => void;
  compact?: boolean;
  /** Style-guide only: freeze the player in one state, no HLS attached. Not passed in production. */
  fixture?: "loading" | "blocked" | "error";
  /** Home page stage (rules S2 / S3 ②): a muted picture with no controls — no mute
   *  button, no play button; the whole box opens the match. Not passed = Sports view, unchanged. */
  preview?: boolean;
}) => {
  const hls = useHlsVideo(src, !fixture);
  const { ref, muted, setMuted, play, pause } = hls;
  const state = fixture ?? hls.state;
  const busy = state === "idle" || state === "loading" || state === "buffering";
  const boxRef = useRef<HTMLDivElement>(null);

  // Report a dead stream once. The stage keys this player by match, so a new
  // stream always starts from a fresh state.
  const failedRef = useRef(false);
  useEffect(() => {
    if ((state === "error" || state === "forbidden") && !failedRef.current) {
      failedRef.current = true;
      onFail?.();
    }
  }, [state, onFail]);

  // Pause while off screen / in a background tab; resume at the live edge.
  useEffect(() => {
    const box = boxRef.current;
    if (fixture || !box) return;
    let inView = true;
    const video = () => box.querySelector("video");
    const apply = () => {
      if (inView && !document.hidden) play();
      else pause();
    };
    // Autoplay can start after we already decided to hold it.
    const holdIfHidden = () => {
      if (!inView || document.hidden) video()?.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting === inView) return;
      inView = e.isIntersecting;
      apply();
    });
    io.observe(box);
    document.addEventListener("visibilitychange", apply);
    const v = video();
    v?.addEventListener("playing", holdIfHidden);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
      v?.removeEventListener("playing", holdIfHidden);
    };
  }, [fixture, play, pause]);

  return (
    <div
      ref={boxRef}
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
        <LivePill label={t("common.live")} />
      </div>
      {!preview && (
      <div className="absolute flex items-center" style={{ right: compact ? 10 : 14, bottom: compact ? 10 : 14, gap: 8 }}>
        <RoundBtn
          label={muted ? t(`${K}.unmute`) : t(`${K}.mute`)}
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
      )}
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
      {!preview && (state === "blocked" || state === "paused") && (
        <button
          type="button"
          aria-label={t(`${K}.play`)}
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
