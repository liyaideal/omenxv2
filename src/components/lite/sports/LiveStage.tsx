// ============================================================
// LiveStage — the live video surface above the matchboard.
// Nine states (S1–S9) per the approved canvas, plus the mini
// player (SP-L3b) and fullscreen. No score lives here: the
// matchboard below owns it, and one number must not have two
// renderers — the mini/fullscreen capsules read the very same
// metadata the matchboard reads.
//
// Implementation note: inline / mini / fullscreen are the SAME
// wrapper node moving, not three mounts. Re-mounting the
// <video> would re-buffer on every scroll. Only the wrapper's
// position, size and chrome change.
// Collapsed / dismissed means the <video> is gone, not hidden —
// a hidden video keeps burning bandwidth.
// ============================================================
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHlsVideo } from "@/hooks/useHlsVideo";
import { SPORT_SEGMENTS } from "@/lib/sportSegments";
import { fixtureMeta, isFixtureLive } from "./sportsData";
import { setLiveStageState, useLiveStageState } from "./liveStageStore";

const MONO = "'Space Grotesk', ui-monospace, SFMono-Regular, monospace";
const COLLAPSE_KEY = "omenx.lite.stage.collapsed";
const POS_KEY = "omenx.lite.mini.pos";

const MINI_W = 300;
const MINI_H = 229;
const EDGE = 8;

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

const Pill = ({ small, tiny }: { small?: boolean; tiny?: boolean }) => (
  <span
    className="inline-flex items-center"
    style={{
      gap: tiny ? 4 : small ? 5 : 6,
      background: "#FF8A3D",
      borderRadius: 999,
      padding: tiny ? "2px 6px" : small ? "3px 7px" : "3px 8px",
    }}
  >
    <i
      style={{
        width: tiny ? 4 : small ? 4 : 5,
        height: tiny ? 4 : small ? 4 : 5,
        borderRadius: 999,
        background: "#2A1200",
        display: "block",
        fontStyle: "normal",
        animation: "stage-bl 1.6s ease-in-out infinite",
      }}
    />
    <b
      style={{
        fontSize: tiny ? 8.5 : small ? 9 : 9.5,
        fontWeight: 700,
        letterSpacing: tiny ? ".12em" : small ? ".14em" : ".16em",
        color: "#2A1200",
        lineHeight: 1.2,
      }}
    >
      LIVE
    </b>
  </span>
);

const Glass = ({
  children,
  mono,
  tiny,
}: {
  children: React.ReactNode;
  mono?: boolean;
  tiny?: boolean;
}) => (
  <span
    className="inline-flex items-center"
    style={{
      gap: 6,
      background: "rgba(0,0,0,.58)",
      border: "1px solid rgba(255,255,255,.14)",
      backdropFilter: "blur(6px)",
      borderRadius: 999,
      padding: tiny ? "2px 7px" : "4px 9px",
    }}
  >
    <span
      style={
        mono
          ? {
              fontFamily: MONO,
              fontSize: tiny ? 10 : 12,
              fontWeight: 600,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }
          : {
              fontSize: tiny ? 10 : 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.72)",
              fontWeight: 600,
            }
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

const RoundBtn = ({
  label,
  onClick,
  small,
  children,
}: {
  label: string;
  onClick: () => void;
  small?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
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
    {children}
  </button>
);

const Ic = ({ d, size }: { d: string; size: number }) => (
  <svg
    viewBox="0 0 24 24"
    style={{
      width: size,
      height: size,
      stroke: "currentColor",
      fill: "none",
      strokeWidth: 1.7,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      display: "block",
    }}
  >
    <path d={d} />
  </svg>
);

const EXPAND_D =
  "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3";
const CLOSE_D = "M18 6 6 18M6 6l12 12";

const MuteBtn = ({
  muted,
  onClick,
  small,
}: {
  muted: boolean;
  onClick: () => void;
  small?: boolean;
}) => (
  <RoundBtn label={muted ? "Unmute" : "Mute"} onClick={onClick} small={small}>
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
  </RoundBtn>
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

const pad = (n: number) => String(n).padStart(2, "0");
const clockText = (raw: number | null | undefined): string => {
  const s = Math.max(0, Math.min(300, Number(raw ?? 0)));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const clampPos = (p: { left: number; top: number }) => ({
  left: clamp(p.left, EDGE, Math.max(EDGE, window.innerWidth - MINI_W - EDGE)),
  top: clamp(p.top, EDGE, Math.max(EDGE, window.innerHeight - MINI_H - EDGE)),
});

export const LiveStage = ({
  event,
  fixture,
  forceMode,
  yesLabel,
  noLabel,
  yesPrice,
  noPrice,
}: {
  event: StageEvent;
  fixture?: StageFixture;
  /** Style-guide only. Absent ⇒ production behaviour, byte-identical. */
  forceMode?: "inline" | "mini" | "fullscreen";
  yesLabel?: string;
  noLabel?: string;
  yesPrice?: number;
  noPrice?: number;
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

  const slotRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [inlineVisible, setInlineVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slotH, setSlotH] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: EDGE, top: 0 });
  const store = useLiveStageState();
  const dismissed = store.miniDismissed;

  // Restore the last drag position, re-clamped to the current viewport.
  useEffect(() => {
    let restored: { left: number; top: number } | null = null;
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { left?: number; top?: number };
        if (typeof p.left === "number" && typeof p.top === "number") {
          restored = { left: p.left, top: p.top };
        }
      }
    } catch {
      /* ignore */
    }
    setPos(clampPos(restored ?? { left: 16, top: window.innerHeight - MINI_H - 16 }));
  }, []);

  // Is the inline slot on screen? Both breakpoints observe it.
  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInlineVisible(e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [isMobile, collapsed]);

  // Page-level fullscreen, not the Fullscreen API. The API is refused
  // whenever the app runs inside an iframe without allow="fullscreen"
  // (the Lovable editor preview, most embeds), which would make this
  // control silently dead exactly where people first try it. A fixed
  // overlay works everywhere and keeps the same <video> element, so the
  // picture never reloads on the way in or out.
  const enterFullscreen = () => setIsFullscreen(true);
  const exitFullscreen = () => setIsFullscreen(false);

  // ESC exits; the page behind must not scroll while the overlay is up.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const hasSource = !!src && live;
  useEffect(() => {
    setLiveStageState({ fixtureId: event.id, hasSource, inlineVisible });
  }, [event.id, hasSource, inlineVisible]);

  useEffect(
    () => () => {
      setLiveStageState({ fixtureId: null, hasSource: false, inlineVisible: true });
    },
    [],
  );

  const wantMini =
    !forceMode &&
    !fixture &&
    isMobile === false &&
    hasSource &&
    !inlineVisible &&
    !dismissed &&
    !isFullscreen;
  const mode: "inline" | "mini" = forceMode
    ? forceMode === "mini"
      ? "mini"
      : "inline"
    : wantMini
      ? "mini"
      : "inline";
  const fullscreen = forceMode === "fullscreen" || isFullscreen;
  const preview = !!forceMode;

  // Freeze the slot height before the wrapper leaves the flow.
  useLayoutEffect(() => {
    if (mode === "inline" && wrapperRef.current) {
      const h = wrapperRef.current.getBoundingClientRect().height;
      if (h > 0) setSlotH(h);
    }
  }, [mode, isMobile, collapsed, fullscreen]);

  // ---- mini drag: only the grip starts it ----
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const onGripDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (preview) return;
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [preview],
  );
  const onGripMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setPos(clampPos({ left: e.clientX - d.dx, top: e.clientY - d.dy }));
  }, []);
  const onGripUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      dragRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setPos((p) => {
        const center = p.left + MINI_W / 2;
        const snapped = clampPos({
          left: center < window.innerWidth / 2 ? EDGE : window.innerWidth - MINI_W - EDGE,
          top: p.top,
        });
        try {
          localStorage.setItem(POS_KEY, JSON.stringify(snapped));
        } catch {
          /* ignore */
        }
        return snapped;
      });
    },
    [],
  );

  // The video only attaches while the stage is reachable and the match is in
  // play. A dismissed mini player with the stage off screen unmounts it.
  const wantVideo =
    !fixture && !!src && live && !collapsed && !(dismissed && !inlineVisible);
  const { ref, state, muted, setMuted, play, pause } = useHlsVideo(src, wantVideo);

  const model = useMatchboardModel(event as unknown as MatchboardEvent);


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

  // ---- score facts, read from the shared matchboard model ----
  const isMma = model.isMma;
  const spec = model.spec;
  const idx = model.idx;
  const segRes = model.current;
  const unitWord = spec?.unit === "round" ? "Round" : "Map";
  const segValue = isMma
    ? model.clockText
    : segRes
      ? `${segRes.home}\u2013${segRes.away}`
      : "\u2014";
  const miniCapsule =
    idx != null ? `${isMma ? "R" : "M"}${idx} \u00b7 ${segValue}` : "";
  const homeSeg = model.homeMaps;
  const awaySeg = model.awayMaps;
  const home = meta.home || "";
  const away = meta.away || "";
  const fullCapsule = isMma
    ? `${home} vs ${away}${idx != null ? ` \u00b7 ${unitWord} ${idx}` : ""} \u00b7 ${segValue}`
    : `${home} ${homeSeg}\u2013${awaySeg} ${away}${idx != null ? ` \u00b7 ${unitWord} ${idx}` : ""} \u00b7 ${segValue}`;


  const chrome: "inline" | "mini" | "full" = fullscreen ? "full" : mode;

  const backToStage = () => {
    slotRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const closeMini = () => setLiveStageState({ miniDismissed: true });
  const pickSide = () => {
    exitFullscreen();
    const anchor =
      document.getElementById("lite-odds-anchor") ?? (slotRef.current as Element | null);
    window.setTimeout(() => anchor?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  const wrapperStyle: React.CSSProperties = fullscreen
    ? preview
      ? {
          position: "relative",
          width: "100%",
          border: "1px solid #1D2026",
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
          display: "flex",
          flexDirection: "column",
        }
      : {
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          borderRadius: 0,
          border: "none",
          overflow: "hidden",
          background: "#000",
          display: "flex",
          flexDirection: "column",
          zIndex: 60,
        }
    : mode === "mini"
      ? {
          position: preview ? "relative" : "fixed",
          left: preview ? undefined : pos.left,
          top: preview ? undefined : pos.top,
          width: MINI_W,
          height: MINI_H,
          display: "flex",
          flexDirection: "column",
          border: "1px solid #1D2026",
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(6,7,9,.96)",
          boxShadow: "0 18px 48px rgba(0,0,0,.6)",
          zIndex: 40,
        }
      : {
          position: "relative",
          border: "1px solid #1D2026",
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
        };

  const grip =
    chrome === "mini" ? (
      <div
        onPointerDown={onGripDown}
        onPointerMove={onGripMove}
        onPointerUp={onGripUp}
        onPointerCancel={onGripUp}
        style={{
          height: 20,
          background: "rgba(255,255,255,.03)",
          borderBottom: "1px solid rgba(255,255,255,.05)",
          display: "grid",
          placeItems: "center",
          color: "#4C535C",
          fontSize: 10,
          letterSpacing: ".3em",
          cursor: "grab",
          touchAction: "none",
        }}
      >
        ···
      </div>
    ) : null;

  const minibar =
    chrome === "mini" ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 9px",
          boxSizing: "border-box",
          borderTop: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <button
          type="button"
          onClick={backToStage}
          style={{
            flexGrow: 1,
            height: 30,
            borderRadius: 8,
            background: "#1B1E24",
            border: "1px solid #1D2026",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 11.5,
            fontWeight: 600,
            color: "#D7DDE4",
            cursor: "pointer",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            style={{
              width: 12,
              height: 12,
              stroke: "currentColor",
              fill: "none",
              strokeWidth: 1.7,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              display: "block",
            }}
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          Back to stage
        </button>
        <button
          type="button"
          aria-label="Fullscreen"
          onClick={enterFullscreen}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            color: "#8B929B",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <Ic d={EXPAND_D} size={14} />
        </button>
        <button
          type="button"
          aria-label="Close mini player"
          onClick={closeMini}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            color: "#8B929B",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <Ic d={CLOSE_D} size={14} />
        </button>
      </div>
    ) : null;

  const chip = (label: string, price: number | undefined, yes: boolean) => (
    <button
      type="button"
      onClick={pickSide}
      className="transition-opacity hover:opacity-80"
      style={{
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: 700,
        borderRadius: 7,
        padding: "6px 10px",
        minWidth: 120,
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        border: "none",
        cursor: "pointer",
        background: yes ? "rgba(51,214,255,.12)" : "rgba(207,255,74,.1)",
        color: yes ? "#33D6FF" : "#CFFF4A",
      }}
    >
      <span>{label}</span>
      <span>{price == null ? "—" : `${Math.round(price * 100)}¢`}</span>
    </button>
  );

  const delayPill = (
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
  );

  const stage = (
    <StageShell
      isMobile={isMobile}
      dark={dark}
      innerRef={wrapperRef}
      style={wrapperStyle}
      className={
        fullscreen || mode === "mini" ? "" : isMobile ? "w-full" : "w-full max-w-[828px]"
      }
      fill={mode === "mini" || (fullscreen && !preview)}
      before={grip}
      after={minibar}
    >
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
            objectFit: fullscreen ? "contain" : "cover",
            zIndex: 1,
          }}
        />
      ) : null}

      {!dark && chrome === "inline" ? (
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
          {idx != null ? (
            <div
              style={{
                position: "absolute",
                right: isMobile ? 10 : 16,
                top: isMobile ? 10 : 16,
                zIndex: 2,
              }}
            >
              <Glass mono>
                {unitWord} {idx}
              </Glass>
            </div>
          ) : null}
        </>
      ) : null}

      {!dark && chrome === "mini" ? (
        <>
          <div style={{ position: "absolute", left: 8, top: 8, zIndex: 2 }}>
            <Pill tiny />
          </div>
          {miniCapsule ? (
            <div style={{ position: "absolute", right: 8, top: 8, zIndex: 2 }}>
              <Glass mono tiny>
                {miniCapsule}
              </Glass>
            </div>
          ) : null}
        </>
      ) : null}

      {chrome === "full" ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              zIndex: 2,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Pill />
            <Glass mono>{fullCapsule}</Glass>
          </div>
          <div style={{ position: "absolute", right: 16, top: 16, zIndex: 2 }}>
            <RoundBtn label="Exit fullscreen" onClick={exitFullscreen}>
              <Ic d={CLOSE_D} size={13} />
            </RoundBtn>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "linear-gradient(to top,rgba(0,0,0,.85),transparent)",
            }}
          >
            {delayPill}
            <span style={{ flexGrow: 1 }} />
            {chip(yesLabel || home || "Yes", yesPrice, true)}
            {chip(noLabel || away || "No", noPrice, false)}
          </div>
        </>
      ) : null}

      {chrome === "inline" ? (
        <>
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
        </>
      ) : null}

      {!dark && chrome === "inline" ? (
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
            {delayPill}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <RoundBtn label="Fullscreen" onClick={enterFullscreen}>
                <Ic d={EXPAND_D} size={13} />
              </RoundBtn>
              <MuteBtn muted={muted} onClick={() => setMuted(!muted)} />
            </div>
          </div>
        )
      ) : null}
    </StageShell>
  );

  return (
    <div>
      {isMobile && !fixture && collapsed ? (
        <div ref={slotRef} />
      ) : (
        <div ref={slotRef} style={mode === "mini" && !preview ? { height: slotH } : undefined}>
          {stage}
        </div>
      )}

      {isMobile && !fixture ? <FoldToggle collapsed={collapsed} onClick={toggle} /> : null}
    </div>
  );
};

const StageShell = ({
  isMobile,
  dark,
  children,
  innerRef,
  style,
  className,
  before,
  after,
  fill,
}: {
  isMobile: boolean;
  dark?: boolean;
  children: React.ReactNode;
  innerRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  className?: string;
  before?: React.ReactNode;
  after?: React.ReactNode;
  fill?: boolean;
}) => (
  <div
    ref={innerRef}
    className={className ?? (isMobile ? "w-full" : "w-full max-w-[828px]")}
    style={
      style ?? {
        position: "relative",
        border: "1px solid #1D2026",
        borderRadius: 12,
        overflow: "hidden",
        background: "#000",
      }
    }
  >
    <style>{`@keyframes stage-bl{0%,100%{opacity:1}50%{opacity:.25}}@keyframes stage-sp{to{transform:translate(-50%,-50%) rotate(360deg)}}`}</style>
    {before}
    <div
      style={{
        position: "relative",
        width: "100%",
        ...(fill ? { flexGrow: 1, minHeight: 0 } : { aspectRatio: "16/9" }),
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
    {after}
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
