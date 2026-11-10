// ============================================================
// Lite spot stock chart + toggle (stock price ↔ Up odds ¢).
// Display-layer only: series come from price_history if any exist
// for the option, otherwise a deterministic front-end walk anchored
// on base_price → current. Marked DEMO-STATE inline.
// ============================================================
import { t } from "@/i18n";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { formatLocalTime } from "@/lib/usStockSessions";

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
  /**
   * Round start. When present the X axis spans start → end (UTC HH:MM) instead
   * of the US regular-session marks — used by sub-day rounds (crypto windows),
   * which have no relationship to a stock session.
   */
  startDate?: string | Date | null;
  /** Side selected in the order card — the odds series follows it. */
  side?: "yes" | "no";
  upLabel?: string;
  downLabel?: string;
  /** Market currency prefix for stock-axis labels ("$" | "HK$"). */
  currency?: string;
  /**
   * ST-1d · label for the day timeframe chip. Pre-session pages show
   * `Last session` (copy only — the chip's behaviour is unchanged).
   */
  todayChipLabel?: string;
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

// One timestamp per point, shown in the viewer's local time (全站用户时间). Before (2026-11-10 review):
// 48 points shared 8 fixed US-hour labels, so the axis read "9:30, 9:30, 10:30 ×4 … 15:30, 14:30",
// and quick rounds were labelled in UTC.
const SESSION_MS = 6.5 * 3600_000; // US 09:30–16:00 · HK 09:30–16:00 · KR 09:00–15:30

const buildPoints = (values: number[], times: Date[]): Point[] =>
  values.map((v, i) => ({ t: times.length ? formatLocalTime(times[Math.min(i, times.length - 1)]) : "", v }));

/** `n` evenly spaced instants from `start` to `end`. */
const spread = (start: Date, end: Date, n: number): Date[] => {
  const span = end.getTime() - start.getTime();
  return Array.from({ length: n }, (_, i) => new Date(start.getTime() + (span * i) / Math.max(1, n - 1)));
};

export const LiteStockChart = ({
  ticker,
  basePrice,
  currentPrice,
  upOdds,
  upHistory,
  endDate,
  startDate,
  side = "yes",
  upLabel = "Up",
  downLabel = "Down",
  currency = "$",
  todayChipLabel,
  className,
}: Props) => {
  const [tab, setTab] = useState<Tab>("stock");
  const narrow = useIsMobile();
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  // Side identity → MARKET axis. Only ever one of the two at a time.
  const isYesSide = side === "yes";
  const sideLabel = isYesSide ? upLabel : downLabel;

  // Time of each of the 48 points: a quick round spans its own window; a stock day spans the
  // session that ends at end_date (6.5 h). No end date → no time labels.
  const labels = useMemo(() => {
    const end = endDate ? new Date(endDate) : null;
    if (!end || Number.isNaN(end.getTime())) return [] as Date[];
    const start = startDate ? new Date(startDate) : null;
    const quick = start && !Number.isNaN(start.getTime()) && end.getTime() > start.getTime();
    return spread(quick ? start! : new Date(end.getTime() - SESSION_MS), end, 48);
  }, [startDate, endDate]);

  const stockSeries = useMemo(() => {
    if (!basePrice || !currentPrice) return [];
    // DEMO-STATE: synthetic intraday walk anchored on base_price → currentPrice.
    const amp = Math.max(basePrice * 0.006, 0.05);
    return buildPoints(synth(seed, basePrice, currentPrice, 48, amp), labels);
  }, [seed, basePrice, currentPrice, labels]);

  const oddsSeries = useMemo(() => {
    // Down odds are the complement of the Up walk, point by point.
    const toSide = (v: number) => (isYesSide ? v : 100 - v);
    if (upHistory && upHistory.length >= 4) {
      const scaled = upHistory.map((p) => toSide(Math.max(0, Math.min(100, p * 100))));
      return buildPoints(scaled, labels);
    }
    // DEMO-STATE: synthesize from 50¢ → current odds if no history rows.
    const end = Math.max(1, Math.min(99, Math.round(upOdds * 100)));
    const walk = synth(seed + 1, 50, end, 48, 3.2).map((v) =>
      toSide(Math.max(1, Math.min(99, v))),
    );
    return buildPoints(walk, labels);
  }, [upHistory, upOdds, seed, labels, isYesSide]);

  const showOddsToggle = true; // odds always available (synth fallback)

  const series = tab === "stock" ? stockSeries : oddsSeries;
  const lineColor =
    tab === "stock" ? "#C9CED6" : isYesSide ? "hsl(var(--yes))" : "hsl(var(--no))";
  const baseline = tab === "stock" ? basePrice : null;

  // Won has no minor unit → "₩1,136,000"; other markets keep cents.
  const px = (v: number) =>
    currency === "₩" ? `${currency}${Math.round(v).toLocaleString("en-US")}` : `${currency}${v.toFixed(2)}`;
  const yFmt = (v: number) => (tab === "stock" ? px(v) : `${Math.round(v)}¢`);
  // Axis gutter sized to the widest label (10px Space Grotesk ≈ 6.2px a glyph), so "HK$552.17" / "₩1,145,493" are never cut.
  const yMax = series.reduce((m, d) => Math.max(m, Number((d as { v?: number }).v ?? 0)), basePrice ?? 0);
  const yAxisW = Math.max(48, Math.ceil(yFmt(yMax).length * 6.2) + 6);

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
                  ? isYesSide
                    ? "bg-background text-yes shadow-sm"
                    : "bg-background text-no shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {sideLabel} odds ¢
            </button>
          )}
        </div>
        <div className="hidden gap-1 text-[11px] text-muted-foreground sm:flex">
          <span className="rounded bg-muted/40 px-2 py-0.5">1H</span>
          <span className="rounded bg-foreground/10 px-2 py-0.5 text-foreground">
            {todayChipLabel ?? "Today"}
          </span>
          <span className="rounded bg-muted/40 px-2 py-0.5">1W</span>
        </div>
      </div>

      <div className="h-[220px] w-full px-2 pb-3">
        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {t("spot.screen.lite_underlying_price_chart.no_data_yet")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <XAxis
                dataKey="t"
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                axisLine={false}
                interval={7}
                minTickGap={24}
              />
              <YAxis
                domain={[
                  (dataMin: number) => dataMin - Math.abs(dataMin) * 0.002 - 0.01,
                  (dataMax: number) => dataMax + Math.abs(dataMax) * 0.002 + 0.01,
                ]}
                tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "Space Grotesk" }}
                tickLine={false}
                axisLine={false}
                width={yAxisW}
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
                formatter={(value: number) => [
                  yFmt(value),
                  tab === "stock" ? ticker : `${sideLabel} odds`,
                ]}
              />
              {baseline != null && (
                <ReferenceLine
                  y={baseline}
                  stroke="#6B7280"
                  strokeDasharray="4 4"
                  // Phone: the line alone — the label sat on the line and the walk; the header row already says "Price to beat".
                  label={
                    narrow
                      ? undefined
                      : { value: `Price to beat ${px(baseline)}`, position: "insideTopRight", fill: "#9AA1AC", fontSize: 10 }
                  }
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