// ============================================================
// Quick-round tile — one coin bound to the dial's timeframe.
// ============================================================
import { useNavigate } from "react-router-dom";
import { AssetAvatar } from "@/components/lite/AssetAvatar";
import { RoundPlot } from "./RoundPlot";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  COIN_META,
  Coin,
  QuickEvent,
  compactUsd,
  derivedPrice,
  downOptionOf,
  formatCountdown,
  seedFromId,
  upOptionOf,
} from "./intradayData";

const MICRO: React.CSSProperties = {
  fontSize: 9.5,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#6B7280",
};

export const QuickRoundTile = ({
  coin,
  event,
  history,
  tickSeconds,
  compact = false,
}: {
  coin: Coin;
  event: QuickEvent | null;
  history: ("up" | "down")[];
  tickSeconds: number;
  compact?: boolean;
}) => {
  const navigate = useNavigate();
  const meta = COIN_META[coin];
  const up = upOptionOf(event);
  const down = downOptionOf(event);
  const seed = event ? seedFromId(event.id) : 0;
  const base = event?.base_price ?? null;
  const upOdds = up ? up.price : 0.5;
  const price = derivedPrice(base, upOdds, seed, tickSeconds);
  const pct = base && price ? ((price - base) / base) * 100 : 0;
  const endMs = event?.end_date ? new Date(event.end_date).getTime() : null;
  const remaining = endMs != null ? endMs - Date.now() : 0;

  const go = (side?: "up" | "down") => {
    if (!event) return;
    navigate(
      `/spot?event=${encodeURIComponent(event.id)}${side ? `&side=${side}` : ""}`,
    );
  };

  const last8 = history.slice(-8);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => go()}
      onKeyDown={(e) => {
        if (e.key === "Enter") go();
      }}
      className="cursor-pointer text-left"
      style={{
        background: "#131519",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 15,
        overflow: "hidden",
        minWidth: compact ? 300 : undefined,
        maxWidth: compact ? 300 : undefined,
        scrollSnapAlign: compact ? "start" : undefined,
      }}
    >
      {/* top row */}
      <div className="flex items-start gap-[10px]" style={{ padding: "12px 12px 10px" }}>
        <AssetAvatar symbol={meta.ticker} kind="crypto" size={34} />
        <div className="min-w-0 flex-1">
          <div
            className="font-display"
            style={{ fontSize: 11, letterSpacing: ".08em", color: "#C9CED6" }}
          >
            {meta.ticker}
          </div>
          <div className="flex items-baseline gap-[7px]">
            <span className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
              {price != null
                ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </span>
            <span
              className="font-display"
              style={{ fontSize: 12, color: pct >= 0 ? "#3FD68C" : "#FF5A5F" }}
            >
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <div style={MICRO}>Closes in</div>
          <div
            className="font-display"
            style={{ fontSize: 19, fontWeight: 700, color: "#FF8A3D", lineHeight: 1.1 }}
          >
            {event ? formatCountdown(remaining) : "--:--"}
          </div>
        </div>
      </div>

      {/* plot + overlays */}
      <div className="relative">
        {base != null && price != null ? (
          <RoundPlot
            eventId={event!.id}
            basePrice={base}
            currentPrice={price}
            upOdds={upOdds}
            height={120}
          />
        ) : (
          <div style={{ height: 120, background: "#0C1013" }} />
        )}

        <span
          className="absolute font-display"
          style={{ left: 10, top: 8, fontSize: 10.5, letterSpacing: ".08em", color: "#33D6FF", textTransform: "uppercase" }}
        >
          ▲ Up
        </span>
        <span
          className="absolute font-display"
          style={{ left: 10, bottom: 8, fontSize: 10.5, letterSpacing: ".08em", color: "#CFFF4A", textTransform: "uppercase" }}
        >
          ▼ Down
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go("up");
          }}
          className="absolute font-display"
          style={{
            right: 10,
            top: 8,
            background: "rgba(51,214,255,.13)",
            border: "1.5px solid rgba(51,214,255,.4)",
            color: "#33D6FF",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 9,
            padding: "3px 9px",
          }}
        >
          {Math.round((up?.price ?? 0.5) * 100)}¢
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go("down");
          }}
          className="absolute font-display"
          style={{
            right: 10,
            bottom: 8,
            background: "rgba(207,255,74,.13)",
            border: "1.5px solid rgba(207,255,74,.4)",
            color: "#CFFF4A",
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 9,
            padding: "3px 9px",
          }}
        >
          {Math.round((down?.price ?? 0.5) * 100)}¢
        </button>
      </div>

      {/* footer */}
      <div
        className="flex items-center gap-[8px]"
        style={{ padding: "10px 12px 12px" }}
      >
        <span style={MICRO}>Last 8 rounds</span>
        <TooltipProvider delayDuration={120}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="flex items-center gap-[3px]"
                aria-label="Last 8 rounds — ▲ Up won · ▼ Down won"
              >
          {Array.from({ length: 8 }).map((_, i) => {
            const v = last8[i - (8 - last8.length)];
            return (
              <span
                key={i}
                style={{
                  width: 7,
                  height: 14,
                  borderRadius: 3,
                  background:
                    v === "up"
                      ? "rgba(51,214,255,.7)"
                      : v === "down"
                        ? "rgba(207,255,74,.55)"
                        : "#1D2026",
                }}
              />
            );
          })}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Last 8 rounds — <span style={{ color: "#33D6FF" }}>▲</span> Up won ·{" "}
              <span style={{ color: "#CFFF4A" }}>▼</span> Down won
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="flex-1" />
        <span className="font-display" style={{ fontSize: 11, color: "#6B7280" }}>
          {compactUsd(event?.volume ?? 0)} traded
        </span>
      </div>
    </div>
  );
};

export default QuickRoundTile;