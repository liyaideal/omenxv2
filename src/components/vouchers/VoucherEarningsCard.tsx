import { Coins, Wallet, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoucherEarnings } from "@/hooks/useVoucherEarnings";
import { VOUCHER_TIERS, formatTierCap, deriveVoucherTierState, type VoucherTier } from "@/lib/voucherTiers";
import { cn } from "@/lib/utils";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  /** Optional override (for /style-guide playground). */
  data?: {
    pending: number;
    lifetimeCredited: number;
    volume: number;
    depositTotal?: number;
  };
}

export const VoucherEarningsCard = ({ data }: Props = {}) => {
  const live = useVoucherEarnings();
  const pending = data?.pending ?? live.pending;
  const lifetimeCredited = data?.lifetimeCredited ?? live.lifetimeCredited;
  const volume = data?.volume ?? live.volume;
  const depositTotal = data?.depositTotal ?? live.depositTotal;
  const loading = data ? false : live.loading;
  const claiming = live.claiming;

  // Re-derive tier state from whichever data source is in use, so the playground
  // can drive every visual state.
  const tierState = data
    ? deriveVoucherTierState(volume, pending, lifetimeCredited, depositTotal)
    : live.tierState;
  const canClaim = data ? tierState.claimable > 0 : live.canClaim;

  const { current, next, claimable, lifetimeAtCap, nextProgress } = tierState;

  const nextHelper = (() => {
    if (!next || !nextProgress) return null;
    const capText = formatTierCap(next);
    if (nextProgress.kind === "deposit") {
      return `Deposit $${fmt(nextProgress.remaining)} more to reach ${next.label} (up to ${capText} claimable).`;
    }
    if (nextProgress.kind === "volume") {
      return `Trade $${fmt(nextProgress.remaining)} more to reach ${next.label} (up to ${capText} claimable).`;
    }
    return null;
  })();

  return (
    <section className="rounded-xl border border-border bg-gradient-to-br from-trading-green/5 via-card/40 to-card/40 p-4 md:p-5">
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 md:items-stretch">
        {/* Pending balance */}
        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <Coins className="w-3.5 h-3.5" />
            Pending earnings
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl md:text-5xl font-semibold text-trading-green leading-none">
              ${loading ? "—" : fmt(pending)}
            </span>
            <span className="text-xs text-muted-foreground">USDC</span>
          </div>
          <div className="mt-3 text-[11px] md:text-xs text-muted-foreground max-w-md">
            Profits from voucher positions accrue here. Deposit and trade more to unlock higher claim caps to your available balance.
          </div>
          {lifetimeCredited > 0 && (
            <div className="mt-auto pt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="uppercase tracking-wider">Lifetime claimed</span>
              <span className="font-mono text-foreground">${fmt(lifetimeCredited)}</span>
            </div>
          )}
        </div>

        {/* Tier rail + claim */}
        <div className="rounded-lg border border-border bg-background/40 p-3 md:p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              Unlock tier
            </div>
            <div className="font-mono text-[11px] text-foreground flex items-center gap-2">
              <span>${fmt(depositTotal)} <span className="text-muted-foreground">dep.</span></span>
              <span className="text-border">·</span>
              <span>${fmt(volume)} <span className="text-muted-foreground">vol.</span></span>
            </div>
          </div>

          {/* Segmented tier bar */}
          <div className="flex items-stretch gap-1">
            {VOUCHER_TIERS.map((t) => {
              const reached = !!current && current.id >= t.id;
              const isCurrent = current?.id === t.id;
              return (
                <TierSegment
                  key={t.id}
                  tier={t}
                  reached={reached}
                  isCurrent={isCurrent}
                />
              );
            })}
          </div>

          {/* Helper line */}
          <div className="text-[11px] text-muted-foreground min-h-[16px]">
            {current && next && nextHelper && (
              <>
                Tier <span className="text-foreground">{current.label}</span> unlocked — up to{" "}
                <span className="text-foreground">{formatTierCap(current)}</span>. {nextHelper}
              </>
            )}
            {current && !next && (
              <>Tier <span className="text-foreground">{current.label}</span> unlocked — up to {formatTierCap(current)} claimable (max tier).</>
            )}
          </div>

          <Button
            onClick={live.claim}
            disabled={!canClaim || claiming || !!data}
            className="w-full mt-auto"
            size="sm"
          >
            {claimable > 0 ? <Wallet className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {claiming
              ? "Claiming…"
              : claimable > 0
                ? `Claim $${fmt(claimable)} to wallet`
                : lifetimeAtCap
                  ? "Tier cap claimed — reach next tier"
                  : pending <= 0
                    ? "Nothing to claim"
                    : "Unlock next tier to claim more"}
          </Button>
        </div>
      </div>
    </section>
  );
};

const TierSegment = ({
  tier,
  reached,
  isCurrent,
}: {
  tier: VoucherTier;
  reached: boolean;
  isCurrent: boolean;
}) => (
  <div
    className={cn(
      "flex-1 rounded-md border px-1.5 py-1.5 flex flex-col items-center gap-0.5 transition-colors min-w-0",
      reached
        ? isCurrent
          ? "border-primary/60 bg-primary/15"
          : "border-trading-green/40 bg-trading-green/10"
        : "border-border bg-muted/20 opacity-60",
    )}
  >
    <span
      className={cn(
        "text-[10px] uppercase tracking-wider font-medium",
        reached ? (isCurrent ? "text-primary" : "text-trading-green") : "text-muted-foreground",
      )}
    >
      {tier.label}
    </span>
    <span
      className={cn(
        "font-mono text-[11px] leading-tight",
        reached ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {formatTierCap(tier)}
    </span>
    <span className="text-[9px] text-muted-foreground leading-tight text-center truncate w-full">
      {tier.unlockShort}
    </span>
  </div>
);
