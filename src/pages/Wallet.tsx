import { useState } from "react";
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
  Eye,
  EyeOff,
  ArrowLeftRight,
  MoreHorizontal,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useCategoryBoostConfigs from "@/hooks/useCategoryBoostConfigs";
import { cn } from "@/lib/utils";
import { SeoFooter } from "@/components/seo/SeoFooter";

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
  equityNote = "does not include unrealized PnL",
}: {
  equity: number;
  hidden: boolean;
  onToggleHidden: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  compact?: boolean;
  equityNote?: string;
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
          Boost + Standard · {equityNote}
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

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Boost (futures) available-balance popover. Module-scope on purpose: defining
 * it inside the Wallet component gave it a fresh component identity on every
 * re-render, which remounted the Popover and closed it after ~600ms.
 */
export const AvailableBalanceTooltip = ({ marginInUse, unrealizedPnL }: { marginInUse: number; unrealizedPnL: number }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { surface } = useSurface();
  const isLite = surface === "lite";

  const content = (
    <div className="space-y-2">
      <p className="text-xs">
        {isLite
          ? "Cash you can trade or withdraw. Doesn't include open trade profit."
          : "Cash you can trade or withdraw. Doesn't include unrealized PnL."}
      </p>
      {marginInUse > 0 && (
        <div className="pt-2 border-t border-border/50 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">In use by open positions:</span>
            <span className="font-mono text-trading-yellow">${formatCurrency(marginInUse)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{isLite ? "Open trade profit:" : "Unrealized P&L:"}</span>
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

/**
 * Standard (spot) available-balance popover — same Popover grammar as the
 * Boost card's AvailableBalanceTooltip: one definition line + Portfolio link.
 */
const StandardAvailableTooltip = () => {
  const navigate = useNavigate();
  const { surface } = useSurface();
  const isLite = surface === "lite";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Info className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="top" align="center">
        <div className="space-y-2">
          <p className="text-xs">
            {isLite
              ? "Cash you can trade or withdraw. Doesn't include open trade profit — money spent on shares sits in your positions."
              : "Cash you can trade or withdraw. Doesn't include unrealized PnL — money spent on shares sits in your positions."}
          </p>
          <button
            onClick={() => navigate('/portfolio')}
            className="w-full mt-2 text-xs text-primary hover:underline text-left"
          >
            View positions in Portfolio →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

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
    <div className="mt-3.5 flex items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Available (USDC)
      </span>
      <StandardAvailableTooltip />
    </div>
    <div className={cn(
      "font-display font-bold tabular-nums leading-none mt-2",
      compact ? "text-3xl" : "text-4xl",
    )}>
      {hidden ? "••••" : `$${formatEquityUsd(balance)}`}
    </div>
    <p className="text-[11px] text-muted-foreground mt-3.5 leading-relaxed">
      Buy and sell shares at full price.
    </p>
  </AccountCardShell>
);

export const FuturesAccountCard = ({
  balance,
  hidden,
  onTransfer,
  marginInUse,
  unrealizedPnL,
  AvailableTooltip,
  compact = false,
  boostMax,
}: {
  balance: number;
  hidden: boolean;
  onTransfer: () => void;
  marginInUse: number;
  unrealizedPnL: number;
  AvailableTooltip: React.ComponentType<{ marginInUse: number; unrealizedPnL: number }>;
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
      <div className="mt-3.5 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Available (USDC)
        </span>
        <AvailableTooltip marginInUse={marginInUse} unrealizedPnL={unrealizedPnL} />
      </div>
      <div className={cn(
        "font-display font-bold tabular-nums leading-none mt-2",
        compact ? "text-3xl" : "text-4xl",
      )}>
        {mask(balance)}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3.5 leading-relaxed">
        Put in a little to control a bigger trade{boostMax && boostMax > 1 ? ` — Boost up to ${boostMax}×` : ""}.
      </p>
    </AccountCardShell>
  );
};


/**
 * Inert blurred under-layer for the /deposit and /withdraw guest gate.
 * Pure presentational shapes — never fetches an address or renders a form.
 */
export const WalletGatePlaceholder = () => (
  <div className="p-4 space-y-3" aria-hidden="true">
    <div className="h-24 rounded-xl bg-muted/30" />
    <div className="h-10 rounded-lg bg-muted/20" />
    <div className="h-40 rounded-xl bg-muted/30" />
    <div className="h-10 rounded-lg bg-muted/20" />
  </div>
);

/** Surface-aware wallet auth gate: Lite → LiteAuthGate, Pro → AuthGateOverlay (unchanged). */
export const WalletAuthGate = ({
  isLite,
  maxPreviewHeight,
  children,
  /** Docs-only: force the signed-out overlay in /style-guide. Never set in product. */
  forceSignedOut = false,
}: {
  isLite: boolean;
  maxPreviewHeight?: string;
  children: React.ReactNode;
  forceSignedOut?: boolean;
}) =>
  isLite ? (
    <LiteAuthGate
      title="Sign in to view your wallet"
      description="Deposit, withdraw and move funds between your accounts by signing in."
      forceSignedOut={forceSignedOut}
    >
      {children}
    </LiteAuthGate>
  ) : (
    <AuthGateOverlay
      title="Sign in to view your wallet"
      description="Manage your funds and saved addresses by signing in."
      maxPreviewHeight={maxPreviewHeight}
      forceSignedOut={forceSignedOut}
    >
      {children}
    </AuthGateOverlay>
  );


/**
 * Saved-address presentational pieces. Extracted verbatim from the /wallet
 * body (no visual or logic change) so /style-guide can mount the PRODUCTION
 * markup with fixture props instead of a hand-copied replica.
 */
export type SavedAddressView = {
  id: string;
  label: string;
  address: string;
  fullAddress: string;
  isPrimary?: boolean;
};

export const SavedAddressRowView = ({
  wallet,
  isLast,
  isMobile,
  copied,
  onOpenActions,
  onCopy,
  onSetPrimary,
  onDelete,
}: {
  wallet: SavedAddressView;
  isLast: boolean;
  isMobile: boolean;
  copied: boolean;
  onOpenActions: () => void;
  onCopy: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
}) => (
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
    {isMobile ? (
      <button
        onClick={onOpenActions}
        className="text-muted-foreground hover:text-white transition-colors shrink-0"
        aria-label="More actions"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    ) : (
      <div className="flex items-center gap-1">
        <button
          onClick={onCopy}
          className="text-muted-foreground hover:text-white transition-colors shrink-0"
          aria-label="Copy address"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-trading-green" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-white transition-colors shrink-0" aria-label="More actions">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" side="bottom" className="w-[210px] p-1 bg-[#12151A] border-[#1D2026] rounded-xl">
            {!wallet.isPrimary && (
              <button
                onClick={onSetPrimary}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] text-[#F2F3F5] hover:bg-white/5 transition-colors"
              >
                <Star className="w-4 h-4" /> Set as default
              </button>
            )}
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] text-[#FF5C5C] hover:bg-[rgba(255,92,92,0.1)] transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete address
            </button>
          </PopoverContent>
        </Popover>
      </div>
    )}
  </div>
);

/** Body of the mobile saved-address actions MobileDrawer. */
export const SavedAddressActionsList = ({
  wallet,
  onSetPrimary,
  onCopy,
  onDelete,
}: {
  wallet: SavedAddressView;
  onSetPrimary: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) => (
  <>
    <div className="text-xs text-muted-foreground px-1.5 pb-1">{wallet.label} · {wallet.address}</div>
    <div className="flex flex-col">
      {!wallet.isPrimary && (
        <button
          onClick={onSetPrimary}
          className="flex items-center gap-3 py-[15px] border-b border-[#1D2026] text-[15px] text-[#F2F3F5]"
        >
          <Star className="w-[18px] h-[18px]" /> Set as default
        </button>
      )}
      <button
        onClick={onCopy}
        className="flex items-center gap-3 py-[15px] border-b border-[#1D2026] text-[15px] text-[#F2F3F5]"
      >
        <Copy className="w-[18px] h-[18px]" /> Copy address
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-3 py-[15px] text-[15px] text-[#FF5C5C]"
      >
        <Trash2 className="w-[18px] h-[18px]" /> Delete address
      </button>
    </div>
  </>
);


export default function Wallet() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { surface } = useSurface();
  const isLite = surface === "lite";
  const { balance, spotBalance, user } = useUserProfile();
  const { imTotal, unrealizedPnL, hasPositions } = useRealtimeRiskMetrics();
  const { maxBoost } = useCategoryBoostConfigs();
  const { 
    wallets, 
    isLoading: walletsLoading, 
    addWallet, 
    removeWallet, 
    setPrimaryWallet 
  } = useWallets();

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
        .select("id, event_name, option_label, pnl, created_at, closed_at, status, product_line")
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
    // trades.product_line: 'futures' → BOOST, anything else ('spot') → STANDARD
    account: ((trade as { product_line?: string }).product_line === 'futures' ? 'futures' : 'spot') as 'spot' | 'futures',
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
    // Every row must carry an account badge; legacy rows without `account`
    // fall back to Standard (spot), where funding movements land by default.
    account: ((tx as { account?: string }).account === 'futures' ? 'futures' : 'spot') as 'spot' | 'futures',
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
  const [actionsWallet, setActionsWallet] = useState<typeof wallets[0] | null>(null);

  const totalEquity = computeTotalEquity({ spotBalance, balance });
  const openTransfer = (dir: "to_spot" | "to_futures" = "to_spot") => {
    setTransferInitDir(dir);
    setTransferOpen(true);
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

  // Available Balance Popover — hoisted to module scope (see AvailableBalanceTooltip below).

  // BalanceCard removed (dual-account 2b): mobile now uses the same Band 1 Total Equity
  // + dual-account cards structure as desktop. See docs/changelog/2026-07-21-dual-account-wallet-ui.md §2.


  // Clean saved-address row (Signal DNA): hairline-separated row, no avatar, no inline delete/set-default.
  const AddressRow = ({ wallet, isLast }: { wallet: typeof wallets[0]; isLast: boolean }) => (
    <SavedAddressRowView
      wallet={wallet}
      isLast={isLast}
      isMobile={isMobile}
      copied={copiedWalletId === wallet.id}
      onOpenActions={() => setActionsWallet(wallet)}
      onCopy={() => handleCopyWallet(wallet.id, wallet.fullAddress)}
      onSetPrimary={() => handleSetPrimaryWallet(wallet.id)}
      onDelete={() => handleDeleteWallet({ id: wallet.id, label: wallet.label })}
    />
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
        
        <WalletAuthGate isLite={isLite}>
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
            equityNote={isLite ? "does not include open trade profit" : undefined}
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
              hidden={equityHidden}
              onTransfer={() => openTransfer("to_futures")}
              marginInUse={imTotal}
              unrealizedPnL={unrealizedPnL}
              AvailableTooltip={AvailableBalanceTooltip}
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
        </WalletAuthGate>

        <SeoFooter />

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
    <div className="flex min-h-screen flex-col bg-background">
      <MobileHeader variant="brand" showBack={false} />

      <WalletAuthGate isLite={isLite} maxPreviewHeight="400px">
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
          equityNote={isLite ? "does not include open trade profit" : undefined}
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
            hidden={equityHidden}
            onTransfer={() => openTransfer("to_futures")}
            marginInUse={imTotal}
            unrealizedPnL={unrealizedPnL}
            AvailableTooltip={AvailableBalanceTooltip}
            boostMax={maxBoost}
            compact
          />
        </section>

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
      </WalletAuthGate>

      <div style={{ marginBottom: "var(--bottom-nav-h, 76px)" }}>
        <SeoFooter />
      </div>

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

      {/* Saved-address actions (mobile) */}
      <MobileDrawer open={!!actionsWallet} onOpenChange={(o) => !o && setActionsWallet(null)} hideCloseButton>
        {actionsWallet && (
          <SavedAddressActionsList
            wallet={actionsWallet}
            onSetPrimary={() => { handleSetPrimaryWallet(actionsWallet.id); setActionsWallet(null); }}
            onCopy={() => { handleCopyWallet(actionsWallet.id, actionsWallet.fullAddress); setActionsWallet(null); }}
            onDelete={() => { handleDeleteWallet({ id: actionsWallet.id, label: actionsWallet.label }); setActionsWallet(null); }}
          />
        )}
      </MobileDrawer>


    </div>
  );
}

