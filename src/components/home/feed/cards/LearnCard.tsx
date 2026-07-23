import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FeedCard } from "@/components/home/feed/FeedCard";

interface LearnCardProps {
  topicId: string;
  compact?: boolean;
}

const TOPICS: Record<string, { title: string; href: string }> = {
  "what-is-prediction": {
    title: "What's a prediction market?",
    href: "/about",
  },
  "how-leverage-works": {
    title: "How leverage works on OmenX",
    href: "/glossary",
  },
  "read-glossary": {
    title: "Trading terms, explained",
    href: "/glossary",
  },
};

/**
 * Tier 3 padding/education card. Only surfaces when feed would otherwise
 * be too thin — the feed hook strips these out when 8+ real items exist.
 */
export const LearnCard = ({ topicId, compact }: LearnCardProps) => {
  const navigate = useNavigate();
  const topic = TOPICS[topicId];
  if (!topic) return null;

  return (
    <FeedCard tag="Learn" tier={3} compact={compact} onClick={() => navigate(topic.href)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-foreground">{topic.title}</p>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" strokeWidth={2.5} />
      </div>
    </FeedCard>
  );
};
