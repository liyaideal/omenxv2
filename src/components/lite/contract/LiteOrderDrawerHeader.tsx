import { t } from "@/i18n";
import { cn } from "@/lib/utils";
import { SportsClockLabel, type SportsClock } from "@/components/lite/sports/sportsClock";

// ============================================================
// Mobile buy-drawer header (Lite contract): side chip + market line, then
// one time line (CTO 2026-11-16):
//   sports        Kicks off in 16h 08m · 78% chance Magic wins  (live: match clock)
//   rounds        Closes in 12:30 · 64% chance
//   long-running  Expected to end in 45d · 31% chance
// The time words for non-sports come from the page (`timeLabel`).
// ============================================================
export const LiteOrderDrawerHeader = ({
  side,
  sideLabel,
  contextLine,
  sportsClock,
  timeLabel,
  sidePrice,
}: {
  side: "yes" | "no";
  sideLabel: string;
  contextLine: string;
  sportsClock: SportsClock | null;
  timeLabel: string;
  sidePrice: number;
}) => {
  const pct = Math.round(sidePrice * 100);
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-semibold",
            side === "yes" ? "bg-yes/14 text-yes" : "bg-no/14 text-no",
          )}
        >
          {sideLabel}
        </span>
        <span className="truncate text-sm font-semibold">{contextLine}</span>
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {sportsClock ? (
          <>
            <SportsClockLabel clock={sportsClock} variant="line" /> ·{" "}
          </>
        ) : timeLabel ? (
          `${timeLabel} · `
        ) : null}
        {sportsClock
          ? t("trade.screen.lite.lite_contract_order_panel.chance_side_wins", { pct, side: sideLabel })
          : t("trade.screen.lite.lite_contract_order_panel.chance", { pct })}
      </div>
    </div>
  );
};
