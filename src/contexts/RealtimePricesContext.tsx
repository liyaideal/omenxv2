import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ============================================================
// Display micro-motion layer
// ------------------------------------------------------------
// On top of the DB anchor price we add a small DETERMINISTIC jitter that
// changes every 3s. Same optionId + same 3s bucket ⇒ identical value on every
// client (no Math.random), so all users always see the same number.
// The jitter is DISPLAY ONLY: it never writes into `prices`, `previousPrices`
// or `recentUpdates` — flash/change indicators stay driven by real DB updates.
// ============================================================
const JITTER_MS = 3000;
const JITTER_AMP = 0.006; // ±0.006

/** Simple deterministic string hash → [0, 1). */
const hash01 = (s: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967296;
};

const jitterFor = (seed: string, bucket: number): number =>
  (hash01(`${seed}:${bucket}`) - 0.5) * 2 * JITTER_AMP;

const clampPrice = (n: number) => Math.min(0.99, Math.max(0.01, n));

/** Pair map for 2-option events: mirrored jitter keeps Yes + No === 1. */
type PairInfo = { seedId: string; sign: 1 | -1 };

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
  // Re-render pulse for the display jitter (see comment at top of file).
  const [jitterTick, setJitterTick] = useState(0);
  const pairsRef = useRef<Record<string, PairInfo>>({});

  useEffect(() => {
    const t = setInterval(() => setJitterTick((n) => n + 1), JITTER_MS);
    return () => clearInterval(t);
  }, []);

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

        // Group by event so 2-option events get mirrored jitter.
        const byEvent: Record<string, string[]> = {};
        data.forEach((option) => {
          (byEvent[option.event_id] ||= []).push(option.id);
        });
        const pairs: Record<string, PairInfo> = {};
        Object.values(byEvent).forEach((ids) => {
          if (ids.length !== 2) return;
          const sorted = [...ids].sort();
          pairs[sorted[0]] = { seedId: sorted[0], sign: 1 };
          pairs[sorted[1]] = { seedId: sorted[0], sign: -1 };
        });
        pairsRef.current = pairs;

        setPrices(pricesMap);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Error in fetchPrices:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get DISPLAY price for a specific option (DB anchor + deterministic jitter)
  const getPrice = useCallback(
    (optionId: string): number | undefined => {
      const base = prices[optionId];
      if (base === undefined) return undefined;
      const bucket = Math.floor(Date.now() / JITTER_MS);
      const pair = pairsRef.current[optionId];
      const j = pair
        ? jitterFor(pair.seedId, bucket) * pair.sign
        : jitterFor(optionId, bucket);
      return clampPrice(base + j);
    },
    // jitterTick is intentionally a dependency: it re-creates the callback
    // every 3s so consumers recompute the displayed price.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prices, jitterTick]
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
