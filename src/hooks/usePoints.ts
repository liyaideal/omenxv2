import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PointsAccount {
  id: string;
  user_id: string;
  balance: number;
  frozen: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

export interface PointsConfig {
  exchange_rate: { points_per_cent: number };
  min_redeem_threshold: { points: number };
  trial_balance_expiry: { type: string; days?: number };
  points_expiry: { type: string; date?: string };
}

export interface PointsLedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: 'earn' | 'spend' | 'freeze' | 'unfreeze' | 'expire' | 'revoke' | 'adjust';
  source: 'task' | 'referral' | 'redeem' | 'admin' | 'system' | 'social';
  source_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const usePoints = () => {
  const queryClient = useQueryClient();

  // Fetch points account
  const { data: pointsAccount, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['points-account'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('points_accounts')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no account exists, create one
      if (!data) {
        const { data: newAccount, error: createError } = await supabase
          .from('points_accounts')
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();
        
        if (createError) throw createError;
        return newAccount as PointsAccount;
      }
      
      return data as PointsAccount;
    },
  });

  // Fetch points config
  const { data: configData } = useQuery({
    queryKey: ['points-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_config')
        .select('key, value');

      if (error) throw error;
      
      const config: Partial<PointsConfig> = {};
      data?.forEach((item: { key: string; value: unknown }) => {
        (config as Record<string, unknown>)[item.key] = item.value;
      });
      
      return config as PointsConfig;
    },
  });

  // Fetch points history
  const { data: pointsHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['points-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PointsLedgerEntry[];
    },
  });

  // Redeem points for trial balance via edge function
  const redeemMutation = useMutation({
    mutationFn: async (pointsToRedeem: number) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-points`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ pointsToRedeem }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to redeem points');
      }

      return result;
    },
    onSuccess: (data) => {
      toast.success(`Redeemed ${data.pointsSpent} points for $${data.trialBalanceReceived.toFixed(2)} trial bonus!`);
      queryClient.invalidateQueries({ queryKey: ['points-account'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    pointsAccount,
    pointsBalance: pointsAccount?.balance || 0,
    frozenPoints: pointsAccount?.frozen || 0,
    lifetimeEarned: pointsAccount?.lifetime_earned || 0,
    lifetimeSpent: pointsAccount?.lifetime_spent || 0,
    config: configData,
    pointsHistory,
    isLoading: isLoadingAccount,
    isLoadingHistory,
    redeemPoints: redeemMutation.mutate,
    isRedeeming: redeemMutation.isPending,
  };
};
