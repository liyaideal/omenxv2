// ============================================================
// LiveStage — the live video surface above the matchboard.
// Nine states (S1–S9) per the approved canvas. No score lives
// here: the matchboard below owns it, and one number must not
// have two renderers.
// Collapsed / unmounted means the <video> is gone, not hidden —
// a hidden video keeps burning bandwidth.
// ============================================================
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHlsVideo } from "@/hooks/useHlsVideo";
import { fixtureMeta, isFixtureLive } from "./sportsData";

const MONO = "'Space Grotesk', ui-monospace, SFMono-Regular, monospace";
const COLLAPSE_KEY = "omenx.lite.stage.collapsed";

export interface StageEvent {
  id: string;
  is_resolved?: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
  metadata?: unknown;
}

/** Style-guide only. Never passed in production. */
export type StageFixture =
  | "playing"
  | "loading"
  | "buffering"
  | "paused"
  | "blocked"
  | "prekick"
  | "error"
  | "forbidden"
  | "finished";

const Pill = ({ small }: { small?: boolean }) => (
  <span
    className="inline-flex items-center"
    style={{
      gap: small ? 5 : 6,
      background: "#FF8A3D",
      borderRadius: 999,
      padding: small ? "3px 7px" : "3px 8px",
    }}
  >
    <i
      style={{
        width: small ? 4 : 5,
        height: small ? 4 : 5,
        borderRadius: 999,
        background: "#2A1200",
        display: "block",
        fontStyle: "normal",
        animation: "stage-bl 1.6s ease-in-out infinite",
      }}
    />
    <b
      style={{
        fontSize: small ? 9 : 9.5,
        fontWeight: 700,
        letterSpacing: small ? ".14em" : ".16em",
        color: "#2A1200",
        lineHeight: 1.2,
      }}
    >
      LIVE
    </b>
  </span>
);

const Glass = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => (
  <span
    className="inline-flex items-center"
    style={{
      gap: 6,
      background: "rgba(0,0,0,.58)",
      border: "1px solid rgba(255,255,255,.14)",
      backdropFilter: "blur(6px)",
      borderRadius: 999,
      padding: "4px 9px",
    }}
  >
    <span
      style={
        mono
          ? { fontFamily: MONO, fontSize: 12, fontWeight: 600, color: "#fff", fontVariantNumeric: "tabular-nums" }
          : { fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.72)", fontWeight: 600 }
      }
    >
      {children}
    </span>
  </span>
);

const Ring = ({ size }: { size: number }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%,-50%)",
      width: size,
      height: size,
      borderRadius: 999,
      border: "2px solid rgba(255,255,255,.18)",
      borderTopColor: "#FF8A3D",
      zIndex: 2,
      animation: "stage-sp 1s linear infinite",
    }}
  />
);

/** Center control. `variant`: pause bars | play triangle | play on orange. */
const CenterBtn = ({
  variant,
  size,
  onClick,
}: {
  variant: "pause" | "play" | "playInk";
  size: number;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={variant === "pause" ? "Pause" : "Play"}
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%,-50%)",
      width: size,
      height: size,
      borderRadius: 999,
      background: variant === "playInk" ? "rgba(255,138,61,.92)" : "rgba(10,11,13,.55)",
      border: `1px solid ${variant === "playInk" ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.28)"}`,
      display: "grid",
      placeItems: "center",
      zIndex: 2,
      padding: 0,
      cursor: "pointer",
    }}
  >
    {variant === "pause" ? (
      <span
        style={{
          width: 13,
          height: 15,
          borderLeft: "4px solid #fff",
          borderRight: "4px solid #fff",
        }}
      />
    ) : (
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: `14px solid ${variant === "playInk" ? "#2A1200" : "#fff"}`,
          borderTop: "9px solid transparent",
          borderBottom: "9px solid transparent",
          marginLeft: 4,
        }}
      />
    )}
  </button>
);

const UnderText = ({ children, bright }: { children: React.ReactNode; bright?: boolean }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      bottom: 14,
      transform: "translateX(-50%)",
      zIndex: 3,
      fontSize: 10,
      letterSpacing: ".1em",
      textTransform: "uppercase",
      color: bright ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.55)",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

const Fail = ({ title, sub }: { title: string; sub: string }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      zIndex: 3,
      textAlign: "center",
      padding: "0 16px",
    }}
  >
    <div style={{ fontSize: 13, fontWeight: 600, color: "#C9D1DA" }}>{title}</div>
    <div style={{ fontSize: 11.5, color: "#6B727C" }}>{sub}</div>
  </div>
);

const MuteBtn = ({ muted, onClick, small }: { muted: boolean; onClick: () => void; small?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={muted ? "Unmute" : "Mute"}
    style={{
      width: small ? 24 : 28,
      height: small ? 24 : 28,
      borderRadius: 999,
      background: "rgba(0,0,0,.55)",
      border: "1px solid rgba(255,255,255,.18)",
      display: "grid",
      placeItems: "center",
      color: "#fff",
      padding: 0,
      cursor: "pointer",
    }}
  >
    <svg
      viewBox="0 0 24 24"
      style={{
        width: small ? 12 : 13,
        height: small ? 12 : 13,
        stroke: "currentColor",
        fill: "none",
        strokeWidth: 1.7,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        display: "block",
      }}
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14" />}
    </svg>
  </button>
);

/** "2h 14m" / "5d 4h" — the tail of "Stream starts at kickoff · in …". */
const untilText = (ms: number): string => {
  const mins = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
};

export const LiveStage = ({
  event,
  fixture,
}: {
  event: StageEvent;
  fixture?: StageFixture;
}) => {
  const isMobile = useIsMobile();
  const meta = fixtureMeta(event);
  const src = meta.stream_url || null;
  const now = Date.now();
  const live = isFixtureLive(event, now);
  const kickoff = meta.kickoff_at
    ? new Date(meta.kickoff_at).getTime()
    : event.start_date
      ? new Date(event.start_date).getTime()
      : NaN;
  const finished =
    !!event.is_resolved ||
    (!!event.end_date && new Date(event.end_date).getTime() <= now);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // The video only attaches while the stage is actually on screen and
  // the match is in play. Everything else unmounts it.
  const wantVideo = !fixture && !!src && live && !collapsed;
  const { ref, state, muted, setMuted, play, pause } = useHlsVideo(src, wantVideo);

  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (isMobile === undefined) return null;
  // S9 — the broadcast is over. The stage leaves; the matchboard stays.
  if (!fixture && (finished || !src)) return null;
  if (fixture === "finished") {
    // Style-guide only: show what the reader would otherwise never see.
    return (
      <StageShell isMobile={isMobile}>
        <Fail title="Match finished" sub="Stage unmounts · matchboard stays" />
      </StageShell>
    );
  }

  const prekick = fixture ? fixture === "prekick" : !live && Number.isFinite(kickoff) && kickoff > now;
  const s: string = fixture ?? (prekick ? "prekick" : state);

  const dark = s === "prekick" || s === "error" || s === "forbidden";

  return (
    <div>
      {isMobile && !fixture && collapsed ? null : (
        <StageShell isMobile={isMobile} dark={dark}>
          {!fixture && wantVideo ? (
          <video
            ref={ref}
            playsInline
            loop
            muted={muted}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 1,
              }}
            />
          ) : null}

          {!dark ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: isMobile ? 10 : 16,
                  top: isMobile ? 10 : 16,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  zIndex: 2,
                }}
              >
                <Pill small={isMobile} />
                {!isMobile && meta.league ? <Glass>{meta.league}</Glass> : null}
              </div>
              {meta.segment_index != null ? (
                <div
                  style={{
                    position: "absolute",
                    right: isMobile ? 10 : 16,
                    top: isMobile ? 10 : 16,
                    zIndex: 2,
                  }}
                >
                  <Glass mono>
                    {(meta.segments_key || "").startsWith("UFC") ? "Round" : "Map"} {meta.segment_index}
                  </Glass>
                </div>
              ) : null}
            </>
          ) : null}

          {s === "loading" ? <Ring size={34} /> : null}
          {s === "buffering" ? (
            <>
              <Ring size={26} />
              <UnderText>Buffering</UnderText>
            </>
          ) : null}
          {s === "playing" ? (
            <CenterBtn variant="pause" size={isMobile ? 44 : 56} onClick={pause} />
          ) : null}
          {s === "paused" ? (
            <>
              <CenterBtn variant="play" size={isMobile ? 44 : 56} onClick={play} />
              <UnderText>Paused · behind live</UnderText>
            </>
          ) : null}
          {s === "blocked" ? (
            <>
              <CenterBtn variant="playInk" size={isMobile ? 44 : 56} onClick={play} />
              <UnderText bright>Tap to play</UnderText>
            </>
          ) : null}
          {s === "prekick" ? (
            <Fail
              title="Stream starts at kickoff"
              sub={Number.isFinite(kickoff) ? untilText(kickoff - now) : ""}
            />
          ) : null}
          {s === "error" ? (
            <Fail title="Stream unavailable" sub="Scores keep updating below" />
          ) : null}
          {s === "forbidden" ? (
            <Fail title="Not available in your region" sub="Scores keep updating below" />
          ) : null}

          {!dark ? (
            isMobile ? (
              <div style={{ position: "absolute", right: 10, bottom: 10, zIndex: 2 }}>
                <MuteBtn small muted={muted} onClick={() => setMuted(!muted)} />
              </div>
            ) : (
              <div
                style={{
                  position: "absolute",
                  right: 16,
                  bottom: 16,
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 8,
                }}
              >
                <span
                  className="inline-flex items-center"
                  style={{
                    gap: 6,
                    background: "rgba(0,0,0,.45)",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: 6,
                    padding: "3px 7px",
                    fontSize: 9.5,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.6)",
                  }}
                >
                  Stream is delayed. Prices are not.
                </span>
                <MuteBtn muted={muted} onClick={() => setMuted(!muted)} />
              </div>
            )
          ) : null}
        </StageShell>
      )}

      {isMobile && !fixture ? (
        <FoldToggle collapsed={collapsed} onClick={toggle} />
      ) : null}
    </div>
  );
};

const StageShell = ({
  isMobile,
  dark,
  children,
}: {
  isMobile: boolean;
  dark?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={isMobile ? "w-full" : "w-full max-w-[828px]"}
    style={{
      position: "relative",
      border: "1px solid #1D2026",
      borderRadius: 12,
      overflow: "hidden",
      background: "#000",
    }}
  >
    <style>{`@keyframes stage-bl{0%,100%{opacity:1}50%{opacity:.25}}@keyframes stage-sp{to{transform:translate(-50%,-50%) rotate(360deg)}}`}</style>
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: dark
          ? "#0C0F13"
          : "radial-gradient(120% 90% at 50% 25%,#1b2530 0%,#0e141b 48%,#05080b 100%)",
      }}
    >
      {children}
      {!dark ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: isMobile
              ? "linear-gradient(to top,rgba(0,0,0,.7),transparent 40%)"
              : "repeating-linear-gradient(0deg,transparent 0 3px,rgba(255,255,255,.02) 3px 4px),radial-gradient(120% 80% at 50% 50%,transparent 52%,rgba(0,0,0,.6) 100%),linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 34%)",
          }}
        />
      ) : null}
    </div>
  </div>
);

const FoldToggle = ({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full"
    style={{
      height: 34,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      border: "1px solid #1D2026",
      borderRadius: 9,
      background: "#131519",
      fontSize: 11.5,
      fontWeight: 600,
      color: "#8B929B",
      marginTop: 10,
      cursor: "pointer",
    }}
  >
    <svg
      viewBox="0 0 24 24"
      style={{ width: 12, height: 12, stroke: "currentColor", fill: "none", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", display: "block" }}
    >
      <path d={collapsed ? "m6 9 6 6 6-6" : "m18 15-6-6-6 6"} />
    </svg>
    <span>{collapsed ? "Show stream" : "Hide stream"}</span>
  </button>
);

export default LiveStage;
