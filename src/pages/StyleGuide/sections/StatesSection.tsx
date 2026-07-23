import { Inbox, KeyRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { EmptyState, LoadingState, ErrorState } from "@/components/states";
import { STATUS_STYLES, RISK_STYLES, type StatusKey, type RiskTier } from "@/lib/statusStyles";
import { cn } from "@/lib/utils";

interface StatesSectionProps {
  isMobile: boolean;
}

const STATUS_ORDER: StatusKey[] = ["success", "active", "pending", "error", "revoked", "neutral"];
const RISK_ORDER: RiskTier[] = ["SAFE", "WARNING", "RESTRICTION", "LIQUIDATION"];

export const StatesSection = ({ isMobile }: StatesSectionProps) => {
  return (
    <SectionWrapper
      id="states"
      title="States"
      description="Canonical empty / loading / error components and the status + risk color source. Every product page must use these primitives — never hand-roll a state string or badge class."
    >
      <div className="space-y-8">
        {/* EmptyState */}
        <SubSection title="EmptyState" description="Compact card or inline empty placeholder. Uses Lucide icons only.">
          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">variant="card"</div>
              <EmptyState
                icon={KeyRound}
                title="No API keys yet"
                description="Generate a signed key to start using the trading API."
                action={
                  <Button size="sm" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Create key
                  </Button>
                }
              />
            </div>
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">variant="inline"</div>
              <EmptyState
                variant="inline"
                icon={Inbox}
                title="Nothing here yet"
                description="Rows will appear once activity is recorded."
              />
            </div>
          </div>
        </SubSection>

        {/* LoadingState */}
        <SubSection title="LoadingState" description="Spinner for compact loads, skeleton rows for lists/tables.">
          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            <div className="rounded-lg border border-border/40 bg-muted/10">
              <div className="px-3 pt-3 text-[11px] uppercase tracking-wider text-muted-foreground">variant="spinner"</div>
              <LoadingState />
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">variant="skeleton" · 3 rows</div>
              <LoadingState variant="skeleton" skeletonRows={3} />
            </div>
          </div>
        </SubSection>

        {/* ErrorState */}
        <SubSection title="ErrorState" description="Destructive-tinted card. Retry button renders only when an onRetry handler is passed.">
          <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            <ErrorState />
            <ErrorState
              title="Couldn't load balances"
              description="Network error while fetching wallet data."
              onRetry={() => {}}
            />
          </div>
        </SubSection>

        {/* STATUS_STYLES */}
        <SubSection title="STATUS_STYLES" description="Shared status badge palette. Import from @/lib/statusStyles.">
          <div className="flex flex-wrap gap-2">
            {STATUS_ORDER.map((k) => (
              <span
                key={k}
                className={cn("inline-flex items-center px-2 py-1 rounded text-[11px] font-medium capitalize", STATUS_STYLES[k].badge)}
              >
                {k}
              </span>
            ))}
          </div>
        </SubSection>

        {/* RISK_STYLES */}
        <SubSection title="RISK_STYLES" description="Account risk 4-tier ladder (DESIGN.md §7). LIQUIDATION pulses via motion-safe:animate-pulse.">
          <div className="flex flex-wrap gap-2">
            {RISK_ORDER.map((tier) => {
              const s = RISK_STYLES[tier];
              return (
                <span
                  key={tier}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium",
                    s.badge,
                    s.emphasis,
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", s.bg)} />
                  {tier}
                </span>
              );
            })}
          </div>
        </SubSection>
      </div>
    </SectionWrapper>
  );
};

export default StatesSection;
