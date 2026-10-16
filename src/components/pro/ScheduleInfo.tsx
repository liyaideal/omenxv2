// ============================================================
// ScheduleInfo — the mobile countdown row's business-layer tail, shared by
// both Pro terminals (rail-switch SOP 2026-10-16, mobile follow-up):
//
//   ● Ends in 00:09:46 · 15:30–15:45 ⓘ        (crypto quick round)
//   ● Ends in 12:12:42 · Base Fri 04:00 ⓘ     (daily stock)
//
// The ⓘ popover carries what the desktop subline shows in full — the base
// line with the market trading day, the settle rule — plus the schedule rows
// the spot terminal already had. Renders nothing for events without a
// reference price. Mounted through MobileHeader's `statsExtra` slot.
// ============================================================
import { Info } from "lucide-react";
import { t as tr } from "@/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { EventBusinessMeta } from "@/hooks/useEventBusinessMeta";

export interface ScheduleInfoProps {
  m: EventBusinessMeta;
  /** Override the clock strings (the spot terminal passes its own freeze/close/settle). */
  schedule?: { tradingEnds: string | null; close: string | null; settle: string | null };
}

export const ScheduleInfo = ({ m, schedule }: ScheduleInfoProps) => {
  if (!m.isPriceRef) return null;
  const s = schedule ?? m.schedule;
  const isCrypto = m.market.key === "crypto";
  return (
    // `-ml-2.5` pulls the clause to 6px after the countdown inside the header's gap-4 row.
    <div data-schedule-info className="flex items-center gap-1.5 -ml-2.5">
      {m.mobileClause && <span className="text-xs text-muted-foreground whitespace-nowrap">· {m.mobileClause}</span>}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="p-0.5 text-muted-foreground" aria-label={tr("spot.screen.pro_spot_sections.schedule_details")}>
            <Info className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="center" className="text-[11px] max-w-[280px] p-2">
          <div className="space-y-1">
            {m.baseLine && <div>{m.baseLine}</div>}
            {m.settleRule && <div className="text-foreground/90">{m.settleRule}</div>}
            {(m.baseLine || m.settleRule) && <div className="border-t border-border/40 my-1" />}
            {isCrypto ? (
              <>
                <div><span className="text-muted-foreground">{tr("spot.screen.pro_spot_sections.trading_ends")}</span> {s.tradingEnds ?? "—"}</div>
                <div><span className="text-muted-foreground">Payout:</span> ~{s.settle ?? "—"}</div>
              </>
            ) : (
              <>
                <div><span className="text-muted-foreground">{tr("spot.screen.pro_spot_sections.opens")}</span> after prior close (extended trading)</div>
                <div><span className="text-muted-foreground">{tr("spot.screen.pro_spot_sections.trading_ends")}</span> {s.tradingEnds ?? "—"}</div>
                <div><span className="text-muted-foreground">Official close:</span> {s.close ?? "—"} (settlement price)</div>
                <div><span className="text-muted-foreground">Payout by:</span> ~{s.settle ?? "—"}</div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
