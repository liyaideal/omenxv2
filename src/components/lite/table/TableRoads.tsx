// ============================================================
// TABLE ① "what happened" — the roads strip.
// Standard reading order (baccarat convention): bead plate on the LEFT
// (raw chronological, 6 rows, newest column on the right), big road on the
// RIGHT (same result stacks down, a change starts a new column, 6 rows max),
// then counts. Derived roads (big-eye / small / cockroach) are not drawn —
// the product has no tie and v1 keeps to the two primary roads.
// ============================================================
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  bigRoadColumns,
  chunk,
  currentStreak,
  DIM,
  DOWN,
  LINE,
  longestStreak,
  money,
  UP,
  utcHHMM,
  type TableSide,
} from "./tableMath";

const MICRO: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: DIM,
  lineHeight: 1,
  height: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
  whiteSpace: "nowrap",
};

export interface RoadsProps {
  /** Oldest → newest settled outcomes for this coin + round length. */
  history: TableSide[];
  /** Start of the CURRENT round (ms) — chip tooltips count back from here. */
  currentStartMs: number | null;
  tfMs: number;
  /** Your last 10 settled rounds on this table. */
  mine: { won: boolean; side: TableSide }[];
  /** Whether you hold something in the live round (adds the dashed slot). */
  holding: boolean;
  /** Today's net on this table. */
  net: number;
  /** Highlight the newest big-road cell (just settled). */
  fresh?: boolean;
}

const BeadCell = ({ side, title }: { side: TableSide; title: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: side === "up" ? UP : DOWN,
            boxShadow: side === "up" ? "0 0 6px rgba(51,214,255,.45)" : "0 0 6px rgba(207,255,74,.4)",
          }}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const RoadCell = ({ side, title, fresh }: { side: TableSide; title: string; fresh?: boolean }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={fresh ? "animate-in zoom-in-50 duration-300" : undefined}
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            boxShadow: `inset 0 0 0 1.5px ${side === "up" ? UP : DOWN}`,
            background: side === "up" ? "rgba(51,214,255,.10)" : "rgba(207,255,74,.10)",
          }}
        />
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const TableRoads = ({ history, currentStartMs, tfMs, mine, holding, net, fresh }: RoadsProps) => {
  const n = history.length;
  const windowOf = (i: number) => {
    if (currentStartMs == null) return `Round −${n - i}`;
    const s = currentStartMs - (n - i) * tfMs;
    return `${utcHHMM(s)}–${utcHHMM(s + tfMs)} UTC`;
  };
  const last36 = history.slice(-36);
  const off = n - last36.length;
  const cols = bigRoadColumns(history);
  const streak = currentStreak(history);
  const longest = longestStreak(history);
  const ups = history.filter((s) => s === "up").length;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "0 28px",
        height: "100%",
        background: "linear-gradient(180deg,#0E1016,#0B0C11)",
        boxShadow: "inset 0 -1px 0 rgba(255,255,255,.03)",
      }}
    >
      <div style={{ ...MICRO, height: "auto" }}>① what happened</div>

      {/* Bead plate */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "flex-start", paddingTop: 16 }}>
        <div style={MICRO}>Bead · {last36.length}</div>
        <div style={{ display: "flex", gap: 3, minHeight: 87 }}>
          {chunk(last36.map((s, i) => [s, i + off] as const), 6).map((col, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {col.map(([s, i]) => (
                <BeadCell key={i} side={s} title={`${windowOf(i)} · ${s === "up" ? "Up" : "Down"} won`} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 1, height: 96, background: LINE }} />

      {/* Big road */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignSelf: "flex-start", paddingTop: 16, minWidth: 0 }}>
        <div style={MICRO}>
          Big road
          {streak.n >= 3 && streak.side && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 999,
                letterSpacing: 0,
                textTransform: "none",
                color: streak.side === "up" ? UP : DOWN,
                background: streak.side === "up" ? "rgba(51,214,255,.14)" : "rgba(207,255,74,.14)",
                boxShadow:
                  streak.side === "up"
                    ? "0 0 0 1px rgba(51,214,255,.35),0 0 16px rgba(51,214,255,.25)"
                    : "0 0 0 1px rgba(207,255,74,.35),0 0 16px rgba(207,255,74,.25)",
              }}
            >
              {streak.side === "up" ? "Up" : "Down"} ×{streak.n} in a row
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 3, minHeight: 87, overflow: "hidden", justifyContent: "flex-end", maxWidth: 560 }}>
          {cols.map((c, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {c.idx.map((i, j) => (
                <RoadCell
                  key={i}
                  side={c.side}
                  title={`${windowOf(i)} · ${c.side === "up" ? "Up" : "Down"} won`}
                  fresh={fresh && ci === cols.length - 1 && j === c.idx.length - 1}
                />
              ))}
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div title="This round" style={{ width: 12, height: 12, borderRadius: 3, border: "1px dashed #3a3f4a", boxSizing: "border-box" }} />
          </div>
        </div>
      </div>

      {/* Counts */}
      <div style={{ marginLeft: "auto", display: "flex", gap: 22, fontSize: 12, color: DIM, whiteSpace: "nowrap" }}>
        <span>
          Up <b style={{ color: UP }}>{ups}</b> · Down <b style={{ color: DOWN }}>{n - ups}</b>
        </span>
        <span>
          Longest <b style={{ color: "#fff" }}>{longest.side ? `${longest.side === "up" ? "Up" : "Down"} ×${longest.n}` : "—"}</b>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          You last 10
          <span style={{ display: "inline-flex", gap: 3 }}>
            {mine.map((m, i) => (
              <i
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  fontStyle: "normal",
                  fontSize: 9,
                  lineHeight: "14px",
                  textAlign: "center",
                  fontWeight: 700,
                  color: m.won ? "#0A0B0D" : "#fff",
                  background: m.won ? (m.side === "up" ? UP : DOWN) : "#FF5C5C",
                }}
              >
                {m.won ? "✓" : "✕"}
              </i>
            ))}
            {holding && <i style={{ width: 14, height: 14, borderRadius: 3, border: "1px dashed #3a3f4a", boxSizing: "border-box" }} />}
          </span>
          <b className="font-mono" style={{ color: net >= 0 ? DOWN : "#FF5C5C" }}>
            {money(net)}
          </b>
        </span>
      </div>
    </div>
  );
};
