import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";
import { useAirdropPositions } from "./useAirdropPositions";

const H2E_EARNINGS_CAP = 100;
const H2E_STARTER_UNLOCK = 5;
const H2E_UNLOCK_TIERS = [
  { volume: 0, percent: 0 },
  { volume: 10000, percent: 10 },
  { volume: 50000, percent: 25 },
  { volume: 100000, percent: 50 },
  { volume: 200000, percent: 75 },
  { volume: 400000, percent: 100 },
];
const H2E_FULL_VOLUME_UNLOCK = H2E_UNLOCK_TIERS[H2E_UNLOCK_TIERS.length - 1].volume;

export interface H2eRewardsSummary {
  /** Frozen balance from H2E settlements (available for trading, locked for withdrawal) */
  frozenBalance: number;
  /** Total volume completed toward unlock */
  volumeCompleted: number;
  /** Whether the frozen balance has been unlocked for withdrawal */
  isUnlocked: boolean;
  /** Whether the frozen balance is fully unlocked for withdrawal */
  isFullyUnlocked: boolean;
  /** Current unlocked reward percentage */
  unlockedPercent: number;
  /** Amount of H2E rewards currently withdrawable */
  unlockedAmount: number;
  /** Amount of H2E rewards still locked for withdrawal */
  lockedAmount: number;
  /** Next tier volume target */
  nextTierVolume: number | null;
  /** Next tier unlock percentage */
  nextTierPercent: number | null;
  /** Volume needed to reach the next tier */
  volumeToNextTier: number;
  /** All configured withdrawal unlock tiers */
  unlockTiers: Array<{ volume: number; percent: number }>;
  /** Free starter unlock amount (independent of H2E frozenBalance, granted on signup) */
  starterUnlock: number;
  /** Lifetime H2E earnings */
  totalEarned: number;
  /** Max earnings cap */
  earningsCap: number;
  /** Volume required to unlock */
  volumeRequired: number;
  /** Percentage of volume completed */
  volumePercent: number;
  /** Percentage of earnings cap used */
  earningsPercent: number;
  /** Settlement history from settled airdrops */
  settlements: Array<{
    id: string;
    eventName: string;
    pnl: number;
    trigger: string;
    settledAt: string;
  }>;
}

export const useH2eRewardsSummary = (): H2eRewardsSummary => {
  const { user } = useUserProfile();
  const { settledAirdrops } = useAirdropPositions();

  // In demo mode, compute from settled airdrops
  const totalEarned = settledAirdrops.reduce((sum, a) => {
    const pnl = a.settledPnl ?? 0;
    return sum + (pnl > 0 ? pnl : 0);
  }, 0);

  // Demo: frozen = total earned (not yet unlocked)
  const frozenBalance = Math.min(totalEarned, H2E_EARNINGS_CAP);

  // Real volume from filled trades (sums notional `amount`).
  // In demo mode we still use the same source — handle_new_user seeds a few
  // demo trades, so new users start near 0 and the bar fills as they trade.
  const { data: volumeCompleted = 0 } = useQuery({
    queryKey: ["h2e-volume", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("trades")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "Filled");
      if (error || !data) return 0;
      return data.reduce((sum, t: any) => sum + Number(t.amount ?? 0), 0);
    },
    enabled: !!user,
    staleTime: 30_000,
  });
  const currentTier = [...H2E_UNLOCK_TIERS].reverse().find((tier) => volumeCompleted >= tier.volume);
  const nextTier = H2E_UNLOCK_TIERS.find((tier) => volumeCompleted < tier.volume) ?? null;
  const unlockedPercent = currentTier?.percent ?? 0;
  const unlockedAmount = frozenBalance * (unlockedPercent / 100);
  const lockedAmount = Math.max(0, frozenBalance - unlockedAmount);
  const isFullyUnlocked = unlockedPercent >= 100;
  const isUnlocked = unlockedPercent > 0;

  const settlements = settledAirdrops
    .filter((a) => a.settledAt)
    .map((a) => ({
      id: a.id,
      eventName: a.counterEventName,
      pnl: a.settledPnl ?? 0,
      trigger: a.settlementTrigger === "event_resolved" ? "Event Resolved" : "Source Closed",
      settledAt: a.settledAt!,
    }));

  return {
    frozenBalance,
    volumeCompleted,
    isUnlocked,
    isFullyUnlocked,
    unlockedPercent,
    unlockedAmount,
    lockedAmount,
    totalEarned,
    earningsCap: H2E_EARNINGS_CAP,
    volumeRequired: H2E_FULL_VOLUME_UNLOCK,
    nextTierVolume: nextTier?.volume ?? null,
    nextTierPercent: nextTier?.percent ?? null,
    volumeToNextTier: nextTier ? Math.max(0, nextTier.volume - volumeCompleted) : 0,
    unlockTiers: H2E_UNLOCK_TIERS,
    starterUnlock: H2E_STARTER_UNLOCK,
    volumePercent: nextTier ? Math.min((volumeCompleted / nextTier.volume) * 100, 100) : 100,
    earningsPercent: Math.min((totalEarned / H2E_EARNINGS_CAP) * 100, 100),
    settlements,
  };
};
