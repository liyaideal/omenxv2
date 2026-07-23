import { Loader2 } from "lucide-react";
import { useHomeFeed, FeedItem } from "@/hooks/useHomeFeed";
import { OnboardingCard } from "@/components/home/feed/cards/OnboardingCard";
import { WelcomeBackCard } from "@/components/home/feed/cards/WelcomeBackCard";
import { PositionAlertCard } from "@/components/home/feed/cards/PositionAlertCard";
import { SettlingSoonCard } from "@/components/home/feed/cards/SettlingSoonCard";
import { WatchlistMoveCard } from "@/components/home/feed/cards/WatchlistMoveCard";
import { AirdropOpportunityCard } from "@/components/home/feed/cards/AirdropOpportunityCard";
import { TrendingCard } from "@/components/home/feed/cards/TrendingCard";
import { NewListingCard } from "@/components/home/feed/cards/NewListingCard";
import { LearnCard } from "@/components/home/feed/cards/LearnCard";

const renderItem = (item: FeedItem, idx: number) => {
  const key = `${item.kind}:${idx}`;
  switch (item.kind) {
    case "onboarding":
      return <OnboardingCard key={key} compact={item.compact} />;
    case "welcomeBack":
      return <WelcomeBackCard key={key} compact={item.compact} />;
    case "positionAlert":
      return (
        <PositionAlertCard
          key={key}
          positionId={item.positionId}
          compact={item.compact}
        />
      );
    case "settlingSoon":
      return (
        <SettlingSoonCard
          key={key}
          eventId={item.eventId}
          secondsLeft={item.secondsLeft}
          compact={item.compact}
        />
      );
    case "watchlistMove":
      return (
        <WatchlistMoveCard key={key} eventId={item.eventId} compact={item.compact} />
      );
    case "airdropOpportunity":
      return <AirdropOpportunityCard key={key} compact={item.compact} />;
    case "trending":
      return (
        <TrendingCard
          key={key}
          eventId={item.eventId}
          tier={item.tier}
          compact={item.compact}
        />
      );
    case "newListing":
      return (
        <NewListingCard key={key} eventId={item.eventId} compact={item.compact} />
      );
    case "learn":
      return <LearnCard key={key} topicId={item.topicId} compact={item.compact} />;
  }
};

/**
 * Home feed — priority-sorted single-column stream.
 *
 * All ordering and tier logic lives in `useHomeFeed`. This component is a
 * pure renderer: it maps each item kind to its card.
 */
export const HomeFeed = () => {
  const { items, isLoading } = useHomeFeed();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Loading feed…
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <div
          key={`${item.kind}:${idx}`}
          className="animate-fade-in motion-reduce:animate-none"
          style={{ animationDelay: `${Math.min(idx, 8) * 40}ms`, animationFillMode: "both" }}
        >
          {renderItem(item, idx)}
        </div>
      ))}
    </div>
  );
};
