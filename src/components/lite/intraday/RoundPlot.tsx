// ============================================================
// Deterministic mini price plot for a quick round.
// Left 62% = history, right 38% = the current round region.
// ============================================================
import { useMemo } from "react";
import { seedFromId, synthSeries } from "./intradayData";

interface Props {
  eventId: string;
  basePrice: number;
  currentPrice: number;
  currency?: string;
  height?: number;
  /** Reserve vertical room so the overlay labels never sit on the path. */
  padTop?: number;
  className?: string;
}

const HIST_POINTS = 38;
const CUR_POINTS = 24;

export const RoundPlot = ({
  eventId,
  basePrice,
  currentPrice,
  currency = "$",
  height = 120,
  padTop = 26,
  className,
}: Props) => {
  const seed = seedFromId(eventId);
  const up = currentPrice >= basePrice;

  const { histPath, curPath, baselineY, viewW, viewH } = useMemo(() => {
    const w = 300;
    const h = height;
    const amp = Math.max(Math.abs(basePrice) * 0.0022, 0.01);
    const hist = synthSeries(seed, basePrice * 0.9985, basePrice, HIST_POINTS, amp);
    const cur = synthSeries(seed + 11, basePrice, currentPrice, CUR_POINTS, amp);
    const all = [...hist, ...cur];
    const min = Math.min(...all, basePrice);
    const max = Math.max(...all, basePrice);
    const span = max - min || 1;
    const top = padTop;
    const bottom = h - 14;
    const yOf = (v: number) => bottom - ((v - min) / span) * (bottom - top);
    const total = HIST_POINTS + CUR_POINTS - 1;
    const xOf = (i: number) => (i / total) * w;
    const pts = (vals: number[], offset: number) =>
      vals.map((v, i) => `${xOf(i + offset).toFixed(2)},${yOf(v).toFixed(2)}`).join(" ");
    return {
      histPath: pts(hist, 0),
      curPath: pts(cur, HIST_POINTS - 1),
      baselineY: yOf(basePrice),
      viewW: w,
      viewH: h,
    };
  }, [seed, basePrice, currentPrice, height, padTop]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${viewW} ${viewH}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      style={{ display: "block", background: "#0C1013" }}
      aria-hidden="true"
    >
      {/* current-round region */}
      <rect
        x={viewW * 0.62}
        y={0}
        width={viewW * 0.38}
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
      <polyline points={histPath} fill="none" stroke="#3A4149" strokeWidth={1.5} />
      <polyline
        points={curPath}
        fill="none"
        stroke={up ? "#33D6FF" : "#CFFF4A"}
        strokeWidth={2.5}
      />
    </svg>
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