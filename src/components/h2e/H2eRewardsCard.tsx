import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import type { H2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";

/**
 * H2E "Your progress" card — pure presentational apart from the journey-stage
 * lookup (stage is computed in-component so guests can render it too).
 * Rendered on /rewards/campaign/h2e and mirrored in /style-guide.
 */

const MicroLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">{children}</div>
);

const GuideNode = ({
  title,
  sub,
  state,
  subNode,
}: {
  title: string;
  sub?: string;
  state: "done" | "next" | "todo";
  subNode?: React.ReactNode;
}) => (
  <div className="flex flex-col items-start text-left">
    <span
      className={`relative h-5 w-5 rounded-full border-2 bg-[#131519] transition-all duration-300 ${
        state === "done"
          ? "border-trading-green"
          : state === "next"
            ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]"
            : "border-border"
      }`}
    >
      {state === "next" && <span className="absolute -inset-1 rounded-full border border-primary/60 animate-scale-in" />}
    </span>
    <div className={`mt-2 text-[11px] font-semibold ${state === "todo" ? "text-muted-foreground" : "text-foreground"}`}>
      {title}
    </div>
    {subNode ?? (sub && <div className="text-[10px] text-[#6B7280]">{sub}</div>)}
  </div>
);

export const H2eRewardsCard = ({
  h2e,
  showUnlockToast = false,
}: {
  h2e: H2eRewardsSummary;
  showUnlockToast?: boolean;
}) => {
  const { user } = useAuth();
  const { activeAccounts } = useConnectedAccounts();
  const stage = !user ? "S0" : h2e.totalEarned > 0 ? "S3" : activeAccounts.length > 0 ? "S2" : "S1";
  const connected = activeAccounts.length > 0;
  const { airdrops } = useAirdropPositions();
  const liveAirdropCount = airdrops.filter(
    (a) => a.source !== "voucher" && (a.status === "pending" || a.status === "activated"),
  ).length;
  const acct = activeAccounts[0];
  const scanning = activeAccounts.some((a) => a.scanStatus === "scanning");

  const shell = "rounded-[16px] border border-[#1D2026] bg-[#131519] p-4 md:p-[18px]";

  if (stage === "S0" || stage === "S1") {
    return (
      <div className={`${shell} space-y-4`}>
        <MicroLabel>Your progress</MicroLabel>
        <div className="grid grid-cols-3 gap-3">
          <GuideNode
            state="next"
            title={stage === "S0" ? "Sign in and connect your wallet" : "Connect wallet"}
            sub="Link your Polymarket wallet above"
          />
          <GuideNode state="todo" title="Receive airdrops" sub="Qualifying positions get a $10 counter-side hedge" />
          <GuideNode state="todo" title="Trade to unlock" sub="Earnings unlock for withdrawal by volume tiers" />
        </div>
      </div>
    );
  }

  if (stage === "S2") {
    return (
      <div className={`${shell} space-y-4`}>
        <MicroLabel>Your progress</MicroLabel>
        <div className="grid grid-cols-3 gap-3">
          <GuideNode
            state="done"
            title="Wallet connected"
            subNode={<div className="font-mono text-[10px] text-[#6B7280]">{acct?.displayAddress}</div>}
          />
          <GuideNode
            state="next"
            title="Receive airdrops"
            subNode={
              scanning ? (
                <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" /> Scanning positions…
                </div>
              ) : liveAirdropCount > 0 ? (
                <div className="text-[10px] text-[#6B7280]">
                  {acct?.positionsDetected} positions scanned · {liveAirdropCount}{" "}
                  {liveAirdropCount === 1 ? "airdrop" : "airdrops"} active
                </div>
              ) : (
                <div className="text-[10px] text-[#6B7280]">
                  No qualifying positions yet — positions ≥ $20 held a day qualify
                </div>
              )
            }
          />
          <GuideNode state="todo" title="Trade to unlock" sub="Starts once earnings land" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${shell} space-y-4`}>
      <div className="flex items-center justify-between gap-3">
        <MicroLabel>Your progress</MicroLabel>
        <span className="text-[11px] text-[#6B7280]">
          {connected ? (
            <span className="text-[#4ADE80]">✓ Connected</span>
          ) : (
            <span className="text-[#FFD666]">Wallet not connected</span>
          )}{" "}
          · <span className="text-[#4ADE80]">✓ Airdrops</span> ·{" "}
          <span className="text-[#33D6FF] font-semibold">Trade to unlock</span>
        </span>
      </div>

      {/* Earnings cap */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#9AA1AC]">Earned / Cap</span>
          <span className="font-display text-[12.5px] font-semibold tabular-nums text-[#F2F3F5]">
            ${h2e.totalEarned.toFixed(2)} / ${h2e.earningsCap}
          </span>
        </div>
        <div className="h-[5px] w-full overflow-hidden rounded-[3px] bg-[#1A1D22]">
          <div className="h-full rounded-[3px] bg-[#33D6FF]" style={{ width: `${h2e.earningsPercent}%` }} />
        </div>
      </div>

      {/* Volume unlock */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Withdrawal unlock progress</span>
          <span className="font-mono font-semibold">
            ${Math.round(h2e.volumeCompleted).toLocaleString()} / ${Math.round(h2e.nextTierVolume ?? h2e.volumeRequired).toLocaleString()}
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
                      className={`relative z-10 h-6 w-6 rounded-full border-2 bg-[#131519] transition-all duration-300 ${
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
        <div className="space-y-2 rounded-lg border border-[#1D2026] bg-[#0F1114] p-3 sm:hidden">
          {!h2e.isFullyUnlocked && (
            <div className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2">
              <div className="text-[10px] uppercase text-muted-foreground">Next unlock</div>
              <div className="mt-0.5 flex items-center justify-between text-xs">
                <span className="font-medium">{h2e.nextTierPercent}% at ${Math.round(h2e.nextTierVolume ?? h2e.volumeRequired).toLocaleString()}</span>
                <span className="font-mono text-primary">${Math.round(h2e.volumeToNextTier).toLocaleString()} left</span>
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
                    className={`relative mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 bg-[#131519] transition-all duration-300 ${
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
            Trade ${Math.round(h2e.volumeToNextTier).toLocaleString()} more to unlock {h2e.nextTierPercent}%
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Current unlocked: {h2e.unlockedPercent}% · Full unlock at ${Math.round(h2e.volumeRequired).toLocaleString()}
        </p>
      </div>

      {/* Recent settlements */}
      {h2e.settlements.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/30">
          <MicroLabel>Recent settlements</MicroLabel>
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
