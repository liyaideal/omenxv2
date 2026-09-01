// ============================================================
// LiveMatchboard — matrix scoreboard for SPORTS_MATCH fixtures.
// Desktop: segment matrix (CS2 maps / UFC rounds).
// Mobile: degraded strip (settlement score + current segment +
//         in-segment value) with a cell track along the bottom edge.
// Display-only. Reads events.metadata; writes nothing.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  buildModel,
  useMatchboardModel,
  type MatchboardEvent,
  type Model,
} from "./matchboardModel";
import { setLiveStageState, useShowWatchKey } from "./liveStageStore";

const MONO = "'Space Grotesk', ui-monospace, SFMono-Regular, monospace";

export type { MatchboardEvent } from "./matchboardModel";


// ---------- shared atoms ----------

const Blink = () => (
  <style>{`@keyframes mb-bl{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
);

const LivePill = ({ label }: { label: string }) => (
  <span
    className="inline-flex items-center"
    style={{
      gap: 6,
      background: "#FF8A3D",
      borderRadius: 999,
      padding: "3px 8px",
    }}
  >
    <i
      style={{
        width: 5,
        height: 5,
        borderRadius: 999,
        background: "#2A1200",
        display: "block",
        fontStyle: "normal",
        animation: "mb-bl 1.6s ease-in-out infinite",
      }}
    />
    <b
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: ".16em",
        color: "#2A1200",
      }}
    >
      {label}
    </b>
  </span>
);

const QuietPill = ({ label }: { label: string }) => (
  <span
    className="inline-flex items-center"
    style={{
      gap: 6,
      border: "1px solid #262B33",
      background: "#14181E",
      borderRadius: 999,
      padding: "3px 8px",
    }}
  >
    <b
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: ".16em",
        color: "#8B929B",
      }}
    >
      {label}
    </b>
  </span>
);

const ReviewBadge = () => (
  <span
    className="inline-flex items-center"
    style={{
      border: "1px solid rgba(255,138,61,.45)",
      background: "rgba(255,138,61,.1)",
      borderRadius: 999,
      padding: "3px 9px",
      color: "#FF8A3D",
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: ".1em",
      textTransform: "uppercase",
    }}
  >
    In review · result pending
  </span>
);

const cellStyle = (tone: "w" | "l" | "mut" | "base", now: boolean) => ({
  fontFamily: MONO,
  fontSize: 14,
  fontWeight: 600,
  textAlign: "center" as const,
  fontVariantNumeric: "tabular-nums" as const,
  height: 38,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color:
    tone === "w"
      ? "#fff"
      : tone === "l"
        ? "#5B6270"
        : tone === "mut"
          ? "#3D444C"
          : "#C9D1DA",
  ...(now ? { background: "rgba(255,138,61,.07)" } : null),
});

const headStyle = (on: boolean) => ({
  fontSize: 9.5,
  letterSpacing: ".14em",
  textTransform: "uppercase" as const,
  color: on ? "#FF8A3D" : "#4A525C",
  fontWeight: 600,
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  ...(on
    ? { boxShadow: "inset 0 2px 0 #FF8A3D", background: "rgba(255,138,61,.07)" }
    : null),
});

// ---------- desktop matrix ----------

const Matrix = ({
  m,
  showWatch,
  onSegmentSelect,
}: {
  m: Model;
  showWatch: boolean;
  onSegmentSelect?: (segment: number) => void;
}) => {
  const settled = m.status === "settled";
  const cols = m.spec
    ? [
        "1fr",
        ...(m.showTotals ? ["62px"] : []),
        "18px",
        ...Array.from({ length: m.total }, () => `${m.colWidth}px`),
      ]
    : ["1fr", ...(m.showTotals ? ["62px"] : [])];

  const colHighlight = (n: number) =>
    (m.status === "live" || m.status === "break") && n === m.idx;

  const rowCells = (side: "home" | "away") =>
    Array.from({ length: m.total }, (_, i) => {
      const n = i + 1;
      const now = colHighlight(n);
      if (m.isMma) {
        if (m.status === "settled") {
          if (m.idx == null || m.winnerHome == null)
            return (
              <div key={n} style={cellStyle("mut", false)}>
                ·
              </div>
            );
          if (n > m.idx)
            return (
              <div key={n} style={cellStyle("mut", false)}>
                —
              </div>
            );
          if (n < m.idx)
            return (
              <div key={n} style={cellStyle("mut", false)}>
                ·
              </div>
            );
          const won = side === "home" ? m.winnerHome : !m.winnerHome;
          return (
            <div
              key={n}
              style={{ ...cellStyle(won ? "base" : "l", false), ...(won ? { color: "#CFFF4A" } : null) }}
            >
              {won ? "W" : "L"}
            </div>
          );
        }
        if (m.status === "live" && n === m.idx)
          return (
            <div key={n} style={{ ...cellStyle("base", true), color: "#FF8A3D" }}>
              ●
            </div>
          );
        return (
          <div key={n} style={cellStyle("mut", now)}>
            ·
          </div>
        );
      }
      const r = m.results[n - 1];
      if (!r)
        return (
          <div key={n} style={cellStyle("mut", now)}>
            ·
          </div>
        );
      const v = side === "home" ? r.home : r.away;
      const other = side === "home" ? r.away : r.home;
      return (
        <div key={n} style={cellStyle(v > other ? "w" : v < other ? "l" : "base", now)}>
          {v}
        </div>
      );
    });

  const teamCell = (name: string, dim: boolean) => (
    <div style={{ display: "flex", alignItems: "center", padding: "0 0 0 16px", height: 38 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: dim ? "#8B929B" : "#E7ECF2" }}>
        {name}
      </span>
    </div>
  );

  const totalCell = (v: number, dim: boolean) => (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 26,
        fontWeight: 700,
        lineHeight: 1,
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        color: dim ? "#5B6270" : "#fff",
      }}
    >
      {v}
    </div>
  );

  return (
    <div
      className="w-full max-w-[828px]"
      style={{
        border: "1px solid #1D2026",
        borderRadius: 12,
        background: "linear-gradient(168deg,#171C24 0%,#0D1014 100%)",
        overflow: "hidden",
        ...(settled ? { opacity: 0.6 } : null),
      }}
    >
      <Blink />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          lineHeight: 1.2,
          padding: "11px 16px 9px",
          borderBottom: "1px solid #16191F",
        }}
      >
        {m.status === "live" ? (
          <LivePill label="LIVE" />
        ) : m.status === "break" ? (
          <LivePill label="BREAK" />
        ) : m.status === "upcoming" ? (
          <QuietPill label="UPCOMING" />
        ) : (
          <QuietPill label="FINISHED" />
        )}
        <span
          className="min-w-0 truncate"
          style={{
            fontSize: 10,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            color: "#6B727C",
            fontWeight: 600,
          }}
        >
          {m.ctx}
        </span>
        <span style={{ flexGrow: 1 }} />
        {showWatch ? (
          <button
            type="button"
            onClick={() => setLiveStageState({ miniDismissed: false })}
            className="inline-flex items-center"
            style={{
              gap: 6,
              border: "1px solid #262B33",
              background: "#14181E",
              borderRadius: 8,
              padding: "5px 9px",
              color: "#C9D1DA",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, fill: "currentColor", stroke: "none", display: "block" }}>
              <path d="M7 4v16l13-8z" />
            </svg>
            Watch
          </button>
        ) : null}
        {m.sealed && (m.status === "live" || m.status === "break") ? (
          <span className="min-w-0 truncate" style={{ fontSize: 10.5, color: "#6B727C" }}>
            Scorecards sealed until the decision
          </span>
        ) : null}
        {m.status === "settled" ? (
          <QuietPill label="SETTLED" />
        ) : m.status === "finished" ? (
          <ReviewBadge />
        ) : (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 14,
              fontWeight: 700,
              color: m.isMma && m.status === "live" ? "#FF8A3D" : "#C9D1DA",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {m.rightValue}
          </span>
        )}
      </div>

      <div style={{ display: "grid", alignItems: "center", gridTemplateColumns: cols.join(" ") }}>
        <div style={headStyle(false)} />
        {m.showTotals ? (
          <div style={{ ...headStyle(false), fontSize: 9 }}>
            {m.totalsWord}
          </div>
        ) : null}
        {m.spec ? <div style={headStyle(false)} /> : null}
        {m.spec
          ? Array.from({ length: m.total }, (_, i) =>
              onSegmentSelect ? (
                <button
                  key={`hd${i}`}
                  type="button"
                  onClick={() => onSegmentSelect(i + 1)}
                  style={{
                    ...headStyle(colHighlight(i + 1)),
                    border: 0,
                    padding: 0,
                    background: colHighlight(i + 1)
                      ? "rgba(255,138,61,.07)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "background .12s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,138,61,.16)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colHighlight(i + 1)
                      ? "rgba(255,138,61,.07)"
                      : "transparent";
                  }}
                >
                  {m.spec?.label(i + 1)}
                </button>
              ) : (
                <div key={`hd${i}`} style={headStyle(colHighlight(i + 1))}>
                  {m.spec?.label(i + 1)}
                </div>
              ),
            )
          : null}

        {teamCell(m.home, false)}
        {m.showTotals ? totalCell(m.homeMaps, false) : null}
        {m.spec ? <div /> : null}
        {m.spec ? rowCells("home") : null}

        {teamCell(m.away, true)}
        {m.showTotals ? totalCell(m.awayMaps, true) : null}
        {m.spec ? <div /> : null}
        {m.spec ? rowCells("away") : null}
      </div>
    </div>
  );
};

// ---------- mobile degraded strip ----------
// 1:1 于定稿画布 SpecMobile 的 .deg / .sticky 条。
// 内联 62 高（含 1px 边框），sticky 45 高，比分字号 18 → 16。

const CellTrack = ({ m }: { m: Model }) => {
  if (!m.spec || m.total <= 0) return null;
  const thr = m.spec.decisiveThreshold;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 3,
        display: "flex",
        gap: 2,
      }}
    >
      {Array.from({ length: m.total }, (_, i) => {
        const n = i + 1;
        const r = m.results[n - 1];
        const done = m.idx == null ? !!r : n < m.idx;
        const now = (m.status === "live" || m.status === "break") && n === m.idx;
        const pct =
          now && r && thr
            ? Math.max(0, Math.min(1, Math.max(r.home, r.away) / thr))
            : 0;
        if (now)
          return (
            <div key={n} style={{ flex: 1, height: 3, display: "flex" }}>
              <div style={{ flexGrow: pct, background: "#FF8A3D" }} />
              <div style={{ flexGrow: 1 - pct, background: "#191D23" }} />
            </div>
          );
        return (
          <div
            key={n}
            style={{ flex: 1, height: 3, background: done ? "#39414B" : "#191D23" }}
          />
        );
      })}
    </div>
  );
};

/** 姓氏（UFC 用）：取最后一个空格后的词。 */
const lastName = (full: string) => {
  const t = (full || "").trim().split(/\s+/);
  return t[t.length - 1] || "";
};

const MobileBar = ({ m, sticky }: { m: Model; sticky: boolean }) => {
  const scSize = sticky ? 16 : 18;
  const segLabel =
    m.idx == null || !m.spec
      ? ""
      : m.isMma
        ? `R${m.idx}`
        : sticky
          ? `M${m.idx}`
          : `MAP ${m.idx}`;

  const shellBase = {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "0 12px",
    overflow: "hidden",
    ...(m.status === "settled" ? { opacity: 0.6 } : null),
  };
  const shell = sticky
    ? {
        ...shellBase,
        height: 45,
        background: "#0E1116",
        borderBottom: "1px solid #1D2026",
      }
    : {
        ...shellBase,
        height: 62,
        border: "1px solid #1D2026",
        borderRadius: 12,
        background: "linear-gradient(168deg,#171C24,#0D1014)",
      };

  const ab = (text: string) => (
    <span
      className="truncate"
      style={
        m.isMma
          ? { fontSize: 11, letterSpacing: ".03em", color: "#C9D1DA", fontWeight: 600 }
          : { fontSize: 9.5, letterSpacing: ".14em", color: "#C9D1DA", fontWeight: 600 }
      }
    >
      {text}
    </span>
  );
  const sc = (v: number) => (
    <span
      style={{
        fontFamily: MONO,
        fontSize: scSize,
        fontWeight: 700,
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        color: "#fff",
      }}
    >
      {v}
    </span>
  );
  const dash = (text: string) => (
    <span style={{ fontFamily: MONO, fontSize: 12, color: "#3D444C" }}>{text}</span>
  );

  return (
    <div className="w-full" style={shell}>
      <Blink />
      {m.status === "live" ? (
        <LivePill label="LIVE" />
      ) : m.status === "break" ? (
        <LivePill label="BREAK" />
      ) : m.status === "upcoming" ? (
        <QuietPill label="UPCOMING" />
      ) : m.status === "settled" ? (
        <QuietPill label="SETTLED" />
      ) : (
        <QuietPill label="FINISHED" />
      )}

      {m.isMma ? (
        <>
          {ab(lastName(m.home))}
          {dash("vs")}
          {ab(lastName(m.away))}
        </>
      ) : (
        <>
          {ab(m.meta.home_abbr || m.home)}
          {sc(m.homeMaps)}
          {dash("–")}
          {sc(m.awayMaps)}
          {ab(m.meta.away_abbr || m.away)}
        </>
      )}

      <span style={{ flexGrow: 1 }} />
      {segLabel ? (
        <span style={{ fontFamily: MONO, fontSize: 11, color: "#8B929B" }}>{segLabel}</span>
      ) : null}
      {m.rightValue ? (
        <span
          style={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 700,
            color: m.isMma && m.status === "live" ? "#FF8A3D" : "#C9D1DA",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {m.rightValue}
        </span>
      ) : null}
      <CellTrack m={m} />
    </div>
  );
};

// ---------- entry ----------

export const LiveMatchboard = ({
  event,
  fixtureNow,
  forceWatchKey,
  onSegmentSelect,
  fixtureSticky,
}: {
  event: MatchboardEvent;
  fixtureNow?: number;
  /** Style-guide only. Absent ⇒ production behaviour, byte-identical. */
  forceWatchKey?: boolean;
  /** Desktop only. Absent ⇒ column heads stay inert `<div>`s. */
  onSegmentSelect?: (segment: number) => void;
  /** Style-guide only. `false` = never render the sticky layer,
   *  `true` = always render it. Absent ⇒ production IntersectionObserver. */
  fixtureSticky?: boolean;
}) => {
  const isMobile = useIsMobile();
  const storeWatch = useShowWatchKey(event.id);
  const showWatch = forceWatchKey ?? storeWatch;
  const sentinel = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  const live = useMatchboardModel(event);
  const m = useMemo(
    () => (fixtureNow != null ? buildModel(event, fixtureNow) : live),
    [event, fixtureNow, live],
  );


  useEffect(() => {
    const el = sentinel.current;
    if (!el || !isMobile) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [isMobile]);

  if (isMobile === undefined) return null;

  if (isMobile) {
    return (
      <div ref={sentinel}>
        <MobileBar m={m} sticky={false} />
        {m.sealed && (m.status === "live" || m.status === "break") ? (
          <div style={{ marginTop: 8, fontSize: 10.5, color: "#6B727C" }}>
            Scorecards sealed until the decision
          </div>
        ) : null}
        {(fixtureSticky ?? stuck) ? (
          <div
            className="fixed left-0 right-0 z-30"
            style={{ top: "var(--mobile-header-h)" }}
          >
            <MobileBar m={m} sticky />
          </div>
        ) : null}
      </div>
    );
  }

  return <Matrix m={m} showWatch={showWatch} onSegmentSelect={onSegmentSelect} />;
};

export default LiveMatchboard;
