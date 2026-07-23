import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { 
  DepositRecord, 
  SupportedToken, 
  SUPPORTED_TOKENS,
  CONFIRMATION_BLOCKS,
  getCustodyAddress,
  getTokenConfig,
} from '@/types/deposit';

// Mock data for development - will be replaced with chain-service API calls
const MOCK_PENDING_CLAIMS: DepositRecord[] = [
  {
    id: 'dep-1',
    txHash: '0xabc123def456789...abc123',
    amount: 5.5,
    token: 'USDT',
    status: 'PENDING_CLAIM',
    confirmations: 15,
    requiredConfirmations: 15,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  },
  {
    id: 'dep-2',
    txHash: '0xdef789abc123456...def789',
    amount: 8.25,
    token: 'USDC',
    status: 'PENDING_CLAIM',
    confirmations: 15,
    requiredConfirmations: 15,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
  },
];

export const useDeposit = (token?: SupportedToken) => {
  const queryClient = useQueryClient();
  const { user } = useUserProfile();
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(token || 'USDT');

  // Fetch user's deposit address for the selected token
  const {
    data: depositAddress,
    isLoading: isLoadingAddress,
    refetch: refetchAddress,
  } = useQuery({
    queryKey: ['deposit-address', user?.id, selectedToken],
    queryFn: async () => {
      // Use POST with body since functions.invoke doesn't support query params directly
      const response = await supabase.functions.invoke('get-deposit-address', {
        body: { token: selectedToken },
      });
      
      if (response.error) {
        console.error('Error fetching deposit address:', response.error);
        // Fallback to default address
        return {
          address: getCustodyAddress(selectedToken),
          isDefault: true,
        };
      }
      
      return response.data;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Generate new address mutation
  const generateAddressMutation = useMutation({
    mutationFn: async (tokenToGenerate: SupportedToken) => {
      const { data, error } = await supabase.functions.invoke('generate-deposit-address', {
        body: { token: tokenToGenerate },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to generate address');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-address'] });
    },
  });

  // Fetch pending claims (deposits < min amount that need signature)
  const { 
    data: pendingClaims = [], 
    isLoading: isLoadingClaims,
    refetch: refetchClaims,
  } = useQuery({
    queryKey: ['pending-claims', user?.id],
    queryFn: async () => {
      // TODO: Replace with actual chain-service API call
      return MOCK_PENDING_CLAIMS;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch recent deposits (for status tracking)
  const {
    data: recentDeposits = [],
    isLoading: isLoadingDeposits,
  } = useQuery({
    queryKey: ['recent-deposits', user?.id],
    queryFn: async () => {
      // TODO: Replace with actual chain-service API call
      // Mock: Return empty for now
      return [] as DepositRecord[];
    },
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds for status updates
  });

  // Claim a pending deposit (for amounts < min threshold)
  const claimMutation = useMutation({
    mutationFn: async ({ depositId, signature }: { depositId: string; signature: string }) => {
      // TODO: Replace with actual chain-service API call
      // const response = await fetch('/api/deposits/claim', {
      //   method: 'POST',
      //   body: JSON.stringify({ depositId, signature }),
      // });
      // return response.json();
      
      // Mock: Simulate claim process
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, depositId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-claims'] });
      queryClient.invalidateQueries({ queryKey: ['recent-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  // Get custody address for selected token
  const getCustodyAddressForToken = useCallback((token: SupportedToken) => {
    return getCustodyAddress(token);
  }, []);

  // Get token config helper
  const getTokenConfigForToken = useCallback((token: SupportedToken) => {
    return getTokenConfig(token);
  }, []);

  // Format time ago
  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }, []);

  // Get the current deposit address (from API or fallback)
  const getCurrentAddress = useCallback(() => {
    if (depositAddress?.address) {
      return depositAddress.address;
    }
    return getCustodyAddress(selectedToken);
  }, [depositAddress, selectedToken]);

  return {
    // Config
    supportedTokens: SUPPORTED_TOKENS,
    getCustodyAddress: getCustodyAddressForToken,
    selectedToken,
    setSelectedToken,
    getTokenConfig: getTokenConfigForToken,
    
    // Data
    pendingClaims,
    recentDeposits,
    depositAddress,
    getCurrentAddress,
    
    // Loading states
    isLoadingClaims,
    isLoadingDeposits,
    isLoadingAddress,
    isClaiming: claimMutation.isPending,
    isGeneratingAddress: generateAddressMutation.isPending,
    
    // Actions
    claimDeposit: claimMutation.mutateAsync,
    generateNewAddress: generateAddressMutation.mutateAsync,
    refetchClaims,
    refetchAddress,
    
    // Helpers
    formatTimeAgo,
    confirmationBlocks: CONFIRMATION_BLOCKS,
  };
};
