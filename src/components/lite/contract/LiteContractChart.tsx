// ============================================================
// Lite contract chart — toggles between the underlying price (when
// events.base_price exists) and Yes odds in cents.
// DEMO-STATE: series are a deterministic front-end walk anchored on
// base_price / the live odds until price_history is wired in.
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

interface Props {
  underlyingLabel: string | null; // e.g. "BTC price"
  basePrice: number | null; // target line
  currentPrice: number | null;
  yesOdds: number; // 0..1
  yesLabel: string;
  noLabel: string;
  /** Side selected in the order card — the odds series follows it. */
  side: "yes" | "no";
  /**
   * Real Yes-odds history (0..1, oldest first) from price_history. When
   * present it replaces the synthetic walk and the sample watermark.
   */
  oddsHistory?: number[] | null;
  /** Multi-option settled chance chart — one line per option. */
  multiSeries?: MultiSeries[] | null;
  /** Label for the dashed reference level in the price view. */
  targetLabel?: string;
  className?: string;
}

export interface MultiSeries {
  id: string;
  label: string;
  points: number[]; // 0..1 odds, oldest first
  isWinner: boolean;
}

/** Low-saturation muted hues for the losing lines (winner is bright white). */
const MULTI_HUES = ["#6E8AA6", "#8A7FA0", "#8A8069", "#6E9A8A", "#9A6E7F", "#7A8A6E"];

const POINTS = 40;

const synth = (seed: number, base: number, end: number, amp: number): number[] => {
  const out: number[] = [];
  const rand = (i: number) => {
    const x = Math.sin(seed * 41.13 + i * 7.79) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < POINTS; i += 1) {
    const p = i / (POINTS - 1);
    const drift = (rand(i) - 0.5) * 2 * amp;
    const wave = Math.sin(p * Math.PI * 1.6 + seed) * amp * 0.4;
    out.push(base + (end - base) * p + drift + wave);
  }
  return out;
};

export const LiteContractChart = ({
  underlyingLabel,
  basePrice,
  currentPrice,
  yesOdds,
  yesLabel,
  noLabel,
  side,
  oddsHistory,
  multiSeries,
  targetLabel,
  className,
}: Props) => {
  const isMulti = !!multiSeries && multiSeries.length > 0;
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const hasUnderlying = underlyingLabel != null && basePrice != null;
  const [tab, setTab] = useState<"underlying" | "odds">(
    hasUnderlying ? "underlying" : "odds",
  );
  const active = hasUnderlying ? tab : "odds";
  // Side identity → MARKET axis. Only ever one of the two at a time.
  const isYesSide = side === "yes";
  const sideLabel = isYesSide ? yesLabel : noLabel;

  const seed = useMemo(
    () => (underlyingLabel || yesLabel).split("").reduce((a, c) => a + c.charCodeAt(0), 0),
    [underlyingLabel, yesLabel],
  );

  const data = useMemo(() => {
    if (isMulti) {
      const len = Math.max(...multiSeries!.map((s) => s.points.length), 0);
      return Array.from({ length: len }, (_, i) => {
        const row: Record<string, number> = { i };
        multiSeries!.forEach((s) => {
          const v = s.points[i];
          if (v != null) row[s.id] = Math.max(1, Math.min(99, v * 100));
        });
        return row;
      });
    }
    if (active === "underlying" && basePrice != null) {
      const end = currentPrice ?? basePrice;
      const series = synth(seed, basePrice * 0.995, end, basePrice * 0.004);
      return series.map((v, i) => ({ i, v }));
    }
    if (oddsHistory && oddsHistory.length > 1) {
      return oddsHistory.map((o, i) => {
        const yesV = Math.max(1, Math.min(99, o * 100));
        return { i, v: isYesSide ? yesV : 100 - yesV };
      });
    }
    const endOdds = yesOdds * 100;
    const series = synth(seed + 3, Math.max(3, endOdds - 9), endOdds, 2.2);
    // The No series is the complement of the Yes walk, point by point.
    return series.map((v, i) => {
      const yesV = Math.max(1, Math.min(99, v));
      return { i, v: isYesSide ? yesV : 100 - yesV };
    });
  }, [active, basePrice, currentPrice, yesOdds, seed, isYesSide, oddsHistory, isMulti, multiSeries]);

  // Underlying = neutral foreground line; odds = market-axis Yes colour.
  const stroke =
    active === "underlying"
      ? "hsl(var(--foreground))"
      : isYesSide
        ? "hsl(var(--yes))"
        : "hsl(var(--no))";

  // Odds domain adapts to the series (±8¢ padding, min 20¢ span) so a flat
  // walk doesn't render as a dead line across a full 0–100 axis.
  const oddsDomain = useMemo<[number, number]>(() => {
    const vals = isMulti
      ? data.flatMap((d) =>
          Object.entries(d)
            .filter(([k]) => k !== "i")
            .map(([, v]) => v as number),
        )
      : (data as { v: number }[]).map((d) => d.v);
    if (vals.length === 0) return [0, 100];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    let min = lo - 8;
    let max = hi + 8;
    if (max - min < 20) {
      const mid = (min + max) / 2;
      min = mid - 10;
      max = mid + 10;
    }
    return [Math.max(0, Math.round(min)), Math.min(100, Math.round(max))];
  }, [data, isMulti]);

  const isReal = isMulti || (!!oddsHistory && oddsHistory.length > 1 && active === "odds");

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {isMulti
            ? "Chance"
            : active === "underlying"
              ? underlyingLabel
              : `${sideLabel} odds`}
        </div>
        {hasUnderlying && !isMulti && (
        <div className="flex gap-1 rounded-lg bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setTab("underlying")}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                active === "underlying"
                  ? "bg-white text-[#0A0B0D]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {underlyingLabel}
            </button>
          <button
            type="button"
            onClick={() => setTab("odds")}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              active === "odds"
                ? "bg-white text-[#0A0B0D]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {sideLabel} odds ¢
          </button>
        </div>
        )}
      </div>
      <div className="relative h-[180px] w-full">
        {!isReal && (
          <span
            className="pointer-events-none absolute right-1 top-1 z-10 font-mono tabular-nums"
            style={{ fontSize: 9, color: "#6B7280" }}
          >
            Sample data
          </span>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="i" hide />
            <YAxis
              domain={isMulti || active === "odds" ? oddsDomain : ["dataMin", "dataMax"]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) =>
                isMulti || active === "odds"
                  ? `${Math.round(v)}¢`
                  : `$${Number(v).toFixed(0)}`
              }
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 10,
                fontSize: 11,
              }}
              labelFormatter={() => ""}
              formatter={(v: number, name: string) => [
                isMulti || active === "odds"
                  ? `${Math.round(v)}¢`
                  : `$${Number(v).toFixed(2)}`,
                isMulti
                  ? multiSeries!.find((s) => s.id === name)?.label || name
                  : active === "odds"
                    ? sideLabel
                    : underlyingLabel || "",
              ]}
            />
            {!isMulti && active === "underlying" && basePrice != null && (
              <ReferenceLine
                y={basePrice}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{
                  value: targetLabel || "Needed",
                  position: "insideTopLeft",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
            )}
            {isMulti ? (
              multiSeries!
                .filter((s) => !hidden[s.id])
                .map((s, i) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.id}
                    stroke={s.isWinner ? "#F2F3F5" : MULTI_HUES[i % MULTI_HUES.length]}
                    strokeWidth={s.isWinner ? 2.4 : 1.6}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))
            ) : (
              <Line
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {isMulti && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {multiSeries!.map((s, i) => {
            const off = !!hidden[s.id];
            const colour = s.isWinner
              ? "#F2F3F5"
              : MULTI_HUES[i % MULTI_HUES.length];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setHidden((h) => ({ ...h, [s.id]: !h[s.id] }))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] transition-opacity",
                  off ? "opacity-40" : "opacity-100",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: colour }}
                />
                <span style={{ color: s.isWinner ? "#F2F3F5" : undefined }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiteContractChart;
