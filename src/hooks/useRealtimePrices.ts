import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface EventOption {
  id: string;
  event_id: string;
  label: string;
  price: number;
  is_winner: boolean | null;
  final_price: number | null;
}

interface PriceUpdate {
  optionId: string;
  eventId: string;
  price: number;
  previousPrice?: number;
}

// Store for option prices keyed by option ID
type PricesMap = Record<string, number>;
// Store for previous prices to show price changes
type PreviousPricesMap = Record<string, number>;

export const useRealtimePrices = (eventIds?: string[]) => {
  const [prices, setPrices] = useState<PricesMap>({});
  const [previousPrices, setPreviousPrices] = useState<PreviousPricesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial prices
  const fetchPrices = useCallback(async () => {
    try {
      let query = supabase
        .from("event_options")
        .select("id, event_id, label, price");

      if (eventIds && eventIds.length > 0) {
        query = query.in("event_id", eventIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching prices:", error);
        return;
      }

      if (data) {
        const pricesMap: PricesMap = {};
        data.forEach((option) => {
          pricesMap[option.id] = Number(option.price);
        });
        setPrices(pricesMap);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Error in fetchPrices:", err);
    } finally {
      setIsLoading(false);
    }
  }, [eventIds]);

  // Get price for a specific option
  const getPrice = useCallback(
    (optionId: string): number | undefined => {
      return prices[optionId];
    },
    [prices]
  );

  // Get previous price for a specific option
  const getPreviousPrice = useCallback(
    (optionId: string): number | undefined => {
      return previousPrices[optionId];
    },
    [previousPrices]
  );

  // Get price change direction
  const getPriceChange = useCallback(
    (optionId: string): "up" | "down" | "none" => {
      const current = prices[optionId];
      const previous = previousPrices[optionId];
      if (current === undefined || previous === undefined) return "none";
      if (current > previous) return "up";
      if (current < previous) return "down";
      return "none";
    },
    [prices, previousPrices]
  );

  // Initial fetch
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Set up realtime subscription
  useEffect(() => {
    console.log("Setting up realtime price subscription...");

    const channel = supabase
      .channel("event-options-prices")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_options",
        },
        (payload: RealtimePostgresChangesPayload<EventOption>) => {
          const newRecord = payload.new as EventOption;
          const oldRecord = payload.old as Partial<EventOption>;

          if (newRecord && newRecord.id) {
            console.log(
              `Price update: ${newRecord.id} -> ${newRecord.price} (was ${oldRecord?.price})`
            );

            // Update previous price before setting new price
            setPreviousPrices((prev) => ({
              ...prev,
              [newRecord.id]: prices[newRecord.id] ?? Number(oldRecord?.price ?? 0),
            }));

            // Update current price
            setPrices((prev) => ({
              ...prev,
              [newRecord.id]: Number(newRecord.price),
            }));

            setLastUpdate(new Date());
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Cleaning up realtime subscription...");
      supabase.removeChannel(channel);
    };
  }, [prices]);

  return {
    prices,
    previousPrices,
    isLoading,
    lastUpdate,
    getPrice,
    getPreviousPrice,
    getPriceChange,
    refetch: fetchPrices,
  };
};

// Hook for a single event's prices
export const useEventPrices = (eventId: string) => {
  const [options, setOptions] = useState<EventOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial options
  const fetchOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("event_options")
        .select("*")
        .eq("event_id", eventId)
        .order("id");

      if (error) {
        console.error("Error fetching event options:", error);
        return;
      }

      if (data) {
        setOptions(data.map(o => ({
          ...o,
          price: Number(o.price),
          final_price: o.final_price ? Number(o.final_price) : null,
        })));
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Error in fetchOptions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Initial fetch
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Set up realtime subscription for this event
  useEffect(() => {
    const channel = supabase
      .channel(`event-options-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "event_options",
          filter: `event_id=eq.${eventId}`,
        },
        (payload: RealtimePostgresChangesPayload<EventOption>) => {
          const newRecord = payload.new as EventOption;

          if (newRecord && newRecord.id) {
            setOptions((prev) =>
              prev.map((opt) =>
                opt.id === newRecord.id
                  ? { 
                      ...opt, 
                      price: Number(newRecord.price),
                      is_winner: newRecord.is_winner,
                      final_price: newRecord.final_price ? Number(newRecord.final_price) : null,
                    }
                  : opt
              )
            );
            setLastUpdate(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return {
    options,
    isLoading,
    lastUpdate,
    refetch: fetchOptions,
  };
};

export default useRealtimePrices;
