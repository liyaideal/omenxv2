// ============================================================
// TABLE — the 140 px ladder between the stage and the decide column.
// It is the chart's Y axis made tangible: a lit axis (Up blue on top, Down
// volt below), ±ticks, the OPEN pill at centre, a dot that rides the live
// deviation, the countdown ring and "closes HH:MM UTC".
// Range: dynamic — opens at 0.06 % of the open, grows (never shrinks) in
// "nice" steps when the price leaves 80 % of the range; resets per round.
// Units: $ for ≥ $1 assets, % of open for sub-$1 assets (tableMath).
// ============================================================
import { useEffect, useRef, useState } from "react";
import { formatPriceBare } from "@/lib/formatPrice";
import { DIM, DOWN, HOT, LINE, UP, formatTick, initialLadderRange, nextLadderRange, utcHHMM } from "./tableMath";

interface Props {
  open: number;
  /** Deviation from open in ladder units ($ or %). */
  deviation: number;
  pct: boolean;
  roundId: string | null;
  remainingMs: number;
  durationMs: number;
  endMs: number | null;
  settling: boolean;
}

const TOP = 24;
const BOTTOM = 112;

export const TableLadder = ({ open, deviation, pct, roundId, remainingMs, durationMs, endMs, settling }: Props) => {
  const box = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(560);
  const [range, setRange] = useState(() => initialLadderRange(open, pct));
  const lastRound = useRef(roundId);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.getBoundingClientRect().height));
    ro.observe(el);
    setH(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);

  // Reset per round, grow-only within a round.
  useEffect(() => {
    if (roundId !== lastRound.current) {
      lastRound.current = roundId;
      setRange(initialLadderRange(open, pct));
    }
  }, [roundId, open, pct]);
  useEffect(() => {
    setRange((r) => nextLadderRange(r, deviation));
  }, [deviation]);

  const mid = (TOP + h - BOTTOM) / 2;
  const half = (h - BOTTOM - TOP) / 2;
  const yOf = (v: number) => mid - Math.max(-1, Math.min(1, v / range)) * half;
  const y = yOf(deviation);
  const up = deviation >= 0;
  const flat = Math.abs(deviation) < (pct ? 0.001 : 0.005);
  const dc = up ? UP : DOWN;
  const dg = up ? "rgba(51,214,255,.6)" : "rgba(207,255,74,.6)";
  const hot = remainingMs <= 10_000 && !settling;
  const pctLeft = Math.max(0, Math.min(100, (remainingMs / durationMs) * 100));
  const s = Math.max(0, Math.floor(remainingMs / 1000));
  const cd = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const ticks: [number, string][] = [
    [range, "u"],
    [range / 2, "u"],
    [-range / 2, "d"],
    [-range, "d"],
  ];

  return (
    <div
      ref={box}
      style={{
        position: "relative",
        height: "100%",
        background: "linear-gradient(180deg,#0E1016,#0B0C11)",
        borderLeft: `1px solid ${LINE}`,
        borderRight: `1px solid ${LINE}`,
        boxShadow: "inset 0 0 40px rgba(0,0,0,.5)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: TOP,
          bottom: BOTTOM,
          width: 3,
          borderRadius: 2,
          background: `linear-gradient(180deg,${UP},#2a2f3a 50%,${DOWN})`,
          transform: "translateX(-50%)",
          boxShadow: "0 0 12px rgba(51,214,255,.25),0 0 12px rgba(207,255,74,.15)",
        }}
      />
      {ticks.map(([v, k]) => (
        <div
          key={k + v}
          className="font-mono"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: yOf(v),
            textAlign: "center",
            fontSize: 10,
            fontWeight: 700,
            transform: "translateY(-50%)",
            color: k === "u" ? UP : DOWN,
            opacity: Math.abs(yOf(v) - y) < 40 ? 0 : 0.8,
            transition: "opacity .2s",
          }}
        >
          {formatTick(v, pct)}
        </div>
      ))}
      <div
        className="font-mono"
        style={{
          position: "absolute",
          left: "50%",
          top: yOf(0),
          transform: "translate(-50%,-50%)",
          background: "#0C0D13",
          border: "1px solid #3a3f4a",
          borderRadius: 999,
          padding: "4px 10px",
          fontSize: 10,
          color: "#9CA3AC",
          whiteSpace: "nowrap",
          zIndex: 2,
          opacity: Math.abs(yOf(0) - y) < 26 ? 0 : 1,
          transition: "opacity .2s",
        }}
      >
        OPEN {formatPriceBare(open)}
      </div>
      {!flat && (
        <div
          className="font-mono"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: y,
            textAlign: "center",
            fontSize: 11,
            fontWeight: 700,
            transform: "translateY(-100%)",
            marginTop: -22,
            color: dc,
            transition: "top .2s linear",
          }}
        >
          {up ? "▲ +" : "▼ −"}
          {Math.abs(deviation).toFixed(2)}
          {pct ? "%" : ""}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: y,
          width: 26,
          height: 26,
          borderRadius: "50%",
          transform: "translate(-50%,-50%)",
          background: dc,
          boxShadow: `0 0 0 4px #0C0D13,0 0 0 5px ${dc},0 0 28px ${dg}`,
          zIndex: 3,
          transition: "top .2s linear",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 82,
          textAlign: "center",
          fontSize: 9,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: hot || settling ? HOT : DIM,
        }}
      >
        {settling ? "Settling · chips queue next round" : hot ? "Closing" : "Place your chips"}
      </div>
      <div
        className={hot ? "animate-pulse" : undefined}
        style={{
          position: "absolute",
          left: "50%",
          bottom: 22,
          width: 56,
          height: 56,
          borderRadius: "50%",
          transform: "translateX(-50%)",
          background: `conic-gradient(${HOT} ${pctLeft}%, ${LINE} 0)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 22px rgba(255,138,61,.45)",
        }}
      >
        <i
          className="font-mono"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "#0C0D13",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontStyle: "normal",
            fontSize: 12,
            fontWeight: 700,
            color: HOT,
          }}
        >
          {cd}
        </i>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 2, textAlign: "center", fontSize: 9, color: DIM, whiteSpace: "nowrap" }}>
        closes <span className="font-mono">{endMs ? utcHHMM(endMs) : "--:--"}</span> UTC
      </div>
    </div>
  );
};
