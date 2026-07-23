import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventWithOptions } from "@/hooks/useActiveEvents";

export interface InsightsData {
  events: EventWithOptions[];
  resolvedCount: number;
  isLoading: boolean;
  error: Error | null;
  priceChanges: Map<string, { prev: number; current: number; change: number }>;
}

export const useInsightsData = (): InsightsData => {
  const [events, setEvents] = useState<EventWithOptions[]>([]);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [priceChanges, setPriceChanges] = useState<Map<string, { prev: number; current: number; change: number }>>(new Map());

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch all active events with options
      const [eventsRes, resolvedRes, priceHistoryRes] = await Promise.all([
        supabase
          .from("events")
          .select("*")
          .eq("is_resolved", false)
          .order("end_date", { ascending: true }),
        supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("is_resolved", true),
        supabase
          .from("price_history")
          .select("*")
          .gte("recorded_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("recorded_at", { ascending: true }),
      ]);

      if (eventsRes.error) throw eventsRes.error;

      const eventsData = eventsRes.data || [];
      const eventIds = eventsData.map((e) => e.id);

      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from("event_options")
        .select("*")
        .in("event_id", eventIds)
        .order("id", { ascending: true });

      if (optionsError) throw optionsError;

      const eventsWithOptions: EventWithOptions[] = eventsData.map((event) => ({
        ...event,
        options: (optionsData || [])
          .filter((opt) => opt.event_id === event.id)
          .map((opt) => ({
            ...opt,
            price: Number(opt.price),
            final_price: opt.final_price ? Number(opt.final_price) : null,
          })),
      }));

      setEvents(eventsWithOptions);
      setResolvedCount(resolvedRes.count || 0);

      // Calculate 24h price changes per option
      const changes = new Map<string, { prev: number; current: number; change: number }>();
      const priceHistory = priceHistoryRes.data || [];
      
      // Group by option_id
      const byOption = new Map<string, { price: number; recorded_at: string }[]>();
      priceHistory.forEach((ph) => {
        if (!byOption.has(ph.option_id)) byOption.set(ph.option_id, []);
        byOption.get(ph.option_id)!.push({ price: Number(ph.price), recorded_at: ph.recorded_at });
      });

      byOption.forEach((records, optionId) => {
        if (records.length >= 2) {
          const earliest = records[0].price;
          const latest = records[records.length - 1].price;
          const change = earliest > 0 ? ((latest - earliest) / earliest) * 100 : 0;
          changes.set(optionId, { prev: earliest, current: latest, change });
        }
      });

      setPriceChanges(changes);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch insights"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { events, resolvedCount, isLoading, error, priceChanges };
};
