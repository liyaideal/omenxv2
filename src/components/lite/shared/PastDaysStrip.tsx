// ============================================================
// Past-days strip for daily up/down stock events. SAME visual grammar as
// the crypto quick-round Tape (26px ▲/▼ chips in market-axis colours);
// each chip opens that day's event page. Shown in live AND settled states.
// ============================================================
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { seriesPrefixOf } from "@/lib/dailyStockSeries";

const MICRO: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#6B7280",
};

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

interface Props {
  days: PastDay[];
  /** Today's live event — rendered as the trailing highlighted chip. */
  todayId?: string | null;
  currentId: string;
  upLabel: string;
  downLabel: string;
  isMobile?: boolean;
  className?: string;
}

export const PastDaysStrip = ({
  days,
  todayId,
  currentId,
  upLabel,
  downLabel,
  isMobile,
  className,
}: Props) => {
  const navigate = useNavigate();
  if (days.length === 0 && !todayId) return null;

  const size = isMobile ? 44 : 26;
  const showToday = !!todayId && !days.some((d) => d.id === todayId);

  return (
    <TooltipProvider delayDuration={120}>
      <div className={cn("space-y-1.5", className)}>
        <div style={MICRO}>Past days</div>
        <div
          className={cn(
            "flex items-center gap-[6px]",
            isMobile &&
              "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {days.map((d) => {
            const active = d.id === currentId;
            return (
              <Tooltip key={d.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => navigate(`/spot?event=${d.id}`)}
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: size,
                      height: size,
                      borderRadius: isMobile ? 11 : 7,
                      fontSize: 12,
                      background: d.up
                        ? "rgba(51,214,255,.13)"
                        : "rgba(207,255,74,.13)",
                      color: d.up ? "#33D6FF" : "#CFFF4A",
                      outline: active ? "1.5px solid currentColor" : undefined,
                    }}
                  >
                    {d.up ? "▲" : "▼"}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {d.label} · {d.up ? upLabel : downLabel} won
                </TooltipContent>
              </Tooltip>
            );
          })}
          {showToday && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => navigate(`/spot?event=${todayId}`)}
                  className="flex shrink-0 items-center justify-center border border-border text-muted-foreground"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: isMobile ? 11 : 7,
                    fontSize: 10,
                    letterSpacing: ".06em",
                    outline:
                      todayId === currentId ? "1.5px solid currentColor" : undefined,
                  }}
                >
                  NOW
                </button>
              </TooltipTrigger>
              <TooltipContent>Today · still trading</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PastDaysStrip;