import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TierEligibility } from "@/hooks/useApiKeys";
import { TIER_META, TIER_ORDER } from "./tierMeta";

/** "You can create" summary chip row — ok / manual / locked per tier. */
export const TierQuickAnswer = ({ tiers }: { tiers: TierEligibility[] }) => {
  return (
    <div className="py-5 md:flex md:flex-wrap md:items-center md:gap-2 space-y-2 md:space-y-0">
      <span className="block md:inline text-[11px] uppercase tracking-wider text-muted-foreground md:mr-1">
        You can create
      </span>
      <div className="flex flex-wrap gap-2">
        {TIER_ORDER.map((tid) => {
          const t = tiers.find((x) => x.tier === tid)!;
          const meta = TIER_META[tid];
          const Icon = meta.icon;
          const state = t.manualReview ? "manual" : t.eligible ? "ok" : "locked";
          return (
            <span
              key={tid}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 md:py-1 rounded border text-[12px] md:text-[11px] font-medium",
                state === "ok" && meta.chip,
                state === "locked" && "bg-muted/40 text-muted-foreground/70 border-border/40",
                state === "manual" && "bg-amber-400/10 text-amber-400/90 border-amber-400/20",
              )}
            >
              <Icon className="w-3.5 h-3.5 md:w-3 md:h-3" />
              {meta.label}
              {state === "ok" && <Check className="w-3 h-3 opacity-80" />}
              {state === "manual" && <span className="opacity-80">· manual</span>}
              {state === "locked" && <X className="w-3 h-3 opacity-60" />}
            </span>
          );
        })}
      </div>
    </div>
  );
};
