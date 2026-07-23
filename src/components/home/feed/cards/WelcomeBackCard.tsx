import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FeedCard } from "@/components/home/feed/FeedCard";
import { useUnreadFlag } from "@/lib/feedUnread";

interface WelcomeBackCardProps {
  /** Days since last visit, for the sub line. */
  daysAway?: number;
  compact?: boolean;
}

/**
 * Tier 1 personal signal — re-engagement card for sleeping users.
 * Mock copy for now; real "top mover while you were away" wiring comes later.
 */
export const WelcomeBackCard = ({ daysAway = 9, compact }: WelcomeBackCardProps) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const { unread, markRead } = useUnreadFlag(`welcomeBack:${today}`);

  return (
    <FeedCard
      tag="Welcome back"
      tier={1}
      accent="primary"
      compact={compact}
      unread={unread}
      onClick={() => {
        markRead();
        navigate("/events");
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {daysAway} days of new markets to catch up on
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            See what moved while you were away
          </p>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" strokeWidth={2.5} />
      </div>
    </FeedCard>
  );
};
