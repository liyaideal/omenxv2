import { ResolvedEvent } from "@/hooks/useResolvedEvents";
import { groupBySettledAt } from "@/lib/resolvedGrouping";
import { ResolvedMarketCard } from "./ResolvedMarketCard";

interface ResolvedGroupedGridProps {
  events: ResolvedEvent[];
  isMobile: boolean;
  onEventClick: (eventId: string) => void;
}

export const ResolvedGroupedGrid = ({
  events,
  isMobile,
  onEventClick,
}: ResolvedGroupedGridProps) => {
  const groups = groupBySettledAt(events);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              {group.label}
            </h2>
            <span className="text-xs font-mono text-muted-foreground/60">
              ({group.events.length})
            </span>
          </div>
          <div
            className={`grid gap-3 ${
              isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {group.events.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <ResolvedMarketCard
                  event={event}
                  onClick={() => onEventClick(event.id)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
