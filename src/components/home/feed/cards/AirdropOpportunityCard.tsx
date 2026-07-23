import { useNavigate } from "react-router-dom";
import { ArrowRight, Gift } from "lucide-react";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import { FeedCard } from "@/components/home/feed/FeedCard";

interface AirdropOpportunityCardProps {
  compact?: boolean;
}

/**
 * Tier 2 opportunity signal — at least one pending airdrop position exists.
 * Renders nothing if all airdrops have been claimed.
 */
export const AirdropOpportunityCard = ({ compact }: AirdropOpportunityCardProps) => {
  const navigate = useNavigate();
  const { airdrops } = useAirdropPositions();
  const pending = airdrops.filter((a) => a.status === "pending");
  if (pending.length === 0) return null;

  const totalValue = pending.reduce((sum, a) => sum + a.airdropValue, 0);

  return (
    <FeedCard
      tag="Airdrop"
      tier={2}
      meta={<Gift className="h-3 w-3 text-trading-yellow" />}
      compact={compact}
      onClick={() => navigate("/portfolio/airdrops")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            <span className="font-mono font-semibold text-trading-yellow">
              ${totalValue.toFixed(0)}
            </span>{" "}
            in free positions ready
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {pending.length} {pending.length === 1 ? "position" : "positions"} to claim
          </p>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" strokeWidth={2.5} />
      </div>
    </FeedCard>
  );
};
