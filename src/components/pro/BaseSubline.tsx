// ============================================================
// BaseSubline — the business-layer subline under the chart price block
// (SP-3-DT1: Base / Prior Close belong to the chart price block's subline).
// Shared by both Pro terminals (/spot, /trade); renders nothing for events
// without a reference price. Rail-switch SOP 2026-10-16.
//
//   Base $82,621.56 ⓘ · as of Fri 04:00 (Oct 15 close)
//   Open $82,621.56 ⓘ · 14:05–14:10
// ============================================================
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { basePriceText, type EventBusinessMeta } from "@/hooks/useEventBusinessMeta";

export const BaseSubline = ({ m, className = "" }: { m: EventBusinessMeta; className?: string }) => {
  if (!m.isPriceRef || m.basePrice == null) return null;
  return (
    <div data-base-subline className={`text-xs text-muted-foreground flex items-center gap-1 ${className}`}>
      <span>
        {m.baseWord} <span className="font-mono">{basePriceText(m)}</span>
      </span>
      {m.settleRule && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="How this event settles"
                className="inline-flex items-center text-muted-foreground hover:text-foreground cursor-help"
              >
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] p-3">
              <p className="text-sm">{m.settleRule}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {m.timeClause && <span>· {m.timeClause}</span>}
    </div>
  );
};
