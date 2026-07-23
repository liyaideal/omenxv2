import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  WithdrawStatus, 
  WithdrawRecord, 
  WithdrawLimits,
  WithdrawFormData,
  getWithdrawFee,
  getWithdrawMinimum 
} from '@/types/withdraw';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';

// Mock data for development - will be replaced with actual API calls
const MOCK_WITHDRAW_LIMITS: WithdrawLimits = {
  minAmount: 20,
  maxAmount: 10000,
  dailyLimit: 50000,
  dailyUsed: 0,
  dailyRemaining: 50000,
};

const MOCK_PENDING_WITHDRAWALS: WithdrawRecord[] = [];

export const useWithdraw = (account: 'spot' | 'futures' = 'futures') => {
  const queryClient = useQueryClient();
  const { user, balance, spotBalance, deductAvailableOnly, deductSpotBalance } = useUserProfile();
  const sourceBalance = account === 'spot' ? spotBalance : balance;
  const [currentWithdrawal, setCurrentWithdrawal] = useState<WithdrawRecord | null>(null);

  // Fetch withdrawal limits
  const { data: limits = MOCK_WITHDRAW_LIMITS, isLoading: isLoadingLimits } = useQuery({
    queryKey: ['withdraw-limits', user?.id],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return MOCK_WITHDRAW_LIMITS;
    },
    enabled: !!user,
  });

  // Fetch pending withdrawals
  const { data: pendingWithdrawals = [], isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['pending-withdrawals', user?.id],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return MOCK_PENDING_WITHDRAWALS;
    },
    enabled: !!user,
  });

  // Fetch withdrawal history
  const { data: withdrawHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['withdraw-history', user?.id],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return [] as WithdrawRecord[];
    },
    enabled: !!user,
  });

  // Submit withdrawal request
  const submitWithdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawFormData) => {
      // Validate amount
      const amount = parseFloat(data.amount);
      const fee = getWithdrawFee(data.token);
      const minAmount = getWithdrawMinimum(data.token);
      const debitAccount: 'spot' | 'futures' = data.account ?? account;
      const activeBalance = debitAccount === 'spot' ? spotBalance : balance;

      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      if (amount < minAmount) {
        throw new Error(`Minimum withdrawal is ${minAmount} ${data.token}`);
      }

      if (amount > activeBalance) {
        throw new Error('Insufficient balance');
      }

      if (amount > limits.dailyRemaining) {
        throw new Error('Exceeds daily withdrawal limit');
      }

      // Persist a row in the transactions ledger via privileged edge function.
      const { data: inserted, error: insertError } = await supabase.functions.invoke<{ id: string; error?: string }>(
        'record-transaction',
        {
          body: {
            type: 'withdraw',
            amount: -amount,
            description: `Withdrawal from ${debitAccount === 'spot' ? 'Spot Account' : 'Futures Account'}`,
            status: 'processing',
            network: data.network || null,
            account: debitAccount,
          },
        }
      );

      if (insertError || !inserted?.id) {
        throw new Error(insertError?.message || inserted?.error || 'Failed to submit withdrawal');
      }

      // Debit the correct account (DEMO-STATE: client-side balance write).
      // Post Trial-Bonus sunset (2026-07-21) both deduct helpers are pure
      // single-source writes; deductAvailableOnly kept for call-site clarity.
      if (debitAccount === 'spot') {
        await deductSpotBalance(amount);
      } else {
        await deductAvailableOnly(amount);
      }

      const newWithdrawal: WithdrawRecord = {
        id: inserted!.id,
        amount,
        fee,
        netAmount: amount - fee,
        token: data.token,
        toAddress: data.toAddress,
        status: 'REQUESTED',
        createdAt: new Date().toISOString(),
      };

      return newWithdrawal;
    },
    onSuccess: (withdrawal) => {
      setCurrentWithdrawal(withdrawal);
      queryClient.invalidateQueries({ queryKey: ['pending-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['withdraw-limits'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-fund-transactions'] });
    },
  });

  // Cancel withdrawal request (only when status is REQUESTED)
  const cancelWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalId: string) => {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      setCurrentWithdrawal(null);
      queryClient.invalidateQueries({ queryKey: ['pending-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['withdraw-limits'] });
    },
  });

  // Validate withdrawal form
  const validateWithdrawal = useCallback((data: WithdrawFormData): string | null => {
    const amount = parseFloat(data.amount);
    const fee = getWithdrawFee(data.token);
    const minAmount = getWithdrawMinimum(data.token);

    if (!data.amount || isNaN(amount) || amount <= 0) {
      return 'Please enter a valid amount';
    }

    if (amount < minAmount) {
      return `Minimum withdrawal is ${minAmount} ${data.token}`;
    }

    if (amount + fee > sourceBalance) {
      return 'Insufficient balance (including fee)';
    }

    if (amount > limits.maxAmount) {
      return `Maximum withdrawal is ${limits.maxAmount} ${data.token}`;
    }

    if (amount > limits.dailyRemaining) {
      return `Exceeds daily limit. Remaining: ${limits.dailyRemaining} ${data.token}`;
    }

    if (!data.toAddress) {
      return 'Please select a withdrawal address';
    }

    // Basic per-network address validation. Saved addresses are pre-validated
    // when added in Address Book, so we only run a loose sanity check here.
    const addr = data.toAddress.trim();
    const network = (data.network || '').toLowerCase();
    const isEvm = /^0x[a-fA-F0-9]{40}$/.test(addr);
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
    const isTron = /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
    const isBtc = /^(bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(addr);
    const looksValid =
      network === 'solana' || network === 'sol' ? isSolana :
      network === 'tron' || network === 'trx' ? isTron :
      network === 'bitcoin' || network === 'btc' ? isBtc :
      network ? isEvm :
      // Unknown network — accept any plausible address
      (isEvm || isSolana || isTron || isBtc);

    if (!looksValid) {
      return 'Invalid wallet address';
    }

    return null;
  }, [sourceBalance, limits]);

  // Calculate net amount after fee
  const calculateNetAmount = useCallback((token: string, amount: string): number => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 0;
    const fee = getWithdrawFee(token);
    return Math.max(0, numAmount - fee);
  }, []);

  // Format time ago
  const formatTimeAgo = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  return {
    // Data
    limits,
    pendingWithdrawals,
    withdrawHistory,
    currentWithdrawal,
    availableBalance: sourceBalance,
    
    // Loading states
    isLoadingLimits,
    isLoadingWithdrawals,
    isLoadingHistory,
    isSubmitting: submitWithdrawalMutation.isPending,
    isCancelling: cancelWithdrawalMutation.isPending,
    
    // Actions
    submitWithdrawal: submitWithdrawalMutation.mutateAsync,
    cancelWithdrawal: cancelWithdrawalMutation.mutateAsync,
    setCurrentWithdrawal,
    
    // Helpers
    validateWithdrawal,
    calculateNetAmount,
    formatTimeAgo,
    getWithdrawFee,
    getWithdrawMinimum,
  };
};
