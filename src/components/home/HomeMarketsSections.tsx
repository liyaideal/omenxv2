import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Clock, Sparkles, type LucideIcon } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useMarketListData, EventRow } from "@/hooks/useMarketListData";
import { useWatchlist } from "@/hooks/useWatchlist";
import { MarketCardB } from "@/components/events/MarketCardB";

interface SectionProps {
  title: string;
  icon: LucideIcon;
  rows: EventRow[];
  isWatched: (id: string) => boolean;
  onToggleWatch: (id: string, e?: React.MouseEvent) => void;
  emptyHint?: string;
}

const Section = ({ title, icon: Icon, rows, isWatched, onToggleWatch, emptyHint }: SectionProps) => {
  if (rows.length === 0) {
    return emptyHint ? (
      <div>
        <SectionHeader title={title} icon={Icon} count={0} />
        <p className="mt-2 px-1 text-[12px] text-muted-foreground">{emptyHint}</p>
      </div>
    ) : null;
  }
  return (
    <div>
      <SectionHeader title={title} icon={Icon} count={rows.length} />
      <div className="mt-2 grid gap-2.5">
        {rows.map((m, i) => (
          <div
            key={m.id}
            className="animate-fade-in motion-reduce:animate-none"
            style={{ animationDelay: `${Math.min(i, 6) * 40}ms`, animationFillMode: "both" }}
          >
            <MarketCardB
              market={m}
              isWatched={isWatched(m.eventId)}
              onToggleWatch={(e) => onToggleWatch(m.eventId, e)}
              chgTimeframe="24h"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({
  title,
  icon: Icon,
  count,
}: {
  title: string;
  icon: LucideIcon;
  count: number;
}) => (
  <div className="flex items-end justify-between gap-2 px-1">
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    {count > 0 && (
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {count} {count === 1 ? "market" : "markets"}
      </span>
    )}
  </div>
);

interface HomeMarketsSectionsProps {
  /** Slot inserted between section 1 and section 2 (e.g. <TrialCallout/>). */
  interlude?: React.ReactNode;
  /** Override section labels. Useful for "Pick your first prediction" framing. */
  topTitle?: string;
}

/**
 * The body of the home page — three sportsbook-style sections of markets.
 *
 *  1. Most traded today  (volume24h ranking, 4 cards)
 *  2. Closing soon       (isClosingSoon, time-asc, 3 cards)
 *  3. New this week      (isNew, recency, 3 cards)
 *
 * Cards are deduplicated across sections — first appearance wins.
 *
 * Card rendering uses MarketCardB to stay visually consistent with /events.
 */
export const HomeMarketsSections = ({ interlude, topTitle }: HomeMarketsSectionsProps) => {
  const navigate = useNavigate();
  const { events, isLoading } = useActiveEvents();
  const rows = useMarketListData(events);
  const { isWatched, toggle } = useWatchlist();

  const { mostTraded, closingSoon, newRows } = useMemo(() => {
    const used = new Set<string>();

    const top = [...rows]
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 4);
    top.forEach((r) => used.add(r.id));

    const closing = rows
      .filter((r) => r.isClosingSoon && !used.has(r.id))
      .sort((a, b) => (a.expiry?.getTime() ?? 0) - (b.expiry?.getTime() ?? 0))
      .slice(0, 3);
    closing.forEach((r) => used.add(r.id));

    const fresh = rows
      .filter((r) => r.isNew && !used.has(r.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    return { mostTraded: top, closingSoon: closing, newRows: fresh };
  }, [rows]);

  if (isLoading && rows.length === 0) {
    return (
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[110px] animate-pulse rounded-xl border border-border/40 bg-card/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Section
        title={topTitle ?? "Most traded today"}
        icon={Flame}
        rows={mostTraded}
        isWatched={isWatched}
        onToggleWatch={toggle}
      />

      {interlude && mostTraded.length > 0 && <div>{interlude}</div>}

      <Section
        title="Closing soon"
        icon={Clock}
        rows={closingSoon}
        isWatched={isWatched}
        onToggleWatch={toggle}
      />

      <Section
        title="New this week"
        icon={Sparkles}
        rows={newRows}
        isWatched={isWatched}
        onToggleWatch={toggle}
      />

      <button
        onClick={() => navigate("/events")}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card-hover hover:border-border/70"
      >
        Browse all markets
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
};
