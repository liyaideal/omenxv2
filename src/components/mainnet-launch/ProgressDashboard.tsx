import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Countdown } from "./Countdown";
import { SectionShell, SectionTitle } from "./SectionShell";
import { formatUsd } from "@/lib/mainnetLaunch";
import { useMainnetLaunchProgress } from "@/hooks/useMainnetLaunchProgress";

type ProgressOverride = ReturnType<typeof useMainnetLaunchProgress>;

interface Props {
  onCta: (section: string) => void;
  /** Optional override — bypasses the live hook. Used by the campaign style guide playground. */
  progressOverride?: Partial<ProgressOverride> & { user: unknown; event1Qualified: boolean };
}

export const ProgressDashboard = ({ onCta, progressOverride }: Props) => {
  const live = useMainnetLaunchProgress();
  const source = progressOverride ?? live;
  const { user, event1Qualified, volume = 0, currentTier = null, nextTier = null, progressToNext = 0, volumeToNextTier = 0 } = source as ProgressOverride;

  if (!user || !event1Qualified) return null;

  const rows = [
    ["First-trade bonus", "Unlocked", "$2 – $50 USDC on the way"],
    ["Current tier", currentTier ? `${formatUsd(currentTier.volume, true)} volume` : "Not yet on the ladder", currentTier ? `$${currentTier.rebate} rebate locked in` : "trade more to qualify"],
    ["Next tier", nextTier ? `${formatUsd(nextTier.volume, true)} volume` : "Top tier reached", nextTier ? `${formatUsd(volumeToNextTier)} to go` : "all tiers unlocked"],
    ["Time left", <Countdown key="countdown" compact />, "closes May 28"],
  ] as const;

  return (
    <SectionShell className="bg-mainnet-surface/30">
      <SectionTitle eyebrow="Your progress" title="You're in. Here's where you stand." desc="You've cleared the $5K bonus threshold. Now every trade pushes you up the rebate ladder." />

      <div className="rounded-sm border border-border/50 bg-background/40 p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Total Volume</p>
            <h3 className="mt-2 font-mono text-4xl font-semibold tracking-[-0.04em] text-foreground md:text-6xl">{formatUsd(volume)}</h3>
          </div>
          <div className="flex items-center gap-2 border border-trading-green/25 bg-trading-green/10 px-3 py-2 font-mono text-xs text-trading-green">
            <CheckCircle2 className="h-4 w-4" />
            bonus unlocked
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span>{currentTier ? `Now at ${formatUsd(currentTier.volume, true)}` : "Not yet on the ladder"}</span>
            <span>{nextTier ? `${Math.round(progressToNext)}% to ${formatUsd(nextTier.volume, true)}` : "Top tier"}</span>
          </div>
          <Progress value={progressToNext} className="h-2 rounded-none bg-mainnet-gold/10 [&>div]:rounded-none [&>div]:bg-mainnet-gold" />
        </div>

        <div className="mt-7 grid border-t border-l border-border/40 md:grid-cols-4">
          {rows.map(([label, value, detail]) => (
            <div key={label} className="border-b border-r border-border/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
              <div className="mt-3 font-mono text-lg font-semibold text-foreground">{value}</div>
              <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Button onClick={() => onCta("progress")} className="w-full gap-2 rounded-sm bg-mainnet-gold font-mono text-background hover:bg-mainnet-gold/90 md:w-auto">
          Place a trade <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </SectionShell>
  );
};
