import { Gift } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { H2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";

/**
 * H2E Rewards card — pure presentational, props-driven.
 * Extracted verbatim out of the Wallet component (same JSX) so /style-guide
 * can mount the real card instead of a replica. /wallet keeps rendering it.
 */
export const H2eRewardsCard = ({
  h2e,
  showUnlockToast = false,
}: {
  h2e: H2eRewardsSummary;
  showUnlockToast?: boolean;
}) => {

  
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Hedge Airdrop Rewards</span>
      </div>

      {/* Earnings cap */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Earned / Cap</span>
          <span className="font-mono font-semibold">${h2e.totalEarned.toFixed(2)} / ${h2e.earningsCap}</span>
        </div>
        <Progress value={h2e.earningsPercent} className="h-1.5" />
      </div>

      {/* Volume unlock */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Withdrawal unlock progress</span>
          <span className="font-mono font-semibold">
            ${h2e.volumeCompleted.toLocaleString()} / ${(h2e.nextTierVolume ?? h2e.volumeRequired).toLocaleString()}
          </span>
        </div>
        <div className="hidden pt-3 sm:block">
          <div className="relative px-1">
            <div className="absolute left-1 right-1 top-3 h-px bg-border/70" />
            <div
              className="absolute left-1 top-3 h-px bg-primary transition-all duration-500"
              style={{ width: `${Math.min((h2e.volumeCompleted / h2e.volumeRequired) * 100, 100)}%` }}
            />
            <div className="relative grid grid-cols-6 gap-3">
              {h2e.unlockTiers.map((tier) => {
                const isReached = h2e.volumeCompleted >= tier.volume;
                const isNext = h2e.nextTierVolume === tier.volume;
                const isStarter = tier.volume === 0;

                return (
                  <div key={tier.volume} className="flex flex-col items-center text-center">
                    <span
                      className={`relative z-10 h-6 w-6 rounded-full border-2 bg-background transition-all duration-300 ${
                        isStarter
                          ? "border-trading-green/60"
                          : isReached
                            ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
                            : isNext
                              ? "border-primary/70 shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]"
                              : "border-border"
                      }`}
                    >
                      {!isStarter && isReached && showUnlockToast && tier.percent === h2e.unlockedPercent && (
                        <span className="absolute -inset-1 rounded-full border border-primary/60 animate-scale-in" />
                      )}
                    </span>
                    <span className={`mt-2 font-mono text-[11px] font-semibold ${isStarter ? "text-trading-green" : isReached || isNext ? "text-foreground" : "text-muted-foreground"}`}>
                      {isStarter ? `+$${h2e.starterUnlock}` : `${tier.percent}%`}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {isStarter ? "Starter" : `$${(tier.volume / 1000).toFixed(0)}K`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="space-y-2 rounded-lg border border-border/40 bg-muted/10 p-3 sm:hidden">
          {!h2e.isFullyUnlocked && (
            <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2">
              <div className="text-[10px] uppercase text-muted-foreground">Next unlock</div>
              <div className="mt-0.5 flex items-center justify-between text-xs">
                <span className="font-medium">{h2e.nextTierPercent}% at ${(h2e.nextTierVolume ?? h2e.volumeRequired).toLocaleString()}</span>
                <span className="font-mono text-primary">${h2e.volumeToNextTier.toLocaleString()} left</span>
              </div>
            </div>
          )}
          <div className="space-y-0.5">
            {h2e.unlockTiers.map((tier, index) => {
              const isReached = h2e.volumeCompleted >= tier.volume;
              const isNext = h2e.nextTierVolume === tier.volume;
              const isLast = index === h2e.unlockTiers.length - 1;
              const isStarter = tier.volume === 0;

              return (
                <div key={tier.volume} className="relative flex gap-3 pb-2 last:pb-0">
                  {!isLast && <div className={`absolute left-[7px] top-5 h-[calc(100%-12px)] w-px ${isReached ? "bg-primary/60" : "bg-border/70"}`} />}
                  <span
                    className={`relative mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 bg-background transition-all duration-300 ${
                      isStarter
                        ? "border-trading-green/60"
                        : isReached
                          ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
                          : isNext
                            ? "border-primary/70"
                            : "border-border"
                    }`}
                  >
                    {!isStarter && isReached && showUnlockToast && tier.percent === h2e.unlockedPercent && (
                      <span className="absolute -inset-1 rounded-full border border-primary/60 animate-scale-in" />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <div>
                      <div className={`text-xs font-medium ${isStarter ? "text-trading-green" : isReached || isNext ? "text-foreground" : "text-muted-foreground"}`}>
                        {isStarter ? `Starter unlock +$${h2e.starterUnlock}` : `${tier.percent}% unlock`}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {isStarter ? "Included — independent of this program" : `$${(tier.volume / 1000).toFixed(0)}K volume`}
                      </div>
                    </div>
                    <span className={`text-[10px] ${isStarter ? "text-trading-green" : isReached ? "text-primary" : isNext ? "text-foreground" : "text-muted-foreground"}`}>
                      {isStarter ? "included" : isReached ? "unlocked" : isNext ? "current target" : "locked"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {showUnlockToast && (
          <div className="sm:hidden animate-fade-in rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-2 text-[11px] font-medium text-primary">
            已解锁{h2e.unlockedPercent}%
          </div>
        )}
        {h2e.isFullyUnlocked ? (
          <p className="text-[10px] text-trading-green">Fully unlocked — rewards are withdrawable</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">
            Trade ${h2e.volumeToNextTier.toLocaleString()} more to unlock {h2e.nextTierPercent}%
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Current unlocked: {h2e.unlockedPercent}% · Full unlock at ${h2e.volumeRequired.toLocaleString()}
        </p>
      </div>

      {/* Recent settlements */}
      {h2e.settlements.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/30">
          <span className="text-xs text-muted-foreground">Recent Settlements</span>
          {h2e.settlements.slice(0, 3).map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs">
              <div className="truncate max-w-[60%]">
                <span className="text-foreground">{s.eventName}</span>
                <span className="text-muted-foreground ml-1">· {s.trigger}</span>
              </div>
              <span className={`font-mono ${s.pnl >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
