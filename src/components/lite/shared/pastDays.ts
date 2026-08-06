// ============================================================
// Data hooks for the daily up/down stock past-days tape. Rendering lives in
// the ONE shared strip implementation: components/lite/shared/RoundTape.tsx.
// ============================================================
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { seriesPrefixOf } from "@/lib/dailyStockSeries";

export interface PastDay {
  id: string;
  label: string;
  up: boolean;
}

/** Last ~8 settled days of this ticker's daily up/down series, oldest first. */
export const usePastDays = (eventId: string, upLabelAlias?: string | null) => {
  const [days, setDays] = useState<PastDay[]>([]);

  useEffect(() => {
    const prefix = seriesPrefixOf(eventId);
    if (!prefix) {
      setDays([]);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, settled_at, options:event_options(id, label, is_winner)")
        .like("id", `${prefix}-%`)
        .eq("is_resolved", true)
        .order("end_date", { ascending: false })
        .limit(8);
      if (!alive) return;
      const alias = (upLabelAlias || "").trim().toLowerCase();
      const rows: PastDay[] = (data || [])
        .map((e) => {
          const opts = (e.options || []) as {
            id: string;
            label: string;
            is_winner: boolean | null;
          }[];
          const winner = opts.find((o) => o.is_winner);
          if (!winner) return null;
          const lbl = winner.label.trim().toLowerCase();
          const up = alias ? lbl === alias : /(^|[-_ ])(yes|up)$/i.test(winner.label);
          const m = e.id.match(/-(\d{4})(\d{2})(\d{2})$/);
          const d = m ? new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`) : null;
          return {
            id: e.id,
            label: d
              ? d.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })
              : e.name,
            up,
          };
        })
        .filter(Boolean) as PastDay[];
      setDays(rows.reverse());
    })();
    return () => {
      alive = false;
    };
  }, [eventId, upLabelAlias]);

  return days;
};

/** Today's still-trading event in this ticker's daily series, if any. */
export const useTodayEventId = (eventId: string) => {
  const [todayId, setTodayId] = useState<string | null>(null);

  useEffect(() => {
    const prefix = seriesPrefixOf(eventId);
    if (!prefix) {
      setTodayId(null);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id")
        .like("id", `${prefix}-%`)
        .eq("is_resolved", false)
        .order("end_date", { ascending: true })
        .limit(1);
      if (!alive) return;
      setTodayId(data && data[0] ? data[0].id : null);
    })();
    return () => {
      alive = false;
    };
  }, [eventId]);

  return todayId;
};
