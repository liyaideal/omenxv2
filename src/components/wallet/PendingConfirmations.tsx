import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CONFIRMATION_BLOCKS, ESTIMATED_BLOCK_TIME_SECONDS } from '@/types/deposit';

// Network explorer URLs
const EXPLORER_URLS: Record<string, string> = {
  'Ethereum': 'https://etherscan.io/tx/',
  'BNB Smart Chain (BEP20)': 'https://bscscan.com/tx/',
  'BSC (BNB Smart Chain)': 'https://bscscan.com/tx/',
  'Polygon': 'https://polygonscan.com/tx/',
  'Arbitrum One': 'https://arbiscan.io/tx/',
  'Optimism': 'https://optimistic.etherscan.io/tx/',
  'Avalanche C-Chain': 'https://snowtrace.io/tx/',
  'Bitcoin Network': 'https://blockchair.com/bitcoin/transaction/',
  'Solana': 'https://solscan.io/tx/',
};

interface PendingTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  network: string | null;
  tx_hash: string | null;
  created_at: string;
  confirmations: number;
  required_confirmations: number;
}

interface PendingConfirmationsProps {
  className?: string;
  /**
   * Style-guide only (docs fixture). Replaces the fetched rows so a static
   * state can be photographed. Never set in product code — when omitted the
   * component behaves exactly as before.
   */
  fixture?: { rows: PendingTransaction[] };
}

export const PendingConfirmations = ({ className, fixture }: PendingConfirmationsProps) => {
  const { user } = useAuth();

  // Fetch pending/processing transactions with real confirmations data
  const { data: fetchedTransactions = [], isLoading: isFetching } = useQuery({
    queryKey: ['pending-confirmations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, description, status, network, tx_hash, created_at, confirmations, required_confirmations')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .eq('type', 'deposit')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending transactions:', error);
        return [];
      }

      return (data || []).map(tx => ({
        ...tx,
        confirmations: tx.confirmations ?? 0,
        required_confirmations: tx.required_confirmations ?? CONFIRMATION_BLOCKS,
      })) as PendingTransaction[];
    },
    enabled: !!user && !fixture,
    refetchInterval: 5000, // Refresh every 5 seconds to get latest confirmations
  });

  const pendingTransactions = fixture?.rows ?? fetchedTransactions;
  const isLoading = fixture ? false : isFetching;


  const getEstimatedTimeRemaining = (current: number, required: number, network: string | null): string => {
    const remaining = required - current;
    if (remaining <= 0) return 'almost done';
    // Get block time based on network
    let blockTime = ESTIMATED_BLOCK_TIME_SECONDS;
    if (network?.includes('Bitcoin')) blockTime = 600; // 10 min
    if (network?.includes('Ethereum')) blockTime = 12;
    if (network?.includes('Solana')) blockTime = 0.4;
    const seconds = remaining * blockTime;
    if (seconds < 60) return `~${Math.ceil(seconds)}s left`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)} min left`;
    return `~${Math.ceil(seconds / 3600)}h left`;
  };

  const formatAmount = (amount: number): string => {
    return Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!isLoading && pendingTransactions.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-[18px] border border-border bg-card p-[22px_22px_18px]", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
        Pending confirmations
      </div>
      {isLoading ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-4">
          {pendingTransactions.map((tx) => {
            const confirmations = tx.confirmations;
            const required = tx.required_confirmations;
            const progress = Math.min((confirmations / required) * 100, 100);
            return (
              <div key={tx.id} className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0" style={{ background: 'rgba(51,214,255,0.12)', color: '#7FE4FF' }}>
                  <ArrowDown className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm tabular-nums" style={{ color: '#DCFF6A' }}>
                      +${formatAmount(tx.amount)}
                    </span>
                    <span className="text-sm font-semibold">Deposit</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.08em]" style={{ background: 'rgba(51,214,255,0.14)', color: '#7FE4FF' }}>
                      Confirming
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {tx.network || 'Unknown Network'} · {formatTimeAgo(tx.created_at)} · est. {getEstimatedTimeRemaining(confirmations, required, tx.network)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-xs font-semibold tabular-nums" style={{ color: '#C9CED6' }}>
                    {confirmations}/{required} blocks
                  </div>
                  <div className="w-[110px] h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: '#1D2026' }}>
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#013281,#33D6FF)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-3.5 pt-3 border-t border-border">
        <Link
          to="/wallet/recovery"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-[3px]"
        >
          Sent to the wrong network? Request recovery
        </Link>
      </div>
    </div>
  );
};
