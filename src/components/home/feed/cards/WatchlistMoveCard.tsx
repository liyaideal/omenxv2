import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { FeedCard } from "@/components/home/feed/FeedCard";
import { Sparkline } from "@/components/home/feed/Sparkline";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface WatchlistMoveCardProps {
  eventId: string;
  compact?: boolean;
}

/**
 * Tier 2 opportunity signal — a watchlisted event has moved.
 * Sparkline shows the top option's recent price trajectory.
 */
export const WatchlistMoveCard = ({ eventId, compact }: WatchlistMoveCardProps) => {
  const navigate = useNavigate();
  const { events } = useActiveEvents();
  const event = events.find((e) => e.id === eventId);
  const top = event?.options[0];

  const optionIds = useMemo(() => (top?.id ? [top.id] : []), [top?.id]);
  const { priceHistories } = usePriceHistory(optionIds);
  const sparkPrices = top?.id ? priceHistories.get(top.id) : undefined;

  if (!event) return null;

  return (
    <FeedCard
      tag="Watching"
      tier={2}
      meta={<Star className="h-3 w-3 fill-trading-yellow text-trading-yellow" />}
      compact={compact}
      onClick={() => navigate(`/trade?event=${event.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug min-w-0">
          {event.name}
        </p>
        {sparkPrices && sparkPrices.length >= 2 && (
          <Sparkline prices={sparkPrices.slice(-30)} className="flex-shrink-0 mt-0.5" />
        )}
      </div>
      {top && (
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          <span className="text-foreground/80">{top.label}</span>{" "}
          <span className="font-mono font-semibold text-foreground">
            ${top.price.toFixed(2)}
          </span>
        </p>
      )}
    </FeedCard>
  );
};
