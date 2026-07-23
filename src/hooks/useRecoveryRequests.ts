import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type RecoveryStatus = 'submitted' | 'completed' | 'rejected';

export interface RecoveryRequest {
  id: string;
  user_id: string;
  tx_hash: string;
  wrong_network: string;
  wrong_token: string;
  claimed_amount: number;
  sender_address: string;
  user_note: string | null;
  status: RecoveryStatus;
  fee_percent: number;
  estimated_return: number | null;
  admin_note: string | null;
  processed_tx_hash: string | null;
  created_at: string;
  updated_at: string;
  quoted_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
}

export interface CreateRecoveryInput {
  tx_hash: string;
  wrong_network: string;
  wrong_token: string;
  claimed_amount: number;
  sender_address: string;
  user_note?: string;
}

export const useRecoveryRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['recovery-requests', user?.id],
    queryFn: async (): Promise<RecoveryRequest[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('recovery_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RecoveryRequest[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: CreateRecoveryInput) => {
      if (!user) throw new Error('Not signed in');
      const { data, error } = await supabase
        .from('recovery_requests')
        .insert({
          user_id: user.id,
          tx_hash: input.tx_hash,
          wrong_network: input.wrong_network,
          wrong_token: input.wrong_token,
          claimed_amount: input.claimed_amount,
          sender_address: input.sender_address,
          user_note: input.user_note || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as RecoveryRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recovery-requests'] });
    },
  });

  return { list, create };
};

export const useRecoveryRequest = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recovery-request', id],
    queryFn: async (): Promise<RecoveryRequest | null> => {
      if (!id || !user) return null;
      const { data, error } = await supabase
        .from('recovery_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as RecoveryRequest | null;
    },
    enabled: !!id && !!user,
  });
};
