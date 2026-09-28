/**
 * Data for the Insights SEO/GEO pages (2026-09-28). Everything here is
 * public + aggregated: events/options (public tables), and four SECURITY
 * DEFINER RPCs that return sums, never private rows (migration
 * 20260928160000_insights_seo_v1.sql).
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EventWithOptions } from "@/hooks/useActiveEvents";
import { buildRows, type Activity, type MarketRow, type Mover, type PlatformStats } from "@/lib/insights";

export interface InsightsWindow { from: Date; to: Date }

interface State {
  stats: PlatformStats | null;
  events: EventWithOptions[];
  resolvedEvents: EventWithOptions[]; // resolved inside the window
  activity: Map<string, Activity>;
  movers: Map<string, Mover>;
  series: Map<string, number[]>;
  isLoading: boolean;
  error: string | null;
}

const HOUR = 36e5;

export const useInsightsSeo = (win: InsightsWindow, opts: { sparklineIds?: (rows: MarketRow[]) => string[]; includeResolved?: boolean } = {}) => {
  const [s, setS] = useState<State>({ stats: null, events: [], resolvedEvents: [], activity: new Map(), movers: new Map(), series: new Map(), isLoading: true, error: null });
  const fromIso = win.from.toISOString();
  const toIso = win.to.toISOString();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [statsRes, eventsRes, actRes, movRes, resolvedRes] = await Promise.all([
          supabase.rpc("insights_platform_stats"),
          supabase.from("events").select("*").eq("is_resolved", false).order("end_date", { ascending: true }),
          supabase.rpc("insights_event_activity", { p_from: fromIso, p_to: toIso }),
          supabase.rpc("insights_movers", { p_from: fromIso, p_to: toIso }),
          opts.includeResolved
            ? supabase.from("events").select("*").eq("is_resolved", true).gte("settled_at", fromIso).lt("settled_at", toIso).order("settled_at", { ascending: false }).limit(50)
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (eventsRes.error) throw eventsRes.error;
        const events = (eventsRes.data ?? []) as unknown as EventWithOptions[];
        const resolved = ((resolvedRes as { data: unknown[] | null }).data ?? []) as unknown as EventWithOptions[];
        const ids = [...events, ...resolved].map((e) => e.id);
        const optRes = ids.length ? await supabase.from("event_options").select("*").in("event_id", ids) : { data: [], error: null };
        if (optRes.error) throw optRes.error;
        const byEvent = new Map<string, EventWithOptions["options"]>();
        for (const o of optRes.data ?? []) {
          const arr = byEvent.get(o.event_id) ?? [];
          arr.push({ ...o, price: Number(o.price), final_price: o.final_price == null ? null : Number(o.final_price) } as EventWithOptions["options"][number]);
          byEvent.set(o.event_id, arr);
        }
        const attach = (e: EventWithOptions) => ({ ...e, options: byEvent.get(e.id) ?? [] });
        const withOpts = events.map(attach);
        const resolvedWithOpts = resolved.map(attach);
        const activity = new Map<string, Activity>();
        for (const a of (actRes.data ?? []) as { event_name: string; trades: number; volume: number }[]) activity.set(a.event_name, { trades: Number(a.trades), volume: Number(a.volume) });
        const movers = new Map<string, Mover>();
        for (const m of (movRes.data ?? []) as Mover[]) movers.set(m.option_id, { ...m, first_price: Number(m.first_price), last_price: Number(m.last_price) });
        // sparklines for the rows the page will actually chart (7d, lead option)
        let series = new Map<string, number[]>();
        if (opts.sparklineIds) {
          const rows = buildRows(withOpts, activity, movers, new Map());
          const wanted = opts.sparklineIds(rows).slice(0, 60);
          if (wanted.length) {
            const ser = await supabase.rpc("insights_series", { p_option_ids: wanted, p_from: new Date(win.to.getTime() - 7 * 24 * HOUR).toISOString(), p_to: toIso });
            for (const p of (ser.data ?? []) as { option_id: string; price: number }[]) {
              const arr = series.get(p.option_id) ?? [];
              arr.push(Number(p.price));
              series.set(p.option_id, arr);
            }
          }
        }
        if (!alive) return;
        setS({ stats: (statsRes.data as unknown as PlatformStats) ?? null, events: withOpts, resolvedEvents: resolvedWithOpts, activity, movers, series, isLoading: false, error: statsRes.error?.message ?? null });
      } catch (e) {
        if (!alive) return;
        setS((p) => ({ ...p, isLoading: false, error: (e as Error).message }));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromIso, toIso, opts.includeResolved]);

  const rows = useMemo(() => buildRows(s.events, s.activity, s.movers, s.series), [s.events, s.activity, s.movers, s.series]);
  return { ...s, rows };
};
