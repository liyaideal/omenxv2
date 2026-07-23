import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  prices: number[];
  width?: number;
  height?: number;
  /** Visual tone — auto-derived if omitted. */
  tone?: "up" | "down" | "neutral";
  className?: string;
}

/**
 * Tiny SVG price sparkline (default 48×16) for feed cards.
 *
 * - Pure stateless renderer, no data fetching.
 * - Auto fits min/max with 1px vertical padding.
 * - Tone defaults to first-vs-last comparison.
 * - Renders a 1.5px end-cap dot to highlight current price.
 */
export const Sparkline = ({
  prices,
  width = 48,
  height = 16,
  tone,
  className,
}: SparklineProps) => {
  const series = useMemo(() => {
    if (!prices || prices.length < 2) return null;
    // Downsample to at most 12 points for clean rendering.
    const target = 12;
    if (prices.length <= target) return prices;
    const step = (prices.length - 1) / (target - 1);
    const out: number[] = [];
    for (let i = 0; i < target; i++) out.push(prices[Math.round(i * step)]);
    return out;
  }, [prices]);

  if (!series) {
    return (
      <div
        aria-hidden
        className={cn("rounded bg-muted/30", className)}
        style={{ width, height }}
      />
    );
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const pad = 1;
  const innerH = height - pad * 2;

  const points = series.map((p, i) => {
    const x = (i / (series.length - 1)) * width;
    const y = pad + (1 - (p - min) / range) * innerH;
    return [x, y] as const;
  });

  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const resolvedTone =
    tone ?? (series[series.length - 1] > series[0] ? "up" : series[series.length - 1] < series[0] ? "down" : "neutral");

  const colorClass =
    resolvedTone === "up"
      ? "text-trading-green"
      : resolvedTone === "down"
      ? "text-trading-red"
      : "text-muted-foreground";

  const [endX, endY] = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn(colorClass, className)}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={endX} cy={endY} r={1.5} fill="currentColor" />
    </svg>
  );
};
