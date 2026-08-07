import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAINNET_REBATE_TIERS, formatUsd } from "@/lib/mainnetLaunch";
import { SectionShell, SectionTitle } from "./SectionShell";
import { useMainnetLaunchProgress } from "@/hooks/useMainnetLaunchProgress";
import { cn } from "@/lib/utils";

interface Props {
  onCta: (section: string) => void;
  /** Optional override — bypasses the live hook. Used by the campaign style guide playground. */
  progressOverride?: { user: unknown; volume: number; currentTier: { volume: number; rebate: number } | null };
}

export const RewardLadder = ({ onCta, progressOverride }: Props) => {
  const live = useMainnetLaunchProgress();
  const { user, volume, currentTier } = progressOverride ?? live;
  const maxTierVolume = MAINNET_REBATE_TIERS[MAINNET_REBATE_TIERS.length - 1].volume;

  return (
    <SectionShell className="bg-mainnet-surface/30">
      <SectionTitle
        eyebrow="Volume rebates"
        title="Trade more, earn more."
        desc="You get paid for the highest tier you hit. Reach $1M and we send you $200."
      />

      <div className="overflow-hidden rounded-md border border-border/50 bg-background/30">
        {/* Header — mobile: 2 cols / desktop: 3 cols */}
        <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border/40 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:grid-cols-[1.4fr_0.8fr_1.6fr] md:px-6">
          <span>Volume</span>
          <span className="text-right md:text-left">Rebate</span>
          <span className="hidden md:inline">Progress</span>
        </div>

        {MAINNET_REBATE_TIERS.map((tier) => {
          const reached = !!user && volume >= tier.volume;
          const active = !!user && currentTier?.volume === tier.volume;
          const isMax = tier.volume === maxTierVolume;
          const fillPct = Math.min(100, (tier.volume / maxTierVolume) * 100);

          return (
            <div
              key={tier.volume}
              className={cn(
                "relative grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border/30 px-4 py-3.5 transition-colors last:border-b-0 md:grid-cols-[1.4fr_0.8fr_1.6fr] md:py-4 md:px-6",
                active && "bg-mainnet-gold/10",
                reached && !active && "bg-mainnet-gold/[0.04]",
                (active || reached || isMax) && "border-l-2 border-l-mainnet-gold md:border-l-0",
              )}
            >
              <span className={cn("font-mono text-base font-semibold text-foreground md:text-lg", isMax && "text-mainnet-gold")}>
                {formatUsd(tier.volume, true)}
              </span>

              <div className="flex items-center justify-end gap-2 md:justify-start">
                <span className={cn("font-mono text-base font-semibold md:text-lg", reached || isMax ? "text-mainnet-gold" : "text-foreground")}>
                  ${tier.rebate}
                </span>
                {/* Mobile-only inline status pill */}
                {active && (
                  <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.14em] text-mainnet-gold md:hidden">
                    · You're here
                  </span>
                )}
                {!active && isMax && (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.14em] text-mainnet-gold md:hidden">
                    <Sparkles className="h-3 w-3" />
                  </span>
                )}
              </div>

              {/* Desktop progress column */}
              <div className="hidden items-center gap-3 md:flex">
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-border/40">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-500",
                      reached || isMax ? "bg-mainnet-gold" : "bg-border",
                    )}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                {active && (
                  <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-mainnet-gold">
                    You're here
                  </span>
                )}
                {!active && isMax && (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-mainnet-gold">
                    <Sparkles className="h-3 w-3" />
                    Top tier
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-4 border border-border/40 bg-background/30 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>Whatever tier you're at on May 28, that's what you get paid. Your first $5K counts twice — toward the bonus and toward the ladder.</span>
        <Button onClick={() => onCta("ladder")} className="h-11 w-full gap-2 rounded-sm bg-mainnet-gold font-mono text-background hover:bg-mainnet-gold/90 md:h-10 md:w-auto">
          Start climbing <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </SectionShell>
  );
};
