import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  FIRST_TRADE_VOLUME,
  getCurrentTier,
  getNextTier,
  getTierProgress,
  MAINNET_LAUNCH_END,
  MAINNET_LAUNCH_START,
} from "@/lib/mainnetLaunch";

export const useMainnetLaunchProgress = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["mainnet-launch-progress", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("amount, created_at, status")
        .eq("user_id", user!.id)
        .eq("status", "Filled")
        .gte("created_at", MAINNET_LAUNCH_START.toISOString())
        .lte("created_at", MAINNET_LAUNCH_END.toISOString());

      if (error) throw error;
      return data ?? [];
    },
  });

  const volume = (query.data ?? []).reduce((sum, trade) => sum + Number(trade.amount ?? 0), 0);
  const event1Qualified = volume >= FIRST_TRADE_VOLUME;
  const currentTier = getCurrentTier(volume);
  const nextTier = getNextTier(volume);
  const progressToNext = getTierProgress(volume);
  const volumeToFirstTrade = Math.max(0, FIRST_TRADE_VOLUME - volume);
  const volumeToNextTier = nextTier ? Math.max(0, nextTier.volume - volume) : 0;

  return {
    user,
    isLoading: query.isLoading,
    volume,
    tradeCount: query.data?.length ?? 0,
    event1Qualified,
    currentTier,
    nextTier,
    progressToNext,
    volumeToFirstTrade,
    volumeToNextTier,
    refetch: query.refetch,
  };
};
