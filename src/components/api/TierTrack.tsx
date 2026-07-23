import { Check, X, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/statusStyles";
import type { ApiTier, TierEligibility } from "@/hooks/useApiKeys";
import { TIER_META, TIER_ORDER } from "./tierMeta";

export const TierSegment = ({ tier, current }: { tier: TierEligibility; current: boolean }) => {
  const meta = TIER_META[tier.tier];
  const Icon = meta.icon;
  const statusBadge = tier.manualReview ? (
    <Badge variant="outline" className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-[10px]">
      Manual approval
    </Badge>
  ) : tier.eligible ? (
    <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES.success.badge)}>
      Available
    </Badge>
  ) : (
    <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES.neutral.badge)}>
      Requirements not met
    </Badge>
  );

  return (
    <div
      className={cn(
        "p-4 md:p-5 flex flex-col gap-3 transition-colors hover:bg-muted/20",
        current && meta.surfaceHint,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn("w-4 h-4 shrink-0", meta.accent)} />
          <div className="text-[15px] md:text-sm font-semibold text-foreground truncate">{meta.label}</div>
          {current && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 border border-border/40 px-1 rounded">
              you
            </span>
          )}
        </div>
        {statusBadge}
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{tier.description}</p>
      <ul className="space-y-1.5">
        {tier.requirements.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            {r.met ? (
              <Check className="w-3.5 h-3.5 text-trading-green mt-0.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
            )}
            <span className={r.met ? "text-foreground" : "text-muted-foreground"}>
              {r.label}
              {r.hint && !r.met && (
                <span className="block text-[10px] text-muted-foreground/70 mt-0.5">{r.hint}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {tier.manualReview && (
        <a href="mailto:api@omenx.io?subject=Pro%2FMM%20API%20access%20request" className="mt-1">
          <Button variant="outline" size="sm" className="w-full h-10 md:h-8 gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Contact us
          </Button>
        </a>
      )}
    </div>
  );
};


export const TierTrack = ({
  tiers,
  highestEligible,
}: {
  tiers: TierEligibility[];
  highestEligible?: ApiTier;
}) => {
  return (
    <div className="relative border-y border-border/40">
      {/* Top progress rail (desktop only) */}
      <div className="hidden md:block absolute inset-x-0 top-0 h-px bg-gradient-to-r from-border via-border to-primary/60" />
      {/* Progress nodes on the rail */}
      <div className="hidden md:grid absolute inset-x-0 -top-[5px] grid-cols-3 pointer-events-none">
        {TIER_ORDER.map((tid) => {
          const t = tiers.find((x) => x.tier === tid)!;
          const meta = TIER_META[tid];
          const active = t.eligible || t.manualReview;
          return (
            <div key={tid} className="flex justify-start pl-4">
              <span
                className={cn(
                  "block w-[10px] h-[10px] rounded-full border",
                  active ? cn(meta.dotFill, "border-transparent") : "bg-background border-border",
                )}
              />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-border/40">
        {TIER_ORDER.map((tid) => {
          const t = tiers.find((x) => x.tier === tid)!;
          const isCurrent = highestEligible === tid;
          return <TierSegment key={tid} tier={t} current={isCurrent} />;
        })}
      </div>
    </div>
  );
};
