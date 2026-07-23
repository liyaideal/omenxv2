import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useMainnetLaunchProgress } from "./useMainnetLaunchProgress";
import { FIRST_TRADE_VOLUME, MAINNET_LAUNCH_START } from "@/lib/mainnetLaunch";

export type ActivationState = "S0_NEW" | "S1_DEPOSITED" | "S2_TRADED" | "S3_ACTIVE" | "GUEST";

export interface ActivationStateResult {
  state: ActivationState;
  hasDeposited: boolean;
  hasTraded: boolean;
  volume: number;
  volumeToFirstTier: number;
  isLoading: boolean;
  nextStepHref: string;
  nextStepLabel: string;
}

/**
 * User activation state machine for the mainnet launch period.
 * Drives the activation checklist + Wallet activation hub UI.
 *
 * S0_NEW: Logged in but no completed deposit yet → drive to /deposit.
 * S1_DEPOSITED: Has deposit, no mainnet trade yet → drive to /events.
 * S2_TRADED: Trading but volume < first tier → push toward /mainnet-launch.
 * S3_ACTIVE: Already in the campaign — hide all activation UI.
 */
export const useActivationState = (): ActivationStateResult => {
  const { user } = useAuth();
  const { volume, isLoading: isProgressLoading } = useMainnetLaunchProgress();

  const { data: depositCount, isLoading: isDepositLoading } = useQuery({
    queryKey: ["activation-deposit-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("type", "deposit")
        .eq("status", "completed");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: mainnetTradeCount, isLoading: isTradeLoading } = useQuery({
    queryKey: ["activation-trade-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "Filled")
        .gte("created_at", MAINNET_LAUNCH_START.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const hasDeposited = (depositCount ?? 0) > 0;
  const hasTraded = (mainnetTradeCount ?? 0) > 0;

  let state: ActivationState = "GUEST";
  let nextStepHref = "/deposit";
  let nextStepLabel = "Deposit USDC on Base";

  if (user) {
    if (!hasDeposited) {
      state = "S0_NEW";
      nextStepHref = "/deposit";
      nextStepLabel = "Deposit USDC on Base";
    } else if (!hasTraded) {
      state = "S1_DEPOSITED";
      nextStepHref = "/events";
      nextStepLabel = "Place your first trade";
    } else if (volume < FIRST_TRADE_VOLUME) {
      state = "S2_TRADED";
      nextStepHref = "/mainnet-launch";
      nextStepLabel = "Track launch campaign progress";
    } else {
      state = "S3_ACTIVE";
      nextStepHref = "/mainnet-launch";
      nextStepLabel = "View campaign tiers";
    }
  }

  return {
    state,
    hasDeposited,
    hasTraded,
    volume,
    volumeToFirstTier: Math.max(0, FIRST_TRADE_VOLUME - volume),
    isLoading: !!user && (isDepositLoading || isTradeLoading || isProgressLoading),
    nextStepHref,
    nextStepLabel,
  };
};
