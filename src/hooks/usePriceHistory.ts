import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PriceHistoryPoint {
  price: number;
  recorded_at: string;
}

export interface OptionPriceHistory {
  optionId: string;
  history: PriceHistoryPoint[];
}

interface UsePriceHistoryReturn {
  priceHistories: Map<string, number[]>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches price history for given option IDs
 * Returns a Map of optionId -> array of prices (oldest to newest)
 */
export const usePriceHistory = (optionIds: string[]): UsePriceHistoryReturn => {
  const [priceHistories, setPriceHistories] = useState<Map<string, number[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPriceHistory = useCallback(async () => {
    if (!optionIds || optionIds.length === 0) {
      setPriceHistories(new Map());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch price history for all options
      // Get last 150 records per option for chart display
      const { data, error: fetchError } = await supabase
        .from("price_history")
        .select("option_id, price, recorded_at")
        .in("option_id", optionIds)
        .order("recorded_at", { ascending: true })
        .limit(1500); // Limit total to prevent too much data

      if (fetchError) {
        throw fetchError;
      }

      // Group by option_id and convert to price arrays (0-100 scale for chart)
      const historyMap = new Map<string, number[]>();
      
      if (data) {
        // Group data by option_id
        const grouped = new Map<string, PriceHistoryPoint[]>();
        data.forEach((point) => {
          const existing = grouped.get(point.option_id) || [];
          existing.push({ price: Number(point.price), recorded_at: point.recorded_at });
          grouped.set(point.option_id, existing);
        });

        // Convert to price arrays (price * 100 for 0-100 chart scale)
        grouped.forEach((points, optionId) => {
          // Take last 150 points
          const recentPoints = points.slice(-150);
          const prices = recentPoints.map((p) => p.price * 100);
          historyMap.set(optionId, prices);
        });
      }

      setPriceHistories(historyMap);
    } catch (err) {
      console.error("Error fetching price history:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch price history"));
    } finally {
      setIsLoading(false);
    }
  }, [optionIds.join(",")]); // Use joined string as dependency

  useEffect(() => {
    fetchPriceHistory();
  }, [fetchPriceHistory]);

  return {
    priceHistories,
    isLoading,
    error,
  };
};

export default usePriceHistory;
