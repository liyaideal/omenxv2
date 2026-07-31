// ============================================================
// Inline accordion chart for the multi-market board. Attaches directly
// beneath the selected board row (no divider line; squared top corners) —
// there is NO standalone chart module on multi pages.
// DEMO-STATE: the series is the same deterministic walk the Lite contract
// chart uses, anchored on the selected option+side's live chance.
// ============================================================
import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["1H", "Today", "1W", "All"] as const;
export type BoardTimeframe = (typeof TIMEFRAMES)[number];

const POINTS: Record<BoardTimeframe, number> = { "1H": 24, Today: 40, "1W": 56, All: 72 };
const AMP: Record<BoardTimeframe, number> = { "1H": 1.1, Today: 2.2, "1W": 4.5, All: 7 };

const synth = (seed: number, end: number, n: number, amp: number): number[] => {
  const rand = (i: number) => {
    const x = Math.sin(seed * 41.13 + i * 7.79) * 10000;
    return x - Math.floor(x);
  };
  const start = Math.max(2, end - amp * 2.5);
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const p = i / (n - 1);
    out.push(start + (end - start) * p + (rand(i) - 0.5) * 2 * amp + Math.sin(p * Math.PI * 1.6 + seed) * amp * 0.4);
  }
  return out;
};

interface Props {
  /** Consumer label of the selected side, e.g. "Yes" / "No". */
  sideLabel: string;
  isYes: boolean;
  /** 0..1 chance of the SELECTED side. */
  chance: number;
  /** Stable seed source — the option id. */
  seedKey: string;
  height?: number;
  className?: string;
}

export const LiteBoardChart = ({
  sideLabel,
  isYes,
  chance,
  seedKey,
  height = 220,
  className,
}: Props) => {
  const [tf, setTf] = useState<BoardTimeframe>("Today");
  const seed = useMemo(
    () => seedKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
    [seedKey],
  );
  const data = useMemo(() => {
    const end = Math.max(1, Math.min(99, chance * 100));
    return synth(seed, end, POINTS[tf], AMP[tf]).map((v, i) => ({
      i,
      v: Math.max(1, Math.min(99, v)),
    }));
  }, [seed, chance, tf]);

  const domain = useMemo<[number, number]>(() => {
    const vals = data.map((d) => d.v);
    let min = Math.min(...vals) - 6;
    let max = Math.max(...vals) + 6;
    if (max - min < 16) {
      const mid = (min + max) / 2;
      min = mid - 8;
      max = mid + 8;
    }
    return [Math.max(0, Math.round(min)), Math.min(100, Math.round(max))];
  }, [data]);

  return (
    <div className={cn("px-4 pb-3 pt-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {sideLabel} · chance over time
        </div>
        <div className="flex shrink-0 gap-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTf(t)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors",
                tf === t
                  ? "bg-white/7 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="relative w-full" style={{ height: height - 52 }}>
        <span
          className="pointer-events-none absolute right-1 top-0 z-10 font-mono tabular-nums"
          style={{ fontSize: 9, color: "#6B7280" }}
        >
          Sample data
        </span>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="i" hide />
            <YAxis
              domain={domain}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v: number) => `${Math.round(v)}¢`}
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
              formatter={(v: number) => [`${Math.round(v)}¢`, sideLabel]}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke={isYes ? "hsl(var(--yes))" : "hsl(var(--no))"}
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

export default LiteBoardChart;