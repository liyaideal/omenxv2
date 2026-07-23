import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OptionFundingRate {
  fundingRatePerHour: number;
  nextFundingAt: string | null;
}

/**
 * Fetch the current funding rate (per hour) for a single option from event_options.
 * Returns 0 when optionId is null or row missing. Cached briefly so the detail
 * drawer always reflects the current rate without thrashing the DB.
 */
export const useOptionFundingRate = (optionId: string | null | undefined) => {
  return useQuery({
    queryKey: ["option-funding-rate", optionId],
    enabled: !!optionId,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<OptionFundingRate> => {
      if (!optionId) return { fundingRatePerHour: 0, nextFundingAt: null };
      const { data, error } = await supabase
        .from("event_options")
        .select("funding_rate, next_funding_at")
        .eq("id", optionId)
        .maybeSingle();
      if (error) throw error;
      return {
        fundingRatePerHour: Number(data?.funding_rate ?? 0),
        nextFundingAt: (data?.next_funding_at as string | null) ?? null,
      };
    },
  });
};
