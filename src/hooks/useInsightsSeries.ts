/**
 * Insights v2 data hooks — asset series + accuracy (2026-09-28).
 * Three SECURITY DEFINER RPCs returning aggregates only; refetch every 60s so the
 * "next round to settle" row rolls over without a reload.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Accuracy, SeriesAsset, SeriesDetail } from "@/lib/insights/series";

const REFRESH = 60_000;

const useRpc = <T,>(fn: string, args: Record<string, unknown> | undefined, deps: unknown[], refresh = REFRESH) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: d, error: e } = await (supabase.rpc as unknown as (f: string, a?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(fn, args);
      if (!alive) return;
      if (e) setError(e.message); else { setData(d as T); setError(null); }
      setLoading(false);
    };
    void load();
    const id = refresh ? window.setInterval(load, refresh) : 0;
    return () => { alive = false; if (id) window.clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, error, isLoading };
};

export const useSeriesList = () => useRpc<SeriesAsset[]>("insights_series_list", undefined, []);
export const useSeriesDetail = (slug: string) => useRpc<SeriesDetail>("insights_series_detail", { p_slug: slug }, [slug]);
export const useAccuracy = (from: Date, to: Date, live = true) =>
  useRpc<Accuracy>("insights_accuracy", { p_from: from.toISOString(), p_to: to.toISOString() }, [from.getTime(), to.getTime()], live ? REFRESH * 5 : 0);

/** Ticks once a second — for "settles in m:ss". */
export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), ms); return () => window.clearInterval(id); }, [ms]);
  return now;
};
