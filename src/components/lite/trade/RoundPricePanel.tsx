// ============================================================
// Round price panel — the price tab of a crypto Up/Down round chart
// (CPO 2026-11-16, canvas option B).
//
//   · the line is the LIVE price
//   · the settlement price (60-second average, decides Up or Down) is a
//     white horizontal line with a tag
//   · "Price to beat" stays the dashed line
//   · one status row above says who is ahead; one sentence below says why
//     the settlement price trails the live price
//
// Pure display: every number comes in through props.
// ============================================================
import { t } from "@/i18n";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  ReferenceDot,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatLocalTime } from "@/lib/usStockSessions";
import type { LivePoint } from "./roundLivePrice";

const K = "spot.screen.lite_underlying_price_chart";
const DISPLAY = "'Space Grotesk', ui-monospace, monospace";
const H = 220;

export interface RoundPriceProps {
  /** Live price series, round start → now. */
  points: LivePoint[];
  /** Live price right now (the line's last value). */
  livePrice: number | null;
  /** Settlement price right now — the 60-second average. */
  settlementPrice: number | null;
  /** Price to beat (the round's open). */
  priceToBeat: number | null;
  startMs: number;
  endMs: number;
  /** Round is over: "Final settlement price … Up won". */
  settled?: boolean;
  upLabel?: string;
  downLabel?: string;
  currency?: string;
}

const money = (currency: string, v: number) =>
  `${currency}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type VB = { x?: number; y?: number; width?: number; height?: number };

/**
 * White tag on the settlement line. It sits at the end of the plot the live
 * line has not reached (right early in the round, left later), and on the
 * side of its line that faces away from the price to beat — so the two
 * horizontal labels never share a corner.
 */
const SettlementTag = ({
  viewBox,
  text,
  small,
  atLeft,
  above,
}: {
  viewBox?: VB;
  text: string;
  small: boolean;
  atLeft: boolean;
  above: boolean;
}) => {
  const y = viewBox?.y ?? 0;
  const fs = small ? 9.5 : 10.5;
  const w = Math.ceil(text.length * fs * 0.58) + 16;
  const x = atLeft ? (viewBox?.x ?? 0) + 4 : (viewBox?.x ?? 0) + (viewBox?.width ?? 0) - w - 4;
  const top = above ? y - 24 : y + 5;
  return (
    <g>
      <rect x={x} y={top} width={w} height={19} rx={5} fill="#F2F4F7" />
      <text x={x + w / 2} y={top + 13} textAnchor="middle" fontSize={fs} fontWeight={600} fill="#0A0A10">
        {text}
      </text>
    </g>
  );
};

/** "Live price $x" beside the line's last point; flips left past the middle. */
const LiveTag = ({ viewBox, text, flip }: { viewBox?: VB; text: string; flip: boolean }) => {
  const cx = (viewBox?.x ?? 0) + (viewBox?.width ?? 0) / 2;
  const cy = (viewBox?.y ?? 0) + (viewBox?.height ?? 0) / 2;
  return (
    <text
      x={flip ? cx - 10 : cx + 10}
      y={cy + 3.5}
      textAnchor={flip ? "end" : "start"}
      fontSize={10.5}
      fill="#C9CED6"
      style={{ paintOrder: "stroke", stroke: "#14161B", strokeWidth: 4, strokeLinejoin: "round" }}
    >
      {text}
    </text>
  );
};

export const RoundPricePanel = ({
  points,
  livePrice,
  settlementPrice,
  priceToBeat,
  startMs,
  endMs,
  settled = false,
  upLabel = "Up",
  downLabel = "Down",
  currency = "$",
}: RoundPriceProps) => {
  const narrow = !!useIsMobile();
  const ready = points.length > 1 && livePrice != null && settlementPrice != null && priceToBeat != null;
  if (!ready) {
    return (
      <div className="flex w-full items-center justify-center px-2 pb-3 text-xs text-muted-foreground" style={{ height: H }}>
        {t(`${K}.no_data_yet`)}
      </div>
    );
  }

  const up = settlementPrice! > priceToBeat!;
  const side = up ? upLabel : downLabel;
  const diff = Math.abs(settlementPrice! - priceToBeat!);
  const sideColor = up ? "hsl(var(--yes))" : "hsl(var(--no))";
  const last = points[points.length - 1];
  const flip = (last.t - startMs) / (endMs - startMs) > 0.55;

  const vals = points.map((p) => p.v).concat([settlementPrice!, priceToBeat!]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.24, Math.abs(hi) * 0.00016);
  const yFmt = (v: number) => money(currency, v);
  const yAxisW = Math.max(48, Math.ceil(yFmt(hi).length * 6.2) + 6);
  const tickN = narrow ? 3 : 6;
  const ticks: number[] = Array.from({ length: tickN }, (_, i) => startMs + ((endMs - startMs) * i) / (tickN - 1));

  return (
    <>
      {/* Status row — who is ahead, by the price that decides it. */}
      <div
        className="flex flex-wrap items-baseline px-4 pb-2.5 pt-0.5 text-xs"
        style={{ columnGap: 10, rowGap: 4, color: "#AEB4BD" }}
        data-round-status
      >
        <span>{t(settled ? `${K}.settlement_final` : `${K}.settlement_now`)}</span>
        <span
          className="tabular-nums"
          style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}
        >
          {money(currency, settlementPrice!)}
        </span>
        <span>
          {t(up ? `${K}.above_price_to_beat` : `${K}.below_price_to_beat`, { amount: money(currency, diff) })} ·
        </span>
        <span style={{ color: sideColor, fontWeight: 600 }}>
          {t(settled ? `${K}.side_won` : `${K}.side_ahead`, { side })}
        </span>
      </div>

      <div className="w-full px-2 pb-2" style={{ height: H }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 14, bottom: 4, left: 0 }}>
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={[startMs, endMs]}
              ticks={ticks}
              tickFormatter={(v: number) => formatLocalTime(new Date(v))}
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[lo - pad, hi + pad]}
              tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "Space Grotesk" }}
              tickLine={false}
              axisLine={false}
              width={yAxisW}
              tickCount={4}
              tickFormatter={yFmt}
            />
            <Tooltip
              cursor={{ stroke: "#2B2F38", strokeDasharray: "3 3" }}
              contentStyle={{ background: "#131519", border: "1px solid #1D2026", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#9AA1AC" }}
              labelFormatter={(v: number) => formatLocalTime(new Date(v))}
              formatter={(value: number) => [yFmt(value), t(`${K}.live_price`)]}
            />
            <ReferenceLine
              y={priceToBeat!}
              stroke="#6B7280"
              strokeDasharray="4 4"
              // Phone too (CPO 2026-11-16): the two horizontal lines are compared, so both carry their name.
              label={{
                value: t(`${K}.price_to_beat_tag`, { price: money(currency, priceToBeat!) }),
                // recharts: insideTop* draws under the line, insideBottom* above it — keep the words on the far side from the settlement line.
                position: up ? (flip ? "insideTopLeft" : "insideTopRight") : flip ? "insideBottomLeft" : "insideBottomRight",
                fill: "#9AA1AC",
                fontSize: narrow ? 9.5 : 10.5,
              }}
            />
            <Line type="monotone" dataKey="v" stroke="#F2F4F7" strokeWidth={2.25} dot={false} isAnimationActive={false} />
            <ReferenceLine
              y={settlementPrice!}
              stroke="#F2F4F7"
              strokeWidth={1.5}
              label={
                <SettlementTag
                  small={narrow}
                  atLeft={flip}
                  above={up}
                  text={t(`${K}.settlement_tag`, { price: money(currency, settlementPrice!) })}
                />
              }
            />
            <ReferenceDot
              x={last.t}
              y={last.v}
              r={4}
              fill="#F2F4F7"
              stroke="none"
              label={<LiveTag flip={flip} text={t(`${K}.live_tag`, { price: money(currency, livePrice!) })} />}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="px-4 pb-3.5 text-[11.5px] leading-[1.45]" style={{ color: "#8B929B" }}>
        {t(`${K}.settlement_note`)}
      </div>
    </>
  );
};

export default RoundPricePanel;
