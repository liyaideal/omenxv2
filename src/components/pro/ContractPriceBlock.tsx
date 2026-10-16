// ============================================================
// ContractPriceBlock — the /trade terminal's chart price block, extracted
// verbatim from DesktopTrading (zero visual change) so the style-guide can
// mount the production piece. Row 1: last · change · ⚑ mark (product layer).
// Row 2: BaseSubline (business layer, rail-switch SOP 2026-10-16) — empty for
// events without a reference price.
// ============================================================
import { Flag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BaseSubline } from "@/components/pro/BaseSubline";
import type { EventBusinessMeta } from "@/hooks/useEventBusinessMeta";

export interface ContractPriceBlockProps {
  price: number;
  change: { isPositive: boolean; percentage: string };
  business: EventBusinessMeta;
}

export const ContractPriceBlock = ({ price, change, business }: ContractPriceBlockProps) => (
  <div className="px-4 py-2 border-b border-border/30">
    <div className="flex items-center gap-4">
      <span className="text-2xl font-bold font-mono">{price.toFixed(4)}</span>
      <span className={`text-sm font-mono ${change.isPositive ? "text-trading-green" : "text-trading-red"}`}>
        {change.isPositive ? "+" : ""}{change.percentage}%
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-trading-yellow font-mono flex items-center gap-1 cursor-help border-b border-dashed border-trading-yellow">
              <Flag className="w-3 h-3" /> {price.toFixed(4)}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] p-3">
            <p className="text-sm">Mark price is derived from the index price, and reflects the fair market price. Liquidation is triggered by mark price.</p>
            <p className="text-sm text-trading-yellow mt-2 cursor-pointer">Click here for details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    {/* Business-layer subline — same slot as /spot (SP-3-DT1); empty for non price-referenced events. */}
    <BaseSubline m={business} />
  </div>
);
