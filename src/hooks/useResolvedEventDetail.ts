import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { parseSideLabels, getDisplayOptionLabel } from "@/lib/eventUtils";

export interface PriceHistoryPoint {
  price: number;
  recorded_at: string;
}

export interface EventStatistics {
  participants: number;
  totalTrades: number;
  avgHoldingTime: string;
  peakOpenInterest: string;
}

export interface RelatedEvent {
  id: string;
  name: string;
  // NOTE: icon field deprecated - use category instead
  category: string;
  is_resolved: boolean;
  winning_option_label: string | null;
}
export interface ExternalLinkData {
  platform: string;
  url: string;
  icon: string;
}

export interface ResolvedEventDetail {
  id: string;
  name: string;
  // NOTE: icon field deprecated - use category instead
  category: string;
  description: string | null;
  rules: string | null;
  volume: string | null;
  source_name: string | null;
  source_url: string | null;
  settlement_description: string | null;
  start_date: string | null;
  end_date: string | null;
  settled_at: string | null;
  winning_option_id: string | null;
  external_links: ExternalLinkData[] | null;
  /** Single-market binary 别名（如体育队名）。其它事件为 undefined。 */
  sideLabels?: { yes: string; no: string };
  options: {
    id: string;
    label: string;
    /** sideLabels 解析后的展示文案（队名/Yes/No）。多 outcome 事件等于 label。 */
    displayLabel: string;
    price: number;
    final_price: number | null;
    is_winner: boolean;
  }[];
  priceHistory: Record<string, PriceHistoryPoint[]>; // keyed by option_id
  statistics: EventStatistics;
  relatedEvents: RelatedEvent[];
  userParticipated: boolean;
  userPnl: number | null;
}

interface UseResolvedEventDetailOptions {
  eventId: string;
}

export const useResolvedEventDetail = ({ eventId }: UseResolvedEventDetailOptions) => {
  const { user } = useUserProfile();

  return useQuery({
    queryKey: ["resolved-event-detail", eventId, user?.id],
    queryFn: async (): Promise<ResolvedEventDetail | null> => {
      if (!eventId) return null;

      // Fetch event with options
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select(`
          *,
          event_options (*)
        `)
        .eq("id", eventId)
        .eq("is_resolved", true)
        .single();

      if (eventError || !event) {
        console.error("Error fetching event:", eventError);
        return null;
      }

      // Fetch price history for all options
      const optionIds = (event.event_options || []).map((o: any) => o.id);
      const { data: priceHistoryData } = await supabase
        .from("price_history")
        .select("*")
        .eq("event_id", eventId)
        .in("option_id", optionIds)
        .order("recorded_at", { ascending: true });

      // Group price history by option_id
      const priceHistory: Record<string, PriceHistoryPoint[]> = {};
      (priceHistoryData || []).forEach((ph: any) => {
        if (!priceHistory[ph.option_id]) {
          priceHistory[ph.option_id] = [];
        }
        priceHistory[ph.option_id].push({
          price: ph.price,
          recorded_at: ph.recorded_at,
        });
      });

      // Fetch related events (admin-configured)
      const { data: relatedEventIds } = await supabase
        .from("event_relations")
        .select("related_event_id")
        .eq("source_event_id", eventId)
        .order("display_order", { ascending: true });

      let relatedEvents: RelatedEvent[] = [];
      if (relatedEventIds && relatedEventIds.length > 0) {
        const ids = relatedEventIds.map((r: any) => r.related_event_id);
        const { data: relatedEventsData } = await supabase
          .from("events")
          .select(`
            id, name, category, is_resolved, winning_option_id, side_labels,
            event_options (id, label, is_winner)
          `)
          .in("id", ids);

        relatedEvents = (relatedEventsData || []).map((e: any) => {
          const winningOption = (e.event_options || []).find((o: any) => o.is_winner);
          const relSideLabels = parseSideLabels(e.side_labels);
          const relOptions = (e.event_options || []).map((o: any) => ({ label: o.label }));
          return {
            id: e.id,
            name: e.name,
            category: e.category,
            is_resolved: e.is_resolved,
            winning_option_label: winningOption
              ? getDisplayOptionLabel(winningOption.label, relOptions, relSideLabels)
              : null,
          };
        });
      }

      // Calculate statistics from trades
      const { data: tradesData } = await supabase
        .from("trades")
        .select("user_id, created_at, closed_at")
        .eq("event_name", event.name);

      const trades = tradesData || [];
      const uniqueUsers = new Set(trades.map((t: any) => t.user_id));
      const participants = uniqueUsers.size;
      const totalTrades = trades.length;

      // Calculate average holding time
      let totalHoldingMs = 0;
      let tradesWithHolding = 0;
      trades.forEach((t: any) => {
        if (t.closed_at && t.created_at) {
          const holdingTime = new Date(t.closed_at).getTime() - new Date(t.created_at).getTime();
          totalHoldingMs += holdingTime;
          tradesWithHolding++;
        }
      });
      const avgHoldingMs = tradesWithHolding > 0 ? totalHoldingMs / tradesWithHolding : 0;
      const avgHoldingDays = Math.floor(avgHoldingMs / (1000 * 60 * 60 * 24));
      const avgHoldingHours = Math.floor((avgHoldingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const avgHoldingTime = avgHoldingDays > 0 ? `${avgHoldingDays}d ${avgHoldingHours}h` : `${avgHoldingHours}h`;

      // Fetch user's participation data if logged in
      let userParticipated = false;
      let userPnl: number | null = null;
      if (user) {
        const { data: userTrades } = await supabase
          .from("trades")
          .select("pnl")
          .eq("user_id", user.id)
          .eq("event_name", event.name);

        if (userTrades && userTrades.length > 0) {
          userParticipated = true;
          userPnl = userTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        }
      }

      const sideLabels = parseSideLabels((event as any).side_labels);
      const optionLabelsForBinary = (event.event_options || []).map((o: any) => ({ label: o.label }));

      return {
        id: event.id,
        name: event.name,
        category: event.category,
        description: event.description,
        rules: event.rules,
        volume: event.volume,
        source_name: event.source_name,
        source_url: event.source_url,
        settlement_description: (event as any).settlement_description || null,
        start_date: event.start_date,
        end_date: event.end_date,
        settled_at: event.settled_at,
        winning_option_id: event.winning_option_id,
        external_links: Array.isArray((event as any).external_links)
          ? (event as any).external_links as ExternalLinkData[]
          : null,
        sideLabels,
        options: (event.event_options || []).map((opt: any) => ({
          id: opt.id,
          label: opt.label,
          displayLabel: getDisplayOptionLabel(opt.label, optionLabelsForBinary, sideLabels),
          price: opt.price,
          final_price: opt.final_price,
          is_winner: opt.is_winner,
        })),
        priceHistory,
        statistics: {
          participants,
          totalTrades,
          avgHoldingTime: avgHoldingTime || "N/A",
          peakOpenInterest: event.volume || "$0", // Using volume as proxy
        },
        relatedEvents,
        userParticipated,
        userPnl,
      };
    },
    enabled: !!eventId,
  });
};
