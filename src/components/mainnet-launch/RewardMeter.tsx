import { Coins, Trophy } from "lucide-react";
import { FIRST_TRADE_VOLUME, formatUsd, MAINNET_REBATE_TIERS } from "@/lib/mainnetLaunch";
import { useMainnetLaunchProgress } from "@/hooks/useMainnetLaunchProgress";

const MAX_VOLUME = MAINNET_REBATE_TIERS[MAINNET_REBATE_TIERS.length - 1].volume;

export const RewardMeter = () => {
  const { user, volume } = useMainnetLaunchProgress();
  const userPct = user ? Math.min(100, (volume / MAX_VOLUME) * 100) : 0;
  const activationPct = (FIRST_TRADE_VOLUME / MAX_VOLUME) * 100;

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-md border border-mainnet-gold/25 bg-mainnet-surface p-6 shadow-[0_32px_80px_hsl(var(--background)/0.35)] md:min-h-[460px] md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,hsl(var(--mainnet-gold)/0.2),transparent_45%),linear-gradient(180deg,hsl(var(--mainnet-surface-elevated)/0.7),hsl(var(--mainnet-surface)/0.96))]" />
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-mainnet-gold/50 to-transparent" />

      <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-between gap-8 md:min-h-[400px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-mainnet-gold/80">Your reward, at a glance</p>
            <h2 className="mt-2 font-mono text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl">
              Up to <span className="text-mainnet-gold">$250</span> in USDC
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A guaranteed bonus on your first $5K. A bigger rebate the more you trade.
            </p>
          </div>
          <div className="hidden h-12 w-12 items-center justify-center rounded-full border border-mainnet-gold/40 bg-mainnet-gold/10 md:flex">
            <Trophy className="h-5 w-5 text-mainnet-gold" />
          </div>
        </div>

        <div className="space-y-6">
          {/* meter track */}
          <div className="relative">
            <div className="h-3 w-full overflow-hidden rounded-full bg-background/60 ring-1 ring-inset ring-border/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mainnet-gold via-mainnet-gold to-mainnet-orange transition-[width] duration-700"
                style={{ width: `${Math.max(userPct, 4)}%` }}
              />
            </div>
            {/* activation marker */}
            <div className="absolute inset-y-0 -translate-x-1/2" style={{ left: `${activationPct}%` }}>
              <div className="absolute -top-1 h-5 w-px bg-mainnet-gold" />
            </div>

            <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>$0</span>
              <span style={{ marginLeft: `${activationPct - 8}%` }} className="text-mainnet-gold">
                $5K · bonus unlocks
              </span>
              <span>$1M · top tier</span>
            </div>
          </div>

          {/* dual reward chips */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-mainnet-gold/30 bg-mainnet-gold/10 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mainnet-gold">
                <Coins className="h-3.5 w-3.5" />
                First $5K bonus
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold text-foreground">$2 – $50</p>
              <p className="mt-1 text-xs text-muted-foreground">guaranteed payout</p>
            </div>
            <div className="rounded-md border border-mainnet-orange/30 bg-mainnet-orange/10 p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mainnet-orange">
                <Trophy className="h-3.5 w-3.5" />
                Volume rebate
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold text-foreground">up to $200</p>
              <p className="mt-1 text-xs text-muted-foreground">the more you trade, the more you keep</p>
            </div>
          </div>

          {user && volume > 0 && (
            <p className="font-mono text-xs text-muted-foreground">
              You're at{" "}
              <span className="text-foreground">{formatUsd(volume)}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
