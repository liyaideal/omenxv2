import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VoucherPoolRow {
  faceValue: number;
  totalQuota: number;
  claimedCount: number;
  remaining: number;
  resetsAt: string;
}

const QUERY_KEY = ["voucher-daily-pool"];

export const useVoucherDailyPool = () => {
  const queryClient = useQueryClient();

  const { data: pools = [] } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<VoucherPoolRow[]> => {
      const { data, error } = await supabase.rpc("get_voucher_pool_today" as any);
      if (error) {
        console.error("Failed to fetch voucher pool", error);
        return [];
      }
      return (data as any[]).map((r) => ({
        faceValue: Number(r.face_value),
        totalQuota: Number(r.total_quota),
        claimedCount: Number(r.claimed_count),
        remaining: Number(r.remaining),
        resetsAt: r.resets_at,
      }));
    },
    refetchInterval: 60_000,
  });

  // Realtime: any change to today's pool refreshes the cache.
  useEffect(() => {
    const channel = supabase
      .channel("voucher_daily_pools_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "voucher_daily_pools" },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const byFaceValue = (faceValue: number): VoucherPoolRow | null =>
    pools.find((p) => p.faceValue === faceValue) ?? null;

  return { pools, byFaceValue };
};

/** Tier the scarcity bar based on remaining ratio. */
export type ScarcityTier = "comfortable" | "warning" | "urgent" | "soldOut";

export const getScarcityTier = (remaining: number, total: number): ScarcityTier => {
  if (remaining <= 0) return "soldOut";
  const ratio = remaining / total;
  if (ratio < 0.25) return "urgent";
  if (ratio < 0.5) return "warning";
  return "comfortable";
};

/** Format ms remaining until reset → "Xh Ym" or "Xm". */
export const formatResetCountdown = (resetsAt: string, now: number = Date.now()): string => {
  const ms = new Date(resetsAt).getTime() - now;
  if (ms <= 0) return "soon";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

/** Tick every minute so countdown labels stay fresh. */
export const useMinuteTick = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
};
