import { useEffect, useRef, useState } from "react";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
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
import { PageHeader } from "@/components/PageHeader";
import { TopUpDialog } from "@/components/TopUpDialog";
import { LoadingState, EmptyState, ErrorState } from "@/components/states";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  MobileDrawer,
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
import { AddAddressDialog } from "@/components/wallet/AddAddressDialog";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { WithdrawDialog } from "@/components/withdraw/WithdrawDialog";
import { TransferDialog } from "@/components/wallet/TransferDialog";
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
import { useH2eRewardsSummary } from "@/hooks/useH2eRewardsSummary";





export default function Wallet() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { balance, spotBalance, user } = useUserProfile();
  const { imTotal, unrealizedPnL, hasPositions } = useRealtimeRiskMetrics();
  const h2e = useH2eRewardsSummary();
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
  const [topUpOpen, setTopUpOpen] = useState(false);
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
              <span className="text-muted-foreground">Margin in Use:</span>
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


  // Address Card for individual saved address
  const AddressCard = ({ wallet }: { wallet: typeof wallets[0] }) => (
    <div className="relative bg-muted/20 border border-border/40 rounded-xl p-3 hover:border-border/70 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center p-1.5 flex-shrink-0">
          <img src={wallet.icon} alt={wallet.network} className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm truncate">{wallet.label}</span>
            {wallet.isPrimary && (
              <Badge variant="outline" className="border-primary/50 text-primary text-[10px] px-1.5 py-0 h-4">
                Default
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <code className="text-xs font-mono text-muted-foreground truncate">{wallet.address}</code>
            <button
              onClick={() => handleCopyWallet(wallet.id, wallet.fullAddress)}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Copy address"
            >
              {copiedWalletId === wallet.id ? (
                <Check className="w-3 h-3 text-trading-green" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground">{wallet.network}</span>
        </div>

        {/* Icon-only actions, top-right */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {!wallet.isPrimary && (
            <button
              onClick={() => handleSetPrimaryWallet(wallet.id)}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label="Set as default"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => handleDeleteWallet({ id: wallet.id, label: wallet.label })}
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-trading-red hover:bg-trading-red/10 transition-colors"
            aria-label="Delete address"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Saved Addresses List Component (mobile)
  const SavedAddressesList = () => (
    <div className="trading-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Saved Addresses</h2>
        <span className="text-xs text-muted-foreground">
          {wallets.length} address{wallets.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {walletsLoading ? (
        <LoadingState label="Loading addresses…" />
      ) : (
        <div className="space-y-2">
          {wallets.map((wallet) => (
            <AddressCard key={wallet.id} wallet={wallet} />
          ))}

          <button
            onClick={() => setAddAddressOpen(true)}
            className="w-full border border-dashed border-border/60 hover:border-primary/50 rounded-xl h-10 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Address</span>
          </button>

          {wallets.length === 0 && !walletsLoading && (
            <EmptyState
              variant="inline"
              icon={Star}
              title="No saved addresses"
              description="Save addresses for quick deposits and withdrawals."
              className="py-4"
            />
          )}
        </div>
      )}
    </div>
  );

  // H2E Rewards Card Component
  const H2eRewardsCard = () => {
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
                        {!isStarter && isReached && showH2eUnlockToast && tier.percent === h2e.unlockedPercent && (
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
                      {!isStarter && isReached && showH2eUnlockToast && tier.percent === h2e.unlockedPercent && (
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
          {showH2eUnlockToast && (
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

  // Desktop Layout
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <EventsDesktopHeader />
        
        <AuthGateOverlay title="Sign in to view your wallet" description="Manage your funds and saved addresses by signing in.">
        <main className="mx-auto w-full max-w-7xl px-8 py-10 space-y-6">
          <PageHeader title="Wallet" subtitle="Manage your funds and saved addresses" />

          <MaintenanceNoticeBanner className="mb-6" />

          {/* Band 1 · Total Equity 全宽总览条（DESIGN.md §5 例外：Wallet Total Equity Card） */}
          <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-trading-green/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <WalletIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Est. Total Equity
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-3xl font-bold whitespace-nowrap">
                      {equityHidden ? "••••••" : `$${formatEquityUsd(totalEquity)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEquityHidden((v) => !v)}
                      className="text-muted-foreground/70 hover:text-foreground transition-colors"
                      aria-label={equityHidden ? "Show balance" : "Hide balance"}
                    >
                      {equityHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                    Spot + Futures · does not include unrealized PnL
                  </div>
                </div>
              </div>
              <div className="flex gap-2 lg:shrink-0">
                <Button className="btn-trading-green h-11 px-5" onClick={() => setDepositDialogOpen(true)}>
                  <ArrowDownLeft className="w-4 h-4 mr-1.5" /> Deposit
                </Button>
                <Button
                  variant="outline"
                  className="h-11 px-5 border-border/50 hover:bg-muted/50 rounded-xl"
                  onClick={() => setWithdrawDialogOpen(true)}
                >
                  <ArrowUpRight className="w-4 h-4 mr-1.5" /> Withdraw
                </Button>
                <Button
                  variant="outline"
                  className="h-11 px-5 border-border/50 hover:bg-muted/50 rounded-xl"
                  onClick={() => openTransfer("to_spot")}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Transfer
                </Button>
              </div>
            </div>
          </section>

          {/* Band 2 · 双账户卡（Spot / Futures），stats-card 规格，不套英雄渐变 */}
          <section className="grid grid-cols-2 gap-6">
            {/* Spot Account */}
            <div className="stats-card p-6 relative">
              <button
                type="button"
                onClick={() => openTransfer("to_spot")}
                className="absolute top-4 right-4 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors"
                aria-label="Transfer to Spot"
                title="Transfer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
              <div className="text-sm font-medium text-muted-foreground">Spot Account</div>
              <div className="mt-2 font-mono text-2xl font-semibold">${formatEquityUsd(spotBalance)}</div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="p-3 rounded-lg bg-muted/20">
                  <div className="text-xs text-muted-foreground mb-1">Available (USDC)</div>
                  <div className="font-mono text-sm font-semibold">${formatEquityUsd(spotBalance)}</div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-3">
                Funds US-stock spot trading. Not shared with Futures.
              </div>
            </div>

            {/* Futures Account */}
            <div className="stats-card p-6 relative">
              <button
                type="button"
                onClick={() => openTransfer("to_futures")}
                className="absolute top-4 right-4 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors"
                aria-label="Transfer to Futures"
                title="Transfer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
              <div className="text-sm font-medium text-muted-foreground">Futures Account</div>
              <div className="mt-2 font-mono text-2xl font-semibold">
                ${formatEquityUsd(balance)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/20">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-muted-foreground">Available</span>
                    <AvailableBalanceTooltip marginInUse={imTotal} unrealizedPnL={unrealizedPnL} />
                  </div>
                  <div className="font-mono text-sm font-semibold">${formatEquityUsd(balance)}</div>
                </div>
                {h2e.lockedAmount > 0 && (
                  <>
                    <div className="p-3 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">Withdrawable</span>
                        <InfoTooltip text="Available balance minus the still-locked portion of hedge airdrop rewards." />
                      </div>
                      <div className="font-mono text-sm font-semibold">
                        ${formatEquityUsd(withdrawableBalance)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-1 mb-1">
                        <Lock className="w-3 h-3 text-primary" />
                        <span className="text-xs text-muted-foreground">H2E Locked</span>
                        <InfoTooltip text="Hedge airdrop earnings unlock in tiers as trading volume grows. Full withdrawal unlock is at $400K volume." />
                      </div>
                      <div className="font-mono text-sm font-semibold text-primary">
                        ${formatEquityUsd(h2e.lockedAmount)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Band 3 · 12 栅格 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <PendingConfirmations className="trading-card p-6" />
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
            </div>
            <div className="col-span-4 space-y-6">
              <H2eRewardsCard />
              <div className="trading-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Saved Addresses</h2>
                  <span className="text-sm text-muted-foreground">
                    {wallets.length} address{wallets.length !== 1 ? "es" : ""}
                  </span>
                </div>
                {walletsLoading ? (
                  <LoadingState label="Loading addresses…" />
                ) : (
                  <div className="space-y-3">
                    {wallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        className="bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center p-2">
                            <img src={wallet.icon} alt={wallet.network} className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{wallet.label}</span>
                              {wallet.isPrimary && (
                                <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-muted-foreground">{wallet.address}</code>
                              <button
                                onClick={() => handleCopyWallet(wallet.id, wallet.fullAddress)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copiedWalletId === wallet.id ? (
                                  <Check className="w-3 h-3 text-trading-green" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <span className="text-xs text-muted-foreground">{wallet.network}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border/30 flex justify-end gap-2">
                          {!wallet.isPrimary && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetPrimaryWallet(wallet.id)}
                              className="text-primary hover:text-primary hover:bg-primary/10 h-8 text-xs"
                            >
                              <Star className="w-3 h-3 mr-1" /> Set Default
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWallet({ id: wallet.id, label: wallet.label })}
                            className="text-muted-foreground hover:text-trading-red hover:bg-trading-red/10 h-8 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setAddAddressOpen(true)}
                      className="w-full border-2 border-dashed border-border/50 hover:border-primary/50 rounded-xl p-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Add Address</span>
                    </button>
                    {wallets.length === 0 && !walletsLoading && (
                      <EmptyState
                        variant="inline"
                        icon={Star}
                        title="No saved addresses"
                        description="Save addresses for quick deposits and withdrawals."
                        className="py-4"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
        </AuthGateOverlay>

        <TopUpDialog 
          open={topUpOpen} 
          onOpenChange={setTopUpOpen} 
          currentBalance={balance}
          onTopUp={(amount, method) => {
            toast.success(`Deposited $${amount} via ${method}`);
          }}
        />

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
      <MobileHeader title="Wallet" showLogo={false} showBack={true} />

      <AuthGateOverlay title="Sign in to view your wallet" description="Manage your funds and saved addresses by signing in." maxPreviewHeight="400px">
      <div className="px-4 py-6 space-y-4">
        <MaintenanceNoticeBanner />

        {/* Band 1 · Total Equity 总览条（与桌面同构，走 computeTotalEquity） */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-4">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <WalletIcon className="w-4 h-4 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Est. Total Equity
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold whitespace-nowrap">
                {equityHidden ? "••••••" : `$${formatEquityUsd(totalEquity)}`}
              </span>
              <button
                type="button"
                onClick={() => setEquityHidden((v) => !v)}
                className="text-muted-foreground/70 hover:text-foreground transition-colors"
                aria-label={equityHidden ? "Show balance" : "Hide balance"}
              >
                {equityHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
              Spot + Futures · does not include unrealized PnL
            </div>
          </div>
        </section>

        {/* 单一入口三按钮 */}
        <div className="grid grid-cols-3 gap-2">
          <Button className="btn-trading-green h-11" onClick={() => navigate("/deposit")}>
            <ArrowDownLeft className="w-4 h-4 mr-1.5" /> Deposit
          </Button>
          <Button variant="outline" className="h-11" onClick={() => navigate("/withdraw")}>
            <ArrowUpRight className="w-4 h-4 mr-1.5" /> Withdraw
          </Button>
          <Button variant="outline" className="h-11" onClick={() => openTransfer("to_spot")}>
            <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Transfer
          </Button>
        </div>

        {/* Band 2 · Spot / Futures 账户卡纵向 */}
        <section className="space-y-3">
          {/* Spot Account */}
          <div className="stats-card p-4 relative">
            <button
              type="button"
              onClick={() => openTransfer("to_spot")}
              className="absolute top-3 right-3 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors"
              aria-label="Transfer to Spot"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
            <div className="text-sm font-medium text-muted-foreground">Spot Account</div>
            <div className="mt-1.5 font-mono text-2xl font-semibold">${formatEquityUsd(spotBalance)}</div>
            <div className="mt-3 p-3 rounded-lg bg-muted/20">
              <div className="text-xs text-muted-foreground mb-0.5">Available (USDC)</div>
              <div className="font-mono text-sm font-semibold">${formatEquityUsd(spotBalance)}</div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">
              Funds US-stock spot trading. Not shared with Futures.
            </div>
          </div>

          {/* Futures Account */}
          <div className="stats-card p-4 relative">
            <button
              type="button"
              onClick={() => openTransfer("to_futures")}
              className="absolute top-3 right-3 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors"
              aria-label="Transfer to Futures"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
            <div className="text-sm font-medium text-muted-foreground">Futures Account</div>
            <div className="mt-1.5 font-mono text-2xl font-semibold">${formatEquityUsd(balance)}</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[11px] text-muted-foreground">Available</span>
                  <AvailableBalanceTooltip marginInUse={imTotal} unrealizedPnL={unrealizedPnL} />
                </div>
                <div className="font-mono text-sm font-semibold">${formatEquityUsd(balance)}</div>
              </div>
              {h2e.lockedAmount > 0 && (
                <>
                  <div className="p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[11px] text-muted-foreground">Withdrawable</span>
                      <InfoTooltip text="Available balance minus the still-locked portion of hedge airdrop rewards." />
                    </div>
                    <div className="font-mono text-sm font-semibold">${formatEquityUsd(withdrawableBalance)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Lock className="w-3 h-3 text-primary" />
                      <span className="text-[11px] text-muted-foreground">H2E Locked</span>
                      <InfoTooltip text="Hedge airdrop earnings unlock in tiers as trading volume grows. Full withdrawal unlock is at $400K volume." />
                    </div>
                    <div className="font-mono text-sm font-semibold text-primary">
                      ${formatEquityUsd(h2e.lockedAmount)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <H2eRewardsCard />
        <PendingConfirmations className="trading-card p-4" />
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
      </div>
      </AuthGateOverlay>

      <BottomNav />

      <TopUpDialog 
        open={topUpOpen} 
        onOpenChange={setTopUpOpen} 
        currentBalance={balance}
        onTopUp={(amount, method) => {
          toast.success(`Deposited $${amount} via ${method}`);
        }}
      />

      {/* Add Address Dialog (shared component handles mobile/desktop) */}
      <AddAddressDialog open={addAddressOpen} onOpenChange={setAddAddressOpen} />

      {/* Transfer Drawer (Dual-Account 2b, mobile) */}
      <TransferDrawer open={transferOpen} onOpenChange={setTransferOpen} initialDirection={transferInitDir} />

      {/* Delete Confirmation - Mobile */}
      <MobileDrawer
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        showHandle={true}
      >
        <MobileDrawerStatus
          icon={<AlertTriangle className="w-8 h-8 text-trading-red" />}
          title="Delete Address?"
          description={`Are you sure you want to delete "${walletToDelete?.label}"? This action cannot be undone.`}
          variant="error"
        />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            className="flex-1 h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            className="flex-1 h-12 bg-trading-red hover:bg-trading-red/90 text-white"
          >
            Delete
          </Button>
        </div>
      </MobileDrawer>

      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} currentBalance={balance} />
    </div>
  );
}

