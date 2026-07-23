import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { FeedCard, FeedTier } from "@/components/home/feed/FeedCard";
import { Sparkline } from "@/components/home/feed/Sparkline";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface TrendingCardProps {
  eventId: string;
  /** When the feed promotes a trending card to first slot, render it as tier 2. */
  tier?: FeedTier;
  compact?: boolean;
}

/**
 * Tier 3 browse signal — one trending market.
 * Pulls the named event from useActiveEvents; renders nothing if not found.
 *
 * When promoted to tier 2 (first-slot fallback), shows a small sparkline of
 * the top option's recent price action.
 */
export const TrendingCard = ({ eventId, tier = 3, compact }: TrendingCardProps) => {
  const navigate = useNavigate();
  const { events } = useActiveEvents();
  const event = events.find((e) => e.id === eventId);

  const top = event?.options[0];
  const optionIds = useMemo(
    () => (tier === 2 && top?.id ? [top.id] : []),
    [tier, top?.id],
  );
  const { priceHistories } = usePriceHistory(optionIds);
  const sparkPrices = top?.id ? priceHistories.get(top.id) : undefined;

  if (!event) return null;
  const second = event.options[1];

  const titleClass =
    tier === 3
      ? "text-[13px] text-foreground line-clamp-2 leading-snug"
      : "text-sm font-medium text-foreground line-clamp-2 leading-snug";
  const priceClass =
    tier === 3 ? "font-mono text-foreground/80" : "font-mono font-semibold text-foreground";

  return (
    <FeedCard
      tag="Trending"
      tier={tier}
      meta={<span className="font-mono">Vol {event.volume || "$0"}</span>}
      compact={compact}
      onClick={() => navigate(`/trade?event=${event.id}`)}
    >
      <p className={titleClass}>{event.name}</p>
      {top && (
        <div className="mt-2 flex items-center justify-between gap-3 text-[12px]">
          <div className="min-w-0 flex items-center gap-3">
            <span className="text-muted-foreground">
              <span className="text-foreground/80">{top.label}</span>{" "}
              <span className={priceClass}>${top.price.toFixed(2)}</span>
            </span>
            {second && (
              <>
                <span className="opacity-30">·</span>
                <span className="text-muted-foreground">
                  <span className="text-foreground/80">{second.label}</span>{" "}
                  <span className={priceClass}>${second.price.toFixed(2)}</span>
                </span>
              </>
            )}
          </div>
          {tier === 2 && sparkPrices && sparkPrices.length >= 2 && (
            <Sparkline prices={sparkPrices.slice(-30)} className="flex-shrink-0" />
          )}
        </div>
      )}
    </FeedCard>
  );
};
