import { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  History,
  TrendingUp,
  TrendingDown,
  Wallet as WalletIcon,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Banknote,
  Gift,
  Receipt,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';
import { useIsMobile } from '@/hooks/use-mobile';
import { PRODUCT_LINE_BADGE_CLASSES, PRODUCT_LINE_LABELS } from '@/lib/productLineBadge';
import { EmptyState } from '@/components/states';
import lynxEmptyActivity from '@/assets/wallet/lynx-empty-activity.png';


// Network explorer URLs for txHash links
// Historical networks only — new withdrawals are Base-only (2026-09-03).
const EXPLORER_URLS: Record<string, string> = {
  'Ethereum': 'https://etherscan.io/tx/',
  'BNB Smart Chain (BEP20)': 'https://bscscan.com/tx/',
  'Polygon': 'https://polygonscan.com/tx/',
  'Arbitrum One': 'https://arbiscan.io/tx/',
  'Optimism': 'https://optimistic.etherscan.io/tx/',
  'Avalanche C-Chain': 'https://snowtrace.io/tx/',
  'Bitcoin': 'https://blockchair.com/bitcoin/transaction/',
  'Solana': 'https://solscan.io/tx/',
  'Tron (TRC20)': 'https://tronscan.org/#/transaction/',
  'Base': 'https://basescan.org/tx/',
};


export type TransactionType =
  | 'deposit'
  | 'withdraw'
  | 'trade_profit'
  | 'trade_loss'
  | 'platform_credit'
  | 'bonus'
  | 'fee'
  | 'cross_chain_in'
  | 'cross_chain_out'
  | 'fiat_buy'
  | 'fiat_sell'
  | 'transfer_to_spot'
  | 'transfer_to_futures';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
export type TransactionAccount = 'spot' | 'futures';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  timestamp: number;
  txHash?: string | null;
  network?: string | null;
  status?: TransactionStatus;
  fee?: number | null;
  sourceChain?: string | null;
  destChain?: string | null;
  sourceToken?: string | null;
  destToken?: string | null;
  account?: TransactionAccount | null;
}

interface TransactionHistoryProps {
  transactions?: Transaction[];
  className?: string;
  /**
   * Style-guide only (docs fixture). Seeds the initial pill filter / expanded
   * row so a static state can be photographed. Never set in product code —
   * when omitted the component behaves exactly as before.
   */
  fixture?: {
    /**
     * Deterministic rows. When present the component renders these instead of
     * the caller's live list and skips the realtime subscription entirely.
     */
    transactions?: Transaction[];
    initialFilter?: 'all' | 'deposit' | 'withdraw' | 'trade';
    initialExpandedId?: string;
    initialExpandedIds?: string[];
  };
}


const STATUS_CONFIG: Record<TransactionStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-trading-yellow', label: 'Pending Review' },
  processing: { icon: Loader2, color: 'text-primary', label: 'Processing' },
  completed: { icon: CheckCircle2, color: 'text-trading-green', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-trading-red', label: 'Failed' },
  rejected: { icon: XCircle, color: 'text-trading-red', label: 'Rejected' },
};

const TYPE_LABELS: Record<TransactionType, string> = {
  deposit: 'Deposits',
  withdraw: 'Withdrawals',
  trade_profit: 'Trade Profits',
  trade_loss: 'Trade Losses',
  platform_credit: 'Platform Credits',
  bonus: 'Rewards & Vouchers',
  fee: 'Fees',
  cross_chain_in: 'Cross-Chain In',
  cross_chain_out: 'Cross-Chain Out',
  fiat_buy: 'Fiat Buy',
  fiat_sell: 'Fiat Sell',
  transfer_to_spot: 'Transfer → Standard',
  transfer_to_futures: 'Transfer → Boost',
};

const TYPE_BADGE_CONFIG: Record<TransactionType, { label: string; className: string }> = {
  deposit: { label: 'Deposit', className: 'border-trading-green/30 bg-trading-green/10 text-trading-green' },
  withdraw: { label: 'Withdraw', className: 'border-trading-red/30 bg-trading-red/10 text-trading-red' },
  trade_profit: { label: 'Trade P&L', className: 'border-trading-green/30 bg-trading-green/10 text-trading-green' },
  trade_loss: { label: 'Trade P&L', className: 'border-trading-red/30 bg-trading-red/10 text-trading-red' },
  platform_credit: { label: 'Credit', className: 'border-trading-green/30 bg-trading-green/10 text-trading-green' },
  bonus: { label: 'Reward', className: 'border-trading-green/30 bg-trading-green/10 text-trading-green' },
  fee: { label: 'Fee', className: 'border-trading-red/30 bg-trading-red/10 text-trading-red' },
  // Pro-only tx types; not surfaced on Lite
  cross_chain_in: { label: 'Cross-Chain In', className: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
  cross_chain_out: { label: 'Cross-Chain Out', className: 'border-orange-500/30 bg-orange-500/10 text-orange-400' },
  fiat_buy: { label: 'Fiat Buy', className: 'border-purple-500/30 bg-purple-500/10 text-purple-400' },
  fiat_sell: { label: 'Fiat Sell', className: 'border-pink-500/30 bg-pink-500/10 text-pink-400' },
  transfer_to_spot: { label: 'Transfer', className: 'border-primary/30 bg-primary/10 text-primary' },
  transfer_to_futures: { label: 'Transfer', className: 'border-primary/30 bg-primary/10 text-primary' },
};

// Sourced from src/lib/productLineBadge — DO NOT hand-roll classes here.
// If SPOT/FUTURES colors need to change, edit PRODUCT_LINE_BADGE_CLASSES,
// not this map.
const ACCOUNT_BADGE_CONFIG: Record<TransactionAccount, { label: string; className: string }> = {
  spot: { label: PRODUCT_LINE_LABELS.spot, className: PRODUCT_LINE_BADGE_CLASSES.spot },
  futures: { label: PRODUCT_LINE_LABELS.futures, className: PRODUCT_LINE_BADGE_CLASSES.futures },
};

export const TransactionHistory = ({ transactions = [], className, fixture }: TransactionHistoryProps) => {
  const rows = fixture?.transactions ?? transactions;
  type PillFilter = 'all' | 'deposit' | 'withdraw' | 'trade';
  const [pillFilter, setPillFilter] = useState<PillFilter>(fixture?.initialFilter ?? 'all');
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [expandedIds, setExpandedIds] = useState<string[]>(
    fixture?.initialExpandedIds ?? (fixture?.initialExpandedId ? [fixture.initialExpandedId] : []),
  );


  

  // Subscribe to real-time transaction updates
  useRealtimeTransactions(!fixture?.transactions);

  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format description based on status and terminology
  const formatDescription = (tx: Transaction): string => {
    let description = tx.description;
    
    // Remove "incoming" suffix for completed deposits
    if (tx.type === 'deposit' && tx.status === 'completed') {
      description = description.replace(/ incoming$/i, '');
    }
    
    // Neutralize legacy Trial Bonus wording on historical platform_credit rows
    // (Trial Bonus fully sunset 2026-07-21 — history must not render "trial").
    if (tx.type === 'platform_credit') {
      description = description.replace(/trial (balance|bonus)/gi, 'Platform credit');
    }

    // E1 · win/lose is decided by the NET AMOUNT SIGN, never by the tx type.
    // Legacy rows carry a "· Won" / "· Lost" suffix written from the type at
    // settlement time; historical mismatches (type=trade_loss with a positive
    // net) must not render "Lost". Rewrite the trailing verdict word from the
    // sign so the row, its amount colour and its wording always agree.
    if (tx.type === 'trade_profit' || tx.type === 'trade_loss') {
      const verdict = tx.amount >= 0 ? 'Won' : 'Lost';
      description = description.replace(/(·|-|—)\s*(won|lost)\s*$/i, `· ${verdict}`);
    }

    // Directional wording for the two transfer legs
    if (tx.type === 'transfer_to_futures') {
      return tx.account === 'futures' ? 'Transfer from Standard' : 'Transfer to Boost';
    }
    if (tx.type === 'transfer_to_spot') {
      return tx.account === 'spot' ? 'Transfer from Boost' : 'Transfer to Standard';
    }


    return description;
  };

  const getExplorerUrl = (network: string | null | undefined, txHash: string): string | null => {
    if (!network || !txHash) return null;
    const baseUrl = EXPLORER_URLS[network];
    if (!baseUrl) return null;
    return `${baseUrl}${txHash}`;
  };

  const truncateTxHash = (hash: string): string => {
    if (hash.length <= 15) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  const clearFilters = () => setPillFilter('all');

  // Apply pill filter
  const filteredTransactions = rows.filter(tx => {
    if (pillFilter === 'all') return true;
    // E4 · fiat_buy is a funding-in row on Lite — it belongs under Deposits.
    if (pillFilter === 'deposit') return tx.type === 'deposit' || tx.type === 'fiat_buy';

    if (pillFilter === 'withdraw') return tx.type === 'withdraw';
    if (pillFilter === 'trade') return tx.type === 'trade_profit' || tx.type === 'trade_loss';
    return true;
  });

  const hasActiveFilters = pillFilter !== 'all';

  const PILLS: { key: PillFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'deposit', label: 'Deposits' },
    { key: 'withdraw', label: 'Withdrawals' },
    { key: 'trade', label: 'Trades' },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset page when filters change
  const effectiveCurrentPage = currentPage > totalPages ? 1 : currentPage;
  if (effectiveCurrentPage !== currentPage && totalPages > 0) {
    setCurrentPage(1);
  }

  const getPaginationRange = (): (number | "ellipsis")[] => {
    const range: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (currentPage > 3) range.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (currentPage < totalPages - 2) range.push("ellipsis");
      range.push(totalPages);
    }
    return range;
  };

  const getTransactionIcon = (tx: Transaction) => {
    // E1b · trade_profit / trade_loss rows follow the NET AMOUNT SIGN for both
    // the icon and its background. The type only drives the source note.
    if (tx.type === 'trade_profit' || tx.type === 'trade_loss') {
      return tx.amount >= 0
        ? <TrendingUp className="w-5 h-5 text-trading-green" />
        : <TrendingDown className="w-5 h-5 text-trading-red" />;
    }

    switch (tx.type) {
      case 'deposit': return <ArrowDownLeft className="w-5 h-5 text-trading-green" />;
      case 'withdraw': return <ArrowUpRight className="w-5 h-5 text-trading-red" />;
      case 'platform_credit': return <WalletIcon className="w-5 h-5 text-trading-green" />;
      case 'bonus': return <Gift className="w-5 h-5 text-trading-green" />;
      case 'fee': return <Receipt className="w-5 h-5 text-trading-red" />;
      // Pro-only tx types; not surfaced on Lite
      case 'cross_chain_in': return <ArrowLeftRight className="w-5 h-5 text-blue-400" />;
      case 'cross_chain_out': return <ArrowLeftRight className="w-5 h-5 text-orange-400" />;
      // E4 · fiat_buy renders isomorphic to a crypto deposit row (green in-arrow).
      case 'fiat_buy': return <ArrowDownLeft className="w-5 h-5 text-trading-green" />;
      case 'fiat_sell': return <Banknote className="w-5 h-5 text-pink-400" />;

      case 'transfer_to_spot':
      case 'transfer_to_futures':
        return <ArrowLeftRight className="w-5 h-5 text-primary" />;
      default: return <WalletIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTransactionBgColor = (tx: Transaction) => {
    // E1b · trade_profit / trade_loss background also follows the net sign.
    if (tx.type === 'trade_profit' || tx.type === 'trade_loss') {
      return tx.amount >= 0 ? 'bg-trading-green/20' : 'bg-trading-red/20';
    }

    switch (tx.type) {
      case 'deposit': case 'platform_credit': case 'bonus': return 'bg-trading-green/20';
      case 'withdraw': case 'fee': return 'bg-trading-red/20';
      // Pro-only tx types; not surfaced on Lite
      case 'cross_chain_in': return 'bg-blue-500/20';
      case 'cross_chain_out': return 'bg-orange-500/20';
      case 'fiat_buy': return 'bg-trading-green/20';
      case 'fiat_sell': return 'bg-pink-500/20';
      case 'transfer_to_spot':
      case 'transfer_to_futures':
        return 'bg-primary/20';
      default: return 'bg-muted/20';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      if (!fixture?.initialExpandedIds) return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id];
    });
  };

  // Check if a transaction has extra details worth showing
  const hasDetails = (tx: Transaction) => {
    return tx.txHash || (tx.status && tx.status !== 'completed') || tx.network || tx.fee || tx.sourceChain || tx.destChain;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header: microlabel + inline pill filters */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground shrink-0">
          Transaction history
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
          {PILLS.map((p) => {
            const active = pillFilter === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setPillFilter(p.key)}
                className={cn(
                  "px-[15px] py-[7px] rounded-full text-xs font-semibold border-[1.5px] whitespace-nowrap transition-colors",
                  active
                    ? "bg-white text-[#0A0B0D] border-white"
                    : "bg-transparent border-[#2B2F38] text-[#C9CED6] hover:text-white"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No transactions match your filters' : 'No recent activity'}
          illustrationSrc={hasActiveFilters ? undefined : lynxEmptyActivity}
          description={
            hasActiveFilters
              ? 'Clear the filters to see the full history.'
              : 'Deposits, withdrawals and trades land here as they happen.'
          }
          actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <div className="bg-card border border-border/50 rounded-xl divide-y divide-border/30">
          {paginatedTransactions.map((tx) => {
            const explorerUrl = getExplorerUrl(tx.network, tx.txHash || '');
            const statusConfig = STATUS_CONFIG[tx.status || 'completed'];
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedIds.includes(tx.id);
            const showExpandable = hasDetails(tx);
            
            return (
              <div 
                key={tx.id} 
                className={cn(
                  "p-4 transition-colors",
                  showExpandable && "cursor-pointer hover:bg-muted/30"
                )}
                onClick={() => showExpandable && toggleExpand(tx.id)}
              >
                {isMobile ? (
                  /* ----- Mobile: two-layer row (see DESIGN.md §8 Transaction History Row Spec) ----- */
                  <>
                    {/* Row 1: icon + description + amount */}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        getTransactionBgColor(tx)
                      )}>
                        {getTransactionIcon(tx)}
                      </div>
                      <span className="text-sm font-medium truncate flex-1 min-w-0">
                        {formatDescription(tx)}
                      </span>
                      <span className={cn(
                        "text-sm font-semibold font-mono shrink-0 text-right",
                        tx.amount >= 0 ? "text-trading-green" : "text-trading-red"
                      )}>
                        {tx.amount >= 0 ? "+" : "−"}${formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>
                    {/* Row 2: date + badge + status icon (aligned to description) */}
                    <div className="flex items-start justify-between gap-2 mt-1 pl-[52px]">
                      <div className="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground min-w-0">
                        <span>{tx.date}</span>
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold whitespace-nowrap",
                          ACCOUNT_BADGE_CONFIG[tx.account || 'spot'].className
                        )}>
                          {ACCOUNT_BADGE_CONFIG[tx.account || 'spot'].label}
                        </span>
                        {tx.status && tx.status !== 'completed' && (
                          <StatusIcon className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            statusConfig.color,
                            tx.status === 'processing' && "animate-spin"
                          )} />
                        )}
                      </div>
                      {showExpandable && (
                        <ChevronDown className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform shrink-0 mt-0.5",
                          isExpanded && "rotate-180"
                        )} />
                      )}
                    </div>
                  </>
                ) : (
                  /* ----- Desktop: single-line row ----- */
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        getTransactionBgColor(tx)
                      )}>
                        {getTransactionIcon(tx)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {formatDescription(tx)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{tx.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {tx.status && tx.status !== 'completed' && (
                        <StatusIcon className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          statusConfig.color,
                          tx.status === 'processing' && "animate-spin"
                        )} />
                      )}
                      <div className="w-[78px] flex justify-end">
                        <span className={cn(
                          "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold whitespace-nowrap",
                          ACCOUNT_BADGE_CONFIG[tx.account || 'spot'].className
                        )}>
                          {ACCOUNT_BADGE_CONFIG[tx.account || 'spot'].label}
                        </span>
                      </div>
                      <div className="w-[120px] text-right">
                        <span className={cn(
                          "text-sm font-semibold font-mono",
                          tx.amount >= 0 ? "text-trading-green" : "text-trading-red"
                        )}>
                          {tx.amount >= 0 ? "+" : "−"}${formatCurrency(Math.abs(tx.amount))}
                        </span>
                      </div>
                      <div className="w-4 flex items-center justify-center shrink-0">
                        {showExpandable && (
                          <ChevronDown className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            isExpanded && "rotate-180"
                          )} />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expandable details */}
                {isExpanded && hasDetails(tx) && (
                  <div className={cn(
                    "mt-3 pt-3 border-t border-border/30 space-y-2",
                    isMobile ? "pl-[52px]" : "ml-[52px]"
                  )}>
                    {tx.status && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className={cn("flex items-center gap-1.5", statusConfig.color)}>
                          <StatusIcon className={cn(
                            "w-3.5 h-3.5",
                            tx.status === 'processing' && "animate-spin"
                          )} />
                          {statusConfig.label}
                        </span>
                      </div>
                    )}

                    {tx.sourceChain && tx.destChain && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Route</span>
                        <span className="text-foreground font-mono text-xs">
                          {tx.sourceToken || 'USDC'} ({tx.sourceChain}) → {tx.destToken || 'USDC'} ({tx.destChain})
                        </span>
                      </div>
                    )}

                    {tx.network && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Network</span>
                        <span className="text-foreground">{tx.network}</span>
                      </div>
                    )}

                    {tx.fee != null && tx.fee > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Fee</span>
                        <span className="text-foreground font-mono">${tx.fee.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {tx.txHash && explorerUrl && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Transaction</span>
                        <a 
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline font-mono text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {truncateTxHash(tx.txHash)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        isMobile ? (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Pagination className="pt-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {getPaginationRange().map((item, idx) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={currentPage === item}
                      onClick={() => setCurrentPage(item as number)}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )
      )}
    </div>
  );
};
