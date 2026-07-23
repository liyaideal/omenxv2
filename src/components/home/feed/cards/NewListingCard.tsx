import { useNavigate } from "react-router-dom";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { FeedCard } from "@/components/home/feed/FeedCard";

interface NewListingCardProps {
  eventId: string;
  compact?: boolean;
}

/**
 * Tier 3 browse signal — event listed in last 48h.
 */
export const NewListingCard = ({ eventId, compact }: NewListingCardProps) => {
  const navigate = useNavigate();
  const { events } = useActiveEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) return null;
  const top = event.options[0];

  return (
    <FeedCard
      tag="New listing"
      tier={3}
      compact={compact}
      onClick={() => navigate(`/trade?event=${event.id}`)}
    >
      <p className="text-[13px] text-foreground line-clamp-2 leading-snug">
        {event.name}
      </p>
      {top && (
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          <span>{top.label}</span>{" "}
          <span className="font-mono text-foreground/80">
            ${top.price.toFixed(2)}
          </span>
        </p>
      )}
    </FeedCard>
  );
};
