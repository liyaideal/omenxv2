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
  className?: string;
}

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
  className,
}: Props) => {
  const hasUnderlying = underlyingLabel != null && basePrice != null;
  const [tab, setTab] = useState<"underlying" | "odds">(
    hasUnderlying ? "underlying" : "odds",
  );
  const active = hasUnderlying ? tab : "odds";

  const seed = useMemo(
    () => (underlyingLabel || yesLabel).split("").reduce((a, c) => a + c.charCodeAt(0), 0),
    [underlyingLabel, yesLabel],
  );

  const data = useMemo(() => {
    if (active === "underlying" && basePrice != null) {
      const end = currentPrice ?? basePrice;
      const series = synth(seed, basePrice * 0.995, end, basePrice * 0.004);
      return series.map((v, i) => ({ i, v }));
    }
    const endOdds = yesOdds * 100;
    const series = synth(seed + 3, Math.max(3, endOdds - 9), endOdds, 2.2);
    return series.map((v, i) => ({ i, v: Math.max(1, Math.min(99, v)) }));
  }, [active, basePrice, currentPrice, yesOdds, seed]);

  const stroke = active === "underlying" ? "#33D6FF" : "#33D6FF";

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {active === "underlying" ? underlyingLabel : `${yesLabel} odds`}
        </div>
        <div className="flex gap-1 rounded-lg bg-muted/40 p-0.5">
          {hasUnderlying && (
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
          )}
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
            {yesLabel} odds ¢
          </button>
        </div>
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
            <XAxis dataKey="i" hide />
            <YAxis
              domain={active === "odds" ? [0, 100] : ["dataMin", "dataMax"]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) =>
                active === "odds" ? `${Math.round(v)}¢` : `$${Number(v).toFixed(0)}`
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
              formatter={(v: number) => [
                active === "odds" ? `${Math.round(v)}¢` : `$${Number(v).toFixed(2)}`,
                active === "odds" ? yesLabel : underlyingLabel || "",
              ]}
            />
            {active === "underlying" && basePrice != null && (
              <ReferenceLine
                y={basePrice}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
              />
            )}
            <Line
              type="monotone"
              dataKey="v"
              stroke={stroke}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LiteContractChart;
