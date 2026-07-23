import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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
  newPrice: number;
  oldPrice: number;
  timestamp: Date;
}

// Store for option prices keyed by option ID
type PricesMap = Record<string, number>;
type PreviousPricesMap = Record<string, number>;

interface RealtimePricesContextType {
  prices: PricesMap;
  previousPrices: PreviousPricesMap;
  isLoading: boolean;
  lastUpdate: Date | null;
  recentUpdates: PriceUpdate[];
  getPrice: (optionId: string) => number | undefined;
  getPreviousPrice: (optionId: string) => number | undefined;
  getPriceChange: (optionId: string) => "up" | "down" | "none";
  getPriceChangePercent: (optionId: string) => number;
  refetch: () => Promise<void>;
}

const RealtimePricesContext = createContext<RealtimePricesContextType | null>(null);

export const useRealtimePricesContext = () => {
  const context = useContext(RealtimePricesContext);
  if (!context) {
    throw new Error("useRealtimePricesContext must be used within a RealtimePricesProvider");
  }
  return context;
};

// Optional hook that doesn't throw if context is missing
export const useRealtimePricesOptional = () => {
  return useContext(RealtimePricesContext);
};

interface RealtimePricesProviderProps {
  children: ReactNode;
}

export const RealtimePricesProvider: React.FC<RealtimePricesProviderProps> = ({ children }) => {
  const [prices, setPrices] = useState<PricesMap>({});
  const [previousPrices, setPreviousPrices] = useState<PreviousPricesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<PriceUpdate[]>([]);

  // Fetch all option prices
  const fetchPrices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("event_options")
        .select("id, event_id, label, price");

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
  }, []);

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

  // Get price change percentage
  const getPriceChangePercent = useCallback(
    (optionId: string): number => {
      const current = prices[optionId];
      const previous = previousPrices[optionId];
      if (current === undefined || previous === undefined || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    },
    [prices, previousPrices]
  );

  // Initial fetch
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Set up realtime subscription — mount once, never re-subscribe
  useEffect(() => {
    console.log("Setting up global realtime price subscription...");

    const channel = supabase
      .channel("global-event-options-prices")
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
            const newPrice = Number(newRecord.price);

            // Functional updates so we don't depend on stale closure of `prices`
            setPrices((prev) => {
              const oldPrice = Number(oldRecord?.price ?? prev[newRecord.id] ?? 0);

              // Stash previous price
              setPreviousPrices((prevPrev) => ({
                ...prevPrev,
                [newRecord.id]: oldPrice,
              }));

              // Stash recent update
              setRecentUpdates((prevUpdates) => {
                const update: PriceUpdate = {
                  optionId: newRecord.id,
                  eventId: newRecord.event_id,
                  newPrice,
                  oldPrice,
                  timestamp: new Date(),
                };
                return [update, ...prevUpdates].slice(0, 50);
              });

              return {
                ...prev,
                [newRecord.id]: newPrice,
              };
            });

            setLastUpdate(new Date());
          }
        }
      )
      .subscribe((status) => {
        console.log("Global realtime subscription status:", status);
      });

    return () => {
      console.log("Cleaning up global realtime subscription...");
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: RealtimePricesContextType = {
    prices,
    previousPrices,
    isLoading,
    lastUpdate,
    recentUpdates,
    getPrice,
    getPreviousPrice,
    getPriceChange,
    getPriceChangePercent,
    refetch: fetchPrices,
  };

  return (
    <RealtimePricesContext.Provider value={value}>
      {children}
    </RealtimePricesContext.Provider>
  );
};

export default RealtimePricesProvider;
