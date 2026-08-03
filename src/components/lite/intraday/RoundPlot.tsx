// ============================================================
// Deterministic mini price plot for a quick round.
// Left 62% = history, right 38% = the current round region.
// ============================================================
import { useMemo } from "react";
import { seedFromId, smoothWalk } from "./intradayData";

interface Props {
  eventId: string;
  basePrice: number;
  currentPrice: number;
  currency?: string;
  height?: number;
  /** Reserve vertical room so the overlay labels never sit on the path. */
  padTop?: number;
  /** Up-side price (0–1) — biases the current-round segment's drift. */
  upOdds?: number;
  className?: string;
}

const HIST_POINTS = 48;
const CUR_POINTS = 20;
const ZONE = 0.62;
const END_X = 0.97;

/** Catmull-Rom → cubic bezier path through the given points. */
const smoothPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
};

export const RoundPlot = ({
  eventId,
  basePrice,
  currentPrice,
  currency = "$",
  height = 120,
  padTop = 26,
  upOdds = 0.5,
  className,
}: Props) => {
  const seed = seedFromId(eventId);
  const { histD, curD, baselineY, lastPt, up, viewW, viewH } = useMemo(() => {
    const w = 300;
    const h = height;
    const sigma = 0.0006;
    // History walks up to the round open, current segment drifts with the odds.
    const histRaw = smoothWalk(seed, basePrice, HIST_POINTS, sigma);
    const histShift = basePrice - histRaw[histRaw.length - 1];
    const hist = histRaw.map((v) => v + histShift);
    const drift = (upOdds - 0.5) * 0.0006;
    const curRaw = smoothWalk(seed + 11, basePrice, CUR_POINTS, sigma, drift);
    const curShift = basePrice - curRaw[0];
    const cur = curRaw.map((v) => v + curShift);

    const all = [...hist, ...cur];
    const maxDev = Math.max(...all.map((v) => Math.abs(v - basePrice)));
    const halfRange = Math.max(maxDev, Math.abs(basePrice) * 0.00175) || 1;
    const halfBox = (h * 0.58) / 2;
    const mid = h / 2;
    const yOf = (v: number) => mid - ((v - basePrice) / halfRange) * halfBox;

    const zoneX = w * ZONE;
    const endX = w * END_X;
    const histPts = hist.map((v, i) => ({
      x: (i / (HIST_POINTS - 1)) * zoneX,
      y: yOf(v),
    }));
    const curPts = cur.map((v, i) => ({
      x: zoneX + (i / (CUR_POINTS - 1)) * (endX - zoneX),
      y: yOf(v),
    }));
    const last = curPts[curPts.length - 1];
    const lead = cur[cur.length - 1] >= basePrice;
    return {
      histD: smoothPath(histPts),
      curD: smoothPath(curPts),
      baselineY: mid,
      lastPt: last,
      up: lead,
      viewW: w,
      viewH: h,
    };
  }, [seed, basePrice, currentPrice, height, padTop, upOdds]);

  const curColor = up ? "#33D6FF" : "#CFFF4A";

  return (
    <div className={className} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        style={{ display: "block", background: "#0C1013" }}
        aria-hidden="true"
      >
      {/* current-round region */}
      <rect
        x={viewW * ZONE}
        y={0}
        width={viewW * (1 - ZONE)}
        height={viewH}
        fill="rgba(255,255,255,.035)"
      />
      {/* round-open baseline */}
      <line
        x1={0}
        x2={viewW}
        y1={baselineY}
        y2={baselineY}
        stroke="rgba(255,255,255,.28)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      <path
        d={histD}
        fill="none"
        stroke="#3A4149"
        strokeWidth={1.5}
        strokeOpacity={0.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={curD}
        fill="none"
        stroke={curColor}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      </svg>
      {lastPt && (
        <span
          style={{
            position: "absolute",
            left: `${(lastPt.x / viewW) * 100}%`,
            top: (lastPt.y / viewH) * height,
            width: 6,
            height: 6,
            marginLeft: -3,
            marginTop: -3,
            borderRadius: "50%",
            background: curColor,
          }}
        />
      )}
      <span
        style={{
          position: "absolute",
          left: 0,
          width: `${ZONE * 100}%`,
          top: (baselineY / viewH) * height,
          transform: "translateY(-50%)",
          textAlign: "right",
          paddingRight: 6,
          pointerEvents: "none",
        }}
      >
        <RoundOpenPill value={basePrice} currency={currency} />
      </span>
    </div>
  );
};

/** Small "Round open $X" pill — rendered in DOM so type scales correctly. */
export const RoundOpenPill = ({
  value,
  currency = "$",
  style,
}: {
  value: number;
  currency?: string;
  style?: React.CSSProperties;
}) => (
  <span
    style={{
      background: "#1B1F25",
      border: "1px solid #2B2F38",
      borderRadius: 6,
      fontSize: 9.5,
      color: "#9AA1AC",
      padding: "2px 6px",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    Round open {currency}
    {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
  </span>
);

export default RoundPlot;