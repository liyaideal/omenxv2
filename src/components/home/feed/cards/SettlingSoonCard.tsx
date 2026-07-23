import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { FeedCard } from "@/components/home/feed/FeedCard";
import { Sparkline } from "@/components/home/feed/Sparkline";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface SettlingSoonCardProps {
  eventId: string;
  secondsLeft: number;
  compact?: boolean;
}

const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return "Settling";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `Ends in ${h}h ${m}m`;
  return `Ends in ${m}m`;
};

/**
 * Tier 2 opportunity signal — event will settle within 24h.
 * Countdown ticks every 30s; sparkline shows top option recent action.
 */
export const SettlingSoonCard = ({ eventId, secondsLeft, compact }: SettlingSoonCardProps) => {
  const navigate = useNavigate();
  const { events } = useActiveEvents();
  const event = events.find((e) => e.id === eventId);
  const [remaining, setRemaining] = useState(secondsLeft);

  useEffect(() => {
    setRemaining(secondsLeft);
    const t = window.setInterval(() => setRemaining((s) => Math.max(0, s - 30)), 30_000);
    return () => window.clearInterval(t);
  }, [secondsLeft]);

  const top = event?.options[0];
  const optionIds = useMemo(() => (top?.id ? [top.id] : []), [top?.id]);
  const { priceHistories } = usePriceHistory(optionIds);
  const sparkPrices = top?.id ? priceHistories.get(top.id) : undefined;

  if (!event) return null;

  return (
    <FeedCard
      tag="Settling soon"
      tier={2}
      meta={<span className="font-mono text-trading-yellow">{formatCountdown(remaining)}</span>}
      compact={compact}
      onClick={() => navigate(`/trade?event=${event.id}`)}
    >
      <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
        {event.name}
      </p>
      {top && (
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">
            <span className="text-foreground/80">{top.label}</span>{" "}
            <span className="font-mono font-semibold text-foreground">
              ${top.price.toFixed(2)}
            </span>
          </p>
          {sparkPrices && sparkPrices.length >= 2 && (
            <Sparkline prices={sparkPrices.slice(-30)} className="flex-shrink-0" />
          )}
        </div>
      )}
    </FeedCard>
  );
};
