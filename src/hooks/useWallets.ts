import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";

export interface Wallet {
  id: string;
  label: string;
  address: string;
  fullAddress: string;
  network: string;
  walletType: string;
  icon: string;
  isPrimary: boolean;
  connectedAt: string;
}

interface DbWallet {
  id: string;
  user_id: string;
  address: string;
  full_address: string;
  network: string;
  wallet_type: string;
  icon: string;
  is_primary: boolean;
  connected_at: string;
  created_at: string;
  updated_at: string;
  label: string | null;
}

const WALLETS_QUERY_KEY = ["user-wallets"];

// Network logo helper - returns path to chain logo
const getNetworkLogo = (network: string): string => {
  const lower = network.toLowerCase();
  if (lower.includes('ethereum') || lower.includes('eth')) return '/chain-logos/ethereum.svg';
  if (lower.includes('tron') || lower.includes('trc')) return '/chain-logos/tron.svg';
  if (lower.includes('bnb') || lower.includes('bsc') || lower.includes('bep')) return '/chain-logos/bnb.svg';
  if (lower.includes('polygon') || lower.includes('matic')) return '/chain-logos/polygon.svg';
  if (lower.includes('solana') || lower.includes('sol')) return '/chain-logos/solana.svg';
  if (lower.includes('bitcoin') || lower.includes('btc')) return '/chain-logos/bitcoin.svg';
  if (lower.includes('arbitrum')) return '/chain-logos/arbitrum.svg';
  if (lower.includes('avalanche') || lower.includes('avax')) return '/chain-logos/avalanche.svg';
  return '/chain-logos/ethereum.svg';
};

// Transform DB wallet to frontend wallet
const transformWallet = (dbWallet: DbWallet): Wallet => ({
  id: dbWallet.id,
  label: dbWallet.label || dbWallet.wallet_type || 'Unnamed Address',
  address: dbWallet.address,
  fullAddress: dbWallet.full_address,
  network: dbWallet.network,
  walletType: dbWallet.wallet_type,
  icon: getNetworkLogo(dbWallet.network),
  isPrimary: dbWallet.is_primary,
  connectedAt: dbWallet.connected_at.split('T')[0],
});

export const useWallets = () => {
  const queryClient = useQueryClient();
  const { user } = useUserProfile();

  // Fetch wallets
  const { data: wallets = [], isLoading, refetch } = useQuery({
    queryKey: WALLETS_QUERY_KEY,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("connected_at", { ascending: false });

      if (error) {
        console.error("Error fetching wallets:", error);
        return [];
      }

      return (data as DbWallet[]).map(transformWallet);
    },
    enabled: !!user,
  });

  // Add wallet mutation
  const addWalletMutation = useMutation({
    mutationFn: async (walletData: {
      label: string;
      fullAddress: string;
      network: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Generate short address
      const addr = walletData.fullAddress;
      const shortAddress = addr.length > 12
        ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
        : addr;

      // If this is the first wallet, make it primary
      const isPrimary = wallets.length === 0;

      if (isPrimary) {
        await supabase
          .from("wallets")
          .update({ is_primary: false })
          .eq("user_id", user.id);
      }

      const { data, error } = await supabase
        .from("wallets")
        .insert({
          user_id: user.id,
          address: shortAddress,
          full_address: walletData.fullAddress,
          network: walletData.network,
          wallet_type: walletData.label, // backwards compat
          icon: getNetworkLogo(walletData.network),
          is_primary: isPrimary,
          label: walletData.label,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
    },
  });

  // Remove wallet mutation
  const removeWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("wallets")
        .delete()
        .eq("id", walletId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
    },
  });

  // Set primary wallet mutation
  const setPrimaryWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      if (!user) throw new Error("User not authenticated");

      await supabase
        .from("wallets")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      const { error } = await supabase
        .from("wallets")
        .update({ is_primary: true })
        .eq("id", walletId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WALLETS_QUERY_KEY });
    },
  });

  // Helper functions
  const addWallet = async (walletData: {
    label: string;
    fullAddress: string;
    network: string;
  }) => {
    try {
      await addWalletMutation.mutateAsync(walletData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const removeWallet = async (walletId: string) => {
    try {
      await removeWalletMutation.mutateAsync(walletId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const setPrimaryWallet = async (walletId: string) => {
    try {
      await setPrimaryWalletMutation.mutateAsync(walletId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    wallets,
    isLoading,
    isUpdating: addWalletMutation.isPending || removeWalletMutation.isPending || setPrimaryWalletMutation.isPending,
    addWallet,
    removeWallet,
    setPrimaryWallet,
    refetch,
  };
};
