// ============================================================
// Lite spot stock chart + toggle (stock price ↔ Up odds ¢).
// Display-layer only: series come from price_history if any exist
// for the option, otherwise a deterministic front-end walk anchored
// on base_price → current. Marked DEMO-STATE inline.
// ============================================================
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatEtTime } from "@/lib/usStockSessions";

type Tab = "stock" | "odds";

interface Point {
  t: string; // HH:MM label
  v: number;
}

interface Props {
  ticker: string;
  basePrice: number | null;
  currentPrice: number | null;
  upOdds: number; // 0..1
  upHistory?: number[]; // optional real price history (0..1)
  endDate?: string | Date | null;
  className?: string;
}

// Deterministic pseudo-random walk. NOT random on every render — seeded by
// the ticker string so the chart is stable between mounts.
const synth = (
  seed: number,
  base: number,
  end: number,
  points: number,
  amplitude: number,
): number[] => {
  const out: number[] = [];
  const rand = (i: number) => {
    const x = Math.sin(seed * 41.13 + i * 7.79) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < points; i += 1) {
    const progress = i / (points - 1);
    // Blend base → end with sinusoidal drift so the shape reads intraday.
    const drift = (rand(i) - 0.5) * 2 * amplitude;
    const wave = Math.sin(progress * Math.PI * 1.6 + seed) * amplitude * 0.4;
    const v = base + (end - base) * progress + drift + wave;
    out.push(v);
  }
  return out;
};

// Fixed US regular-session marks (intraday ticks). The final close tick is
// derived from the event end_date so it never hardcodes 16:00.
const REGULAR_LABELS = [
  "9:30",
  "10:30",
  "11:30",
  "12:30",
  "13:30",
  "14:30",
  "15:30",
];

const buildPoints = (values: number[], labels: string[]): Point[] => {
  if (values.length === 0) return [];
  return values.map((v, i) => {
    const labelIdx = Math.round((i / (values.length - 1)) * (labels.length - 1));
    return { t: labels[labelIdx], v };
  });
};

export const LiteStockChart = ({
  ticker,
  basePrice,
  currentPrice,
  upOdds,
  upHistory,
  endDate,
  className,
}: Props) => {
  const [tab, setTab] = useState<Tab>("stock");
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  // Final close tick derives from the event end_date when available; otherwise
  // falls back to the regular 16:00 session close only as a last resort.
  const closeTick = useMemo(
    () => (endDate ? formatEtTime(new Date(endDate)) : "16:00"),
    [endDate],
  );
  const labels = useMemo(() => [...REGULAR_LABELS, closeTick], [closeTick]);

  const stockSeries = useMemo(() => {
    if (!basePrice || !currentPrice) return [];
    // DEMO-STATE: synthetic intraday walk anchored on base_price → currentPrice.
    const amp = Math.max(basePrice * 0.006, 0.05);
    return buildPoints(synth(seed, basePrice, currentPrice, 48, amp), labels);
  }, [seed, basePrice, currentPrice, labels]);

  const oddsSeries = useMemo(() => {
    if (upHistory && upHistory.length >= 4) {
      const scaled = upHistory.map((p) => Math.max(0, Math.min(100, p * 100)));
      return buildPoints(scaled, labels);
    }
    // DEMO-STATE: synthesize from 50¢ → current odds if no history rows.
    const end = Math.max(1, Math.min(99, Math.round(upOdds * 100)));
    return buildPoints(synth(seed + 1, 50, end, 48, 3.2), labels);
  }, [upHistory, upOdds, seed, labels]);

  const showOddsToggle = true; // odds always available (synth fallback)

  const series = tab === "stock" ? stockSeries : oddsSeries;
  const lineColor = tab === "stock" ? "#C9CED6" : "hsl(var(--yes))";
  const baseline = tab === "stock" ? basePrice : null;

  const yFmt = (v: number) =>
    tab === "stock" ? `$${v.toFixed(2)}` : `${Math.round(v)}¢`;

  return (
    <div className={cn("rounded-2xl border border-border bg-card", className)}>
      {/* Segmented toggle + timeframe */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="inline-flex rounded-lg bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("stock")}
            className={cn(
              "rounded-md px-3 py-1 transition-colors font-medium",
              tab === "stock"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {ticker} price
          </button>
          {showOddsToggle && (
            <button
              type="button"
              onClick={() => setTab("odds")}
              className={cn(
                "rounded-md px-3 py-1 transition-colors font-medium",
                tab === "odds"
                  ? "bg-background text-yes shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              Up odds ¢
            </button>
          )}
        </div>
        <div className="hidden gap-1 text-[11px] text-muted-foreground sm:flex">
          <span className="rounded bg-muted/40 px-2 py-0.5">1H</span>
          <span className="rounded bg-foreground/10 px-2 py-0.5 text-foreground">Today</span>
          <span className="rounded bg-muted/40 px-2 py-0.5">1W</span>
        </div>
      </div>

      <div className="h-[220px] w-full px-2 pb-3">
        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <XAxis
                dataKey="t"
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[
                  (dataMin: number) => dataMin - Math.abs(dataMin) * 0.002 - 0.01,
                  (dataMax: number) => dataMax + Math.abs(dataMax) * 0.002 + 0.01,
                ]}
                tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "Space Grotesk" }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={yFmt}
              />
              <Tooltip
                cursor={{ stroke: "#2B2F38", strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "#131519",
                  border: "1px solid #1D2026",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{ color: "#9AA1AC" }}
                formatter={(value: number) => [yFmt(value), tab === "stock" ? ticker : "Up odds"]}
              />
              {baseline != null && (
                <ReferenceLine
                  y={baseline}
                  stroke="#6B7280"
                  strokeDasharray="4 4"
                  label={{
                    value: `Price to beat $${baseline.toFixed(2)}`,
                    position: "insideTopRight",
                    fill: "#9AA1AC",
                    fontSize: 10,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="v"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default LiteStockChart;