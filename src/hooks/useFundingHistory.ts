import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FundingLedgerEntry {
  id: string;
  applied_rate: number;
  notional: number;
  amount: number;
  accrual_start: string;
  accrual_end: string;
  created_at: string;
}

/**
 * Fetch the funding ledger entries for a given position.
 * RLS already scopes to the current user; positions are user-owned.
 */
export const useFundingHistory = (positionId: string | null, enabled = true) => {
  return useQuery({
    queryKey: ["funding-history", positionId],
    enabled: enabled && !!positionId,
    staleTime: 30_000,
    queryFn: async (): Promise<FundingLedgerEntry[]> => {
      if (!positionId) return [];
      const { data, error } = await supabase
        .from("position_funding_ledger")
        .select("id, applied_rate, notional, amount, accrual_start, accrual_end, created_at")
        .eq("position_id", positionId)
        .neq("amount", 0)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as FundingLedgerEntry[];
    },
  });
};
