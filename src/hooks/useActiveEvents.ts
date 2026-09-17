import { isFixtureSibling } from "@/components/lite/sports/sportsData";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface ExternalLink {
  platform: string;
  url: string;
  icon: string;
}

export interface DatabaseEvent {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  volume: string | null;
  rules: string | null;
  source_name: string | null;
  source_url: string | null;
  settlement_description: string | null;
  price_label: string | null;
  external_links: Json | null; // Raw JSON from DB, parsed to ExternalLink[] in useEvents
  side_labels: Json | null; // { yes: string; no: string } for single-market binary events (e.g. sports team names)
  is_resolved: boolean;
  winning_option_id: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
  // Pro / Spot product line extensions (2026-07-15)
  product_lines: string[] | null;
  event_subtype: string | null;
  lifecycle_status: string | null;
  base_price: number | null;
  image_url: string | null;
  /** ES-1: freeze window start (ISO) — orders blocked from here until end_date. */
  freeze_time?: string | null;
  /** Sports fixture blob (`fixture_id`, `market_type`, `line`, …) — see sportsData.fixtureMeta. */
  metadata?: Json | null;
}

export interface DatabaseEventOption {
  id: string;
  event_id: string;
  label: string;
  price: number;
  is_winner: boolean | null;
  final_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithOptions extends DatabaseEvent {
  options: DatabaseEventOption[];
}

interface UseActiveEventsReturn {
  /** Active events minus fixture siblings — what every list / picker shows. */
  events: EventWithOptions[];
  /** SL-P: the fixture siblings (handicap / total / mapwin / method / distance),
   *  only reachable through their fixture's market row. */
  siblingEvents: EventWithOptions[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useActiveEvents = (): UseActiveEventsReturn => {
  const [events, setEvents] = useState<EventWithOptions[]>([]);
  const [siblingEvents, setSiblingEvents] = useState<EventWithOptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch active events (not resolved). SL-P: siblings come along in the
      // same query and are split off below — the Pro terminal needs them for
      // its market row, while lists keep showing `events` only.
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("is_resolved", false)
        .order("end_date", { ascending: true });

      if (eventsError) {
        throw eventsError;
      }

      const allRows = eventsData || [];
      const visibleEvents = allRows.filter((e) => !isFixtureSibling(e));
      const siblingRows = allRows.filter((e) => isFixtureSibling(e));

      if (allRows.length === 0) {
        setEvents([]);
        setSiblingEvents([]);
        return;
      }

      // Get event IDs
      const eventIds = allRows.map((e) => e.id);

      // Fetch options for all events
      const { data: optionsData, error: optionsError } = await supabase
        .from("event_options")
        .select("*")
        .in("event_id", eventIds)
        .order("id", { ascending: true });

      if (optionsError) {
        throw optionsError;
      }

      // Combine events with their options
      const withOptions = (event: (typeof allRows)[number]): EventWithOptions => ({
        ...event,
        options: (optionsData || [])
          .filter((opt) => opt.event_id === event.id)
          .map((opt) => ({
            ...opt,
            price: Number(opt.price),
            final_price: opt.final_price ? Number(opt.final_price) : null,
          })),
      });

      setEvents(visibleEvents.map(withOptions));
      setSiblingEvents(siblingRows.map(withOptions));
    } catch (err) {
      console.error("Error fetching active events:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch events"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    siblingEvents,
    isLoading,
    error,
    refetch: fetchEvents,
  };
};

export default useActiveEvents;
