import { useEffect, useRef, useState } from "react";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { useSurface } from "@/contexts/SurfaceContext";
import { LiteAuthGate } from "@/components/portfolio/lite/LiteAuthGate";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Copy,
  Check,
  Star,
  AlertTriangle,
  Info,
  Trash2,
  Lock,
  Gift,
  Eye,
  EyeOff,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWallets } from "@/hooks/useWallets";
import { useRealtimeRiskMetrics } from "@/hooks/useRealtimeRiskMetrics";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNav } from "@/components/BottomNav";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  MobileDrawer,
  MobileDrawerActions,
  MobileDrawerStatus,
} from "@/components/ui/mobile-drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  TransactionHistory, 
  PendingConfirmations,
  Transaction, 
  TransactionStatus 
} from "@/components/wallet";
import { DeleteAddressDrawer } from '@/components/wallet/DeleteAddressDrawer';
import { AddAddressDialog } from "@/components/wallet/AddAddressDialog";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { WithdrawDialog } from "@/components/withdraw/WithdrawDialog";
import { TransferDialog } from "@/components/wallet/TransferDialog";
import { ColoredAddress } from '@/components/wallet/ColoredAddress';
import { TransferDrawer } from "@/components/wallet/TransferDrawer";
import { MaintenanceNoticeBanner } from "@/components/wallet/MaintenanceNoticeBanner";
import { computeTotalEquity, formatEquityUsd } from "@/lib/equity";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import useCategoryBoostConfigs from "@/hooks/useCategoryBoostConfigs";
import { useH2eRewardsSummary, type H2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
 * Signal-DNA visual primitives (Wallet page only)
 * Flat dark cards, hairline borders, gradient X motif on hero only.
 * ------------------------------------------------------------------ */

const XMotif = ({ className = "" }: { className?: string }) => (
  <svg
    aria-hidden
    viewBox="0 0 300 260"
    className={cn("pointer-events-none absolute", className)}
  >
    <defs>
      <linearGradient id="xg-a" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#013281" />
        <stop offset="100%" stopColor="#33D6FF" />
      </linearGradient>
      <linearGradient id="xg-b" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#CFFF4A" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#33D6FF" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <path d="M20 -20 L280 280" stroke="url(#xg-a)" strokeWidth="26" opacity="0.28" />
    <path d="M280 -20 L20 280" stroke="url(#xg-b)" strokeWidth="26" opacity="0.22" />
  </svg>
);

const HERO_CTA_GRADIENT =
  "bg-[image:var(--gradient-button-primary)] text-primary-foreground hover:opacity-90";

export const HeroEquityCard = ({
  equity,
  hidden,
  onToggleHidden,
  onDeposit,
  onWithdraw,
  onTransfer,
  compact = false,
}: {
  equity: number;
  hidden: boolean;
  onToggleHidden: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  compact?: boolean;
}) => (
  <section
    className={cn(
      "relative overflow-hidden rounded-[18px] border border-border bg-card",
      compact ? "p-5" : "p-[34px_36px]",
    )}
  >
    <XMotif
      className={
        compact
          ? "-right-[30px] -top-[40px] h-[220px] w-[260px]"
          : "-right-[30px] -top-[40px] h-[260px] w-[300px]"
      }
    />
    <div
      className={cn(
        "relative flex gap-6",
        compact ? "flex-col" : "flex-col lg:flex-row lg:items-end lg:justify-between",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Est. Total Equity
          </span>
          <button
            type="button"
            onClick={onToggleHidden}
            className="text-muted-foreground/70 hover:text-foreground transition-colors"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div
          className={cn(
            "font-display font-bold tabular-nums whitespace-nowrap",
            compact ? "text-[42px] leading-[0.96]" : "text-[60px] leading-[0.96]",
          )}
        >
          {hidden ? "••••••" : `$${formatEquityUsd(equity)}`}
        </div>
        <div className="text-[13px] text-muted-foreground mt-2.5">
          Boost + Standard · does not include unrealized PnL
        </div>
      </div>

      {compact ? (
        <div className="grid grid-cols-2 gap-2">
          <Button className={cn("h-11 rounded-full font-semibold", HERO_CTA_GRADIENT)} onClick={onDeposit}>
            Deposit
          </Button>
          <Button variant="outline" className="h-11" onClick={onWithdraw}>
            Withdraw
          </Button>
          <Button
            variant="ghost"
            className="col-span-2 h-11 border border-border/50"
            onClick={onTransfer}
          >
            Transfer <span className="ml-1.5 text-muted-foreground">⇄</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5 lg:shrink-0">
          <Button className={cn("h-auto py-3 px-[22px] rounded-full font-semibold text-sm", HERO_CTA_GRADIENT)} onClick={onDeposit}>
            Deposit
          </Button>
          <Button variant="outline" className="h-auto py-3 px-[22px] rounded-full font-semibold text-sm" onClick={onWithdraw}>
            Withdraw
          </Button>
          <Button
            variant="ghost"
            className="h-auto py-3 px-[22px] rounded-full font-semibold text-sm text-[#C9CED6] hover:text-foreground"
            onClick={onTransfer}
          >
            Transfer <span className="ml-1.5 text-muted-foreground">⇄</span>
          </Button>
        </div>
      )}
    </div>
  </section>
);

const AccountCardShell = ({
  tag,
  tagClass,
  onTransfer,
  transferLabel,
  children,
  compact = false,
}: {
  tag: string;
  tagClass: string;
  onTransfer: () => void;
  transferLabel: string;
  children: React.ReactNode;
  compact?: boolean;
}) => (
  <div
    className={cn(
      "relative rounded-2xl border border-border bg-card",
      compact ? "p-4" : "p-6",
    )}
  >
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
          tagClass,
        )}
      >
        {tag}
      </span>
      <button
        type="button"
        onClick={onTransfer}
        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors"
        aria-label={transferLabel}
        title="Transfer"
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
      </button>
    </div>
    {children}
  </div>
);

export const SpotAccountCard = ({
  balance,
  hidden,
  onTransfer,
  compact = false,
}: {
  balance: number;
  hidden: boolean;
  onTransfer: () => void;
  compact?: boolean;
}) => (
  <AccountCardShell
    tag="Standard"
    tagClass="bg-primary/15 text-primary border border-primary/30"
    onTransfer={onTransfer}
    transferLabel="Transfer to Standard"
    compact={compact}
  >
    <div
      className={cn(
        "font-display font-bold tabular-nums leading-none mt-3",
        compact ? "text-3xl" : "text-4xl",
      )}
    >
      {hidden ? "••••" : `$${formatEquityUsd(balance)}`}
    </div>
    <div className="my-4 h-px bg-border" />
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Available (USDC)</span>
      <span className="font-mono font-semibold tabular-nums">
        {hidden ? "••••" : `$${formatEquityUsd(balance)}`}
      </span>
    </div>
    <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
      Buy and sell shares at full price.
    </p>
  </AccountCardShell>
);

export const FuturesAccountCard = ({
  balance,
  withdrawable,
  locked,
  hidden,
  onTransfer,
  marginInUse,
  unrealizedPnL,
  AvailableTooltip,
  InfoTip,
  compact = false,
  boostMax,
}: {
  balance: number;
  withdrawable: number;
  locked: number;
  hidden: boolean;
  onTransfer: () => void;
  marginInUse: number;
  unrealizedPnL: number;
  AvailableTooltip: React.ComponentType<{ marginInUse: number; unrealizedPnL: number }>;
  InfoTip: React.ComponentType<{ text: string }>;
  compact?: boolean;
  boostMax?: number;
}) => {
  const mask = (v: number) => (hidden ? "••••" : `$${formatEquityUsd(v)}`);
  return (
    <AccountCardShell
      tag="Boost"
      tagClass="bg-accent/20 text-accent border border-accent/40"
      onTransfer={onTransfer}
      transferLabel="Transfer to Boost"
      compact={compact}
    >
      <div
        className={cn(
          "font-display font-bold tabular-nums leading-none mt-3",
          compact ? "text-3xl" : "text-4xl",
        )}
      >
        {mask(balance)}
      </div>
      <div className="my-4 h-px bg-border" />
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            Available
            <AvailableTooltip marginInUse={marginInUse} unrealizedPnL={unrealizedPnL} />
          </span>
          <span className="font-mono font-semibold tabular-nums">{mask(balance)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            Withdrawable
            <InfoTip text="Available balance minus the still-locked portion of hedge airdrop rewards." />
          </span>
          <span className="font-mono font-semibold tabular-nums">{mask(withdrawable)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> H2E Locked
            <InfoTip text="Hedge airdrop earnings unlock in tiers as trading volume grows. Full withdrawal unlock is at $400K volume." />
          </span>
          <span className="font-mono font-semibold tabular-nums text-muted-foreground">
            {mask(locked)}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        Put in a little to control a bigger trade{boostMax && boostMax > 1 ? ` — Boost up to ${boostMax}×` : ""}.
      </p>
    </AccountCardShell>
  );
};


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

  if (h2e.totalEarned === 0 && h2e.settlements.length === 0) return null;
  
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
                        {isStarter ? "Free, independent of H2E" : `$${(tier.volume / 1000).toFixed(0)}K volume`}
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

/** Surface-aware wallet auth gate: Lite → LiteAuthGate, Pro → AuthGateOverlay (unchanged). */
const WalletAuthGate = ({
  isLite,
  maxPreviewHeight,
  children,
}: {
  isLite: boolean;
  maxPreviewHeight?: string;
  children: React.ReactNode;
}) =>
  isLite ? (
    <LiteAuthGate
      title="Sign in to view your wallet"
      description="Deposit, withdraw and move funds between your accounts by signing in."
    >
      {children}
    </LiteAuthGate>
  ) : (
    <AuthGateOverlay
      title="Sign in to view your wallet"
      description="Manage your funds and saved addresses by signing in."
      maxPreviewHeight={maxPreviewHeight}
    >
      {children}
    </AuthGateOverlay>
  );

export default function Wallet() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { surface } = useSurface();
  const isLite = surface === "lite";
  const { balance, spotBalance, user } = useUserProfile();
  const { imTotal, unrealizedPnL, hasPositions } = useRealtimeRiskMetrics();
  const h2e = useH2eRewardsSummary();
  const { maxBoost } = useCategoryBoostConfigs();
  const previousH2eTierRef = useRef(0);
  const [showH2eUnlockToast, setShowH2eUnlockToast] = useState(false);
  const { 
    wallets, 
    isLoading: walletsLoading, 
    addWallet, 
    removeWallet, 
    setPrimaryWallet 
  } = useWallets();

  const withdrawableBalance = Math.max(0, balance - h2e.lockedAmount);

  useEffect(() => {
    if (h2e.unlockedPercent > previousH2eTierRef.current) {
      setShowH2eUnlockToast(true);
      const timeout = window.setTimeout(() => setShowH2eUnlockToast(false), 2600);
      previousH2eTierRef.current = h2e.unlockedPercent;
      return () => window.clearTimeout(timeout);
    }

    previousH2eTierRef.current = h2e.unlockedPercent;
  }, [h2e.unlockedPercent]);

  // Fetch closed trades for transaction history (only realized P&L)
  const {
    data: recentTrades = [],
    isError: tradesError,
    refetch: refetchTrades,
  } = useQuery({
    queryKey: ["wallet-trades", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("trades")
        .select("id, event_name, option_label, pnl, created_at, closed_at, status")
        .eq("user_id", user.id)
        .eq("status", "Closed")
        .not("pnl", "is", null)
        .order("closed_at", { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });

  // Fetch deposit/withdraw/platform credit transactions
  const {
    data: walletTransactions = [],
    isError: fundError,
    refetch: refetchFunds,
  } = useQuery({
    queryKey: ["wallet-fund-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("id, type, amount, description, created_at, tx_hash, network, status, account")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
  });

  const txError = tradesError || fundError;
  const refetchTx = () => {
    refetchTrades();
    refetchFunds();
  };

  // Transform and merge all transactions
  const tradeTransactions: Transaction[] = recentTrades.map((trade) => ({
    id: trade.id,
    type: (trade.pnl ?? 0) >= 0 ? "trade_profit" : "trade_loss" as const,
    amount: trade.pnl ?? 0,
    description: `${trade.event_name} - ${trade.option_label}`,
    date: trade.closed_at ? new Date(trade.closed_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : new Date(trade.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
    timestamp: trade.closed_at ? new Date(trade.closed_at).getTime() : new Date(trade.created_at).getTime(),
    status: 'completed' as TransactionStatus,
  }));

  const fundTransactions: Transaction[] = walletTransactions.map((tx) => ({
    id: tx.id,
    type: tx.type as Transaction['type'],
    amount: tx.amount,
    description: tx.description || (tx.type === "platform_credit" ? "Platform Credit" : tx.type === "deposit" ? "Deposit" : "Withdraw"),
    date: new Date(tx.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
    timestamp: new Date(tx.created_at).getTime(),
    txHash: tx.tx_hash,
    network: tx.network,
    status: (tx.status || 'completed') as TransactionStatus,
    account: ((tx as { account?: string }).account === 'spot' || (tx as { account?: string }).account === 'futures')
      ? ((tx as { account: 'spot' | 'futures' }).account)
      : null,
  }));

  const transactions: Transaction[] = [...tradeTransactions, ...fundTransactions]
    .sort((a, b) => b.timestamp - a.timestamp);
  
  // Dialog states
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferInitDir, setTransferInitDir] = useState<"to_spot" | "to_futures">("to_spot");
  const [equityHidden, setEquityHidden] = useState(false);

  const [addAddressOpen, setAddAddressOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<{ id: string; label: string } | null>(null);
  const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);

  const totalEquity = computeTotalEquity({ spotBalance, balance });
  const openTransfer = (dir: "to_spot" | "to_futures" = "to_spot") => {
    setTransferInitDir(dir);
    setTransferOpen(true);
  };
  

  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCopyWallet = (walletId: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedWalletId(walletId);
    toast.success("Address copied");
    setTimeout(() => setCopiedWalletId(null), 2000);
  };

  const handleDeleteWallet = (wallet: { id: string; label: string }) => {
    setWalletToDelete(wallet);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (walletToDelete) {
      const result = await removeWallet(walletToDelete.id);
      if (result.success) {
        toast.success("Address deleted");
      } else {
        toast.error(result.error || "Failed to delete address");
      }
    }
    setDeleteDialogOpen(false);
    setWalletToDelete(null);
  };

  const handleSetPrimaryWallet = async (walletId: string) => {
    const result = await setPrimaryWallet(walletId);
    if (result.success) {
      toast.success("Default address updated");
    } else {
      toast.error(result.error || "Failed to update default address");
    }
  };

  // Info Tooltip Component
  const InfoTooltip = ({ text }: { text: string }) => {
    if (isMobile) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-3 h-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 text-xs" side="top" align="center">
            <p>{text}</p>
          </PopoverContent>
        </Popover>
      );
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-3 h-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p>{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Available Balance Popover
  const AvailableBalanceTooltip = ({ marginInUse, unrealizedPnL }: { marginInUse: number; unrealizedPnL: number }) => {
    const content = (
      <div className="space-y-2">
        <p className="text-xs">Funds available for trading and withdrawal.</p>
        {marginInUse > 0 && (
          <div className="pt-2 border-t border-border/50 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">In use by open positions:</span>
              <span className="font-mono text-trading-yellow">${formatCurrency(marginInUse)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Unrealized P&L:</span>
              <span className={`font-mono ${unrealizedPnL >= 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                {unrealizedPnL >= 0 ? '+' : ''}${formatCurrency(unrealizedPnL)}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate('/portfolio')}
          className="w-full mt-2 text-xs text-primary hover:underline text-left"
        >
          View positions in Portfolio →
        </button>
      </div>
    );

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Info className="w-3 h-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" side="top" align={isMobile ? "start" : "center"}>
          {content}
        </PopoverContent>
      </Popover>
    );
  };

  // BalanceCard removed (dual-account 2b): mobile now uses the same Band 1 Total Equity
  // + dual-account cards structure as desktop. See docs/changelog/2026-07-21-dual-account-wallet-ui.md §2.


  // Clean saved-address row (Signal DNA): hairline-separated row, no avatar, no inline delete/set-default.
  const AddressRow = ({ wallet, isLast }: { wallet: typeof wallets[0]; isLast: boolean }) => (
    <div className={cn("flex items-center justify-between gap-3 py-3", !isLast && "border-b border-[#1D2026]")}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{wallet.label}</span>
          {wallet.isPrimary && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase"
              style={{ backgroundColor: 'rgba(207,255,74,0.16)', color: '#DCFF6A' }}
            >
              Default
            </span>
          )}
        </div>
        <div className="mt-0.5">
          <ColoredAddress address={wallet.address} />
        </div>
      </div>
      <button
        onClick={() => handleCopyWallet(wallet.id, wallet.fullAddress)}
        className="text-muted-foreground hover:text-white transition-colors shrink-0"
        aria-label="Copy address"
      >
        {copiedWalletId === wallet.id ? (
          <Check className="w-3.5 h-3.5 text-trading-green" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );

  // Saved Addresses List Component (mobile) — clean Signal DNA rows.
  const SavedAddressesList = () => (
    <div className="trading-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Saved addresses
        </h2>
        <span className="text-xs text-muted-foreground">
          {wallets.length} address{wallets.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {walletsLoading ? (
        <LoadingState label="Loading addresses…" />
      ) : (
        <div>
          {wallets.map((wallet, i) => (
            <AddressRow key={wallet.id} wallet={wallet} isLast={i === wallets.length - 1} />
          ))}

          <button
            onClick={() => setAddAddressOpen(true)}
            className="mt-3 w-full border-[1.5px] border-dashed border-[#2B2F38] hover:border-primary/60 rounded-xl h-10 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add address</span>
          </button>

          {wallets.length === 0 && !walletsLoading && (
            <EmptyState
              variant="module"
              bordered={false}
              title="No saved addresses"
              description="Save addresses for quick deposits and withdrawals."
              className="px-0 py-2"
            />
          )}
        </div>
      )}
    </div>
  );

  // Desktop Layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <EventsDesktopHeader />
        
        <AuthGateOverlay title="Sign in to view your wallet" description="Manage your funds and saved addresses by signing in.">
        <main className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6 space-y-[18px]">
          <MaintenanceNoticeBanner className="mb-2" />

          {/* Band 1 · Signal-DNA Hero: flat dark card + decorative X watermark */}
          <HeroEquityCard
            equity={totalEquity}
            hidden={equityHidden}
            onToggleHidden={() => setEquityHidden((v) => !v)}
            onDeposit={() => setDepositDialogOpen(true)}
            onWithdraw={() => setWithdrawDialogOpen(true)}
            onTransfer={() => openTransfer("to_spot")}
          />

          {/* Band 2 · Flat dark account cards with capsule tags (Signal DNA) */}
          <section className="grid grid-cols-2 gap-6">
            <SpotAccountCard
              balance={spotBalance}
              hidden={equityHidden}
              onTransfer={() => openTransfer("to_spot")}
            />
            <FuturesAccountCard
              balance={balance}
              withdrawable={withdrawableBalance}
              locked={h2e.lockedAmount}
              hidden={equityHidden}
              onTransfer={() => openTransfer("to_futures")}
              marginInUse={imTotal}
              unrealizedPnL={unrealizedPnL}
              AvailableTooltip={AvailableBalanceTooltip}
              InfoTip={InfoTooltip}
              boostMax={maxBoost}
            />
          </section>

          {/* Band 3 · 12 栅格 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <PendingConfirmations />
              <div className="trading-card p-6">
                {txError ? (
                  <ErrorState
                    title="Couldn't load transactions"
                    description="Something went wrong fetching your transaction history."
                    onRetry={refetchTx}
                  />
                ) : (
                  <TransactionHistory transactions={transactions} />
                )}
              </div>
              {/* Permanent door to recovery — the in-context link inside
                  PendingConfirmations unmounts when nothing is pending. */}
              <button
                type="button"
                onClick={() => navigate("/wallet/recovery")}
                className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Sent funds to the wrong network? Request recovery →
              </button>
            </div>
            <div className="col-span-4 space-y-6">
              <H2eRewardsCard h2e={h2e} showUnlockToast={showH2eUnlockToast} />
              <div className="trading-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Saved addresses
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {wallets.length} address{wallets.length !== 1 ? "es" : ""}
                  </span>
                </div>
                {walletsLoading ? (
                  <LoadingState label="Loading addresses…" />
                ) : (
                  <div>
                    {wallets.map((wallet, i) => (
                      <AddressRow key={wallet.id} wallet={wallet} isLast={i === wallets.length - 1} />
                    ))}
                    <button
                      onClick={() => setAddAddressOpen(true)}
                      className="mt-3 w-full border-[1.5px] border-dashed border-[#2B2F38] hover:border-primary/60 rounded-xl h-10 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Add address</span>
                    </button>
                    {wallets.length === 0 && !walletsLoading && (
                      <EmptyState
                        variant="module"
                        bordered={false}
                        title="No saved addresses"
                        description="Save addresses for quick deposits and withdrawals."
                        className="px-0 py-2"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
        </AuthGateOverlay>


        <DepositDialog 
          open={depositDialogOpen} 
          onOpenChange={setDepositDialogOpen} 
        />

        <WithdrawDialog 
          open={withdrawDialogOpen} 
          onOpenChange={setWithdrawDialogOpen} 
        />

        {/* Transfer Dialog (Dual-Account 2b, desktop) */}
        <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} initialDirection={transferInitDir} />

        {/* Add Address Dialog */}
        <AddAddressDialog open={addAddressOpen} onOpenChange={setAddAddressOpen} />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-trading-red" />
                Delete Address?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{walletToDelete?.label}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-trading-red hover:bg-trading-red/90 text-white"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen bg-background pb-24">
      <MobileHeader variant="brand" showBack={false} />

      <AuthGateOverlay title="Sign in to view your wallet" description="Manage your funds and saved addresses by signing in." maxPreviewHeight="400px">
      <div className="px-4 py-6 space-y-4">
        <MaintenanceNoticeBanner />

        <HeroEquityCard
          equity={totalEquity}
          hidden={equityHidden}
          onToggleHidden={() => setEquityHidden((v) => !v)}
          onDeposit={() => navigate("/deposit")}
          onWithdraw={() => navigate("/withdraw")}
          onTransfer={() => openTransfer("to_spot")}
          compact
        />

        <section className="space-y-3">
          <SpotAccountCard
            balance={spotBalance}
            hidden={equityHidden}
            onTransfer={() => openTransfer("to_spot")}
            compact
          />
          <FuturesAccountCard
            balance={balance}
            withdrawable={withdrawableBalance}
            locked={h2e.lockedAmount}
            hidden={equityHidden}
            onTransfer={() => openTransfer("to_futures")}
            marginInUse={imTotal}
            unrealizedPnL={unrealizedPnL}
            AvailableTooltip={AvailableBalanceTooltip}
            InfoTip={InfoTooltip}
            boostMax={maxBoost}
            compact
          />
        </section>

        <H2eRewardsCard h2e={h2e} showUnlockToast={showH2eUnlockToast} />
        <PendingConfirmations />
        <SavedAddressesList />
        <div className="trading-card p-4">
          {txError ? (
            <ErrorState
              title="Couldn't load transactions"
              description="Something went wrong fetching your transaction history."
              onRetry={refetchTx}
            />
          ) : (
            <TransactionHistory transactions={transactions} />
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate("/wallet/recovery")}
          className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Sent funds to the wrong network? Request recovery →
        </button>
      </div>
      </AuthGateOverlay>

      <BottomNav />


      {/* Add Address Dialog (shared component handles mobile/desktop) */}
      <AddAddressDialog open={addAddressOpen} onOpenChange={setAddAddressOpen} />

      {/* Transfer Drawer (Dual-Account 2b, mobile) */}
      <TransferDrawer open={transferOpen} onOpenChange={setTransferOpen} initialDirection={transferInitDir} />

      {/* Delete Confirmation - Mobile */}
      <DeleteAddressDrawer
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        label={walletToDelete?.label}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
}

