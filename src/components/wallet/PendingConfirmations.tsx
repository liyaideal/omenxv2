import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
}

export const PendingConfirmations = ({ className }: PendingConfirmationsProps) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);

  // Fetch pending/processing transactions with real confirmations data
  const { data: pendingTransactions = [], isLoading } = useQuery({
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
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds to get latest confirmations
  });

  const getEstimatedTimeRemaining = (current: number, required: number, network: string | null): string => {
    const remaining = required - current;
    if (remaining <= 0) return 'Almost done...';
    
    // Get block time based on network
    let blockTime = ESTIMATED_BLOCK_TIME_SECONDS;
    if (network?.includes('Bitcoin')) blockTime = 600; // 10 min
    if (network?.includes('Ethereum')) blockTime = 12;
    if (network?.includes('Solana')) blockTime = 0.4;
    
    const seconds = remaining * blockTime;
    if (seconds < 60) return `~${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m`;
    return `~${Math.ceil(seconds / 3600)}h`;
  };

  const truncateTxHash = (hash: string): string => {
    if (hash.length <= 15) return hash;
    return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
  };

  const getExplorerUrl = (network: string | null, txHash: string): string | null => {
    if (!network || !txHash) return null;
    const baseUrl = EXPLORER_URLS[network];
    if (!baseUrl) return null;
    return `${baseUrl}${txHash}`;
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

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Don't render if no pending transactions
  if (!isLoading && pendingTransactions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="w-4 h-4 text-trading-yellow" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-trading-yellow rounded-full animate-pulse" />
          </div>
          <h2 className="text-sm sm:text-lg font-semibold">Pending Confirmations</h2>
          <Badge variant="secondary" className="bg-trading-yellow/10 text-trading-yellow border-trading-yellow/20">
            {pendingTransactions.length}
          </Badge>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Transactions List */}
      {expanded && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : (
            pendingTransactions.map((tx) => {
              const confirmations = tx.confirmations;
              const required = tx.required_confirmations;
              const progress = Math.min((confirmations / required) * 100, 100);
              const isComplete = confirmations >= required;
              const explorerUrl = tx.tx_hash ? getExplorerUrl(tx.network, tx.tx_hash) : null;

              return (
                <div
                  key={tx.id}
                  className={cn(
                    "bg-card border rounded-xl p-4 transition-all",
                    isComplete 
                      ? "border-trading-green/30 bg-trading-green/5" 
                      : "border-trading-yellow/30 bg-trading-yellow/5"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isComplete ? "bg-trading-green/20" : "bg-trading-yellow/20"
                      )}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-trading-green" />
                        ) : (
                          <Loader2 className="w-5 h-5 text-trading-yellow animate-spin" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          +${formatAmount(tx.amount)} Deposit
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.network || 'Unknown Network'} • {formatTimeAgo(tx.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        isComplete 
                          ? "border-trading-green/50 text-trading-green" 
                          : "border-trading-yellow/50 text-trading-yellow"
                      )}
                    >
                      {isComplete ? 'Confirmed' : 'Confirming'}
                    </Badge>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isComplete ? 'Complete' : getEstimatedTimeRemaining(confirmations, required, tx.network)}
                      </span>
                      <span className={cn(
                        "font-mono font-medium",
                        isComplete ? "text-trading-green" : "text-trading-yellow"
                      )}>
                        {confirmations}/{required} blocks
                      </span>
                    </div>

                    <Progress 
                      value={progress} 
                      className={cn(
                        "h-2",
                        isComplete 
                          ? "[&>div]:bg-trading-green" 
                          : "[&>div]:bg-trading-yellow [&>div]:animate-pulse"
                      )}
                    />
                  </div>

                  {/* Transaction Hash Link */}
                  {tx.tx_hash && explorerUrl && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline font-mono"
                      >
                        <span>{truncateTxHash(tx.tx_hash)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Wrong-chain recovery entry */}
          <Link
            to="/wallet/recovery"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              Sent to the wrong network?{' '}
              <span className="text-primary underline-offset-2 hover:underline">Request recovery</span>
            </span>
          </Link>
        </div>
      )}
    </div>
  );
};
