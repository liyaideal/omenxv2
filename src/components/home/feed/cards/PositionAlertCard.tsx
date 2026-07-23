import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { usePositions } from "@/hooks/usePositions";
import { FeedCard } from "@/components/home/feed/FeedCard";
import { useUnreadFlag } from "@/lib/feedUnread";
import { cn } from "@/lib/utils";

interface PositionAlertCardProps {
  positionId: string;
  compact?: boolean;
}

/**
 * Tier 1 personal signal — surfaces a position with significant unrealized
 * PnL. Renders nothing if the position is no longer in the user's portfolio.
 */
export const PositionAlertCard = ({ positionId, compact }: PositionAlertCardProps) => {
  const navigate = useNavigate();
  const { positions } = usePositions();
  const pos = positions.find((p) => p.id === positionId);

  // Bucket PnL% by 5% steps so material moves re-arm the unread state.
  const pnlNum = pos ? parseFloat(pos.pnlPercent.replace(/[^\d.\-]/g, "")) : 0;
  const bucket = Math.round((isFinite(pnlNum) ? pnlNum : 0) / 5);
  const { unread, markRead } = useUnreadFlag(
    pos ? `positionAlert:${pos.id}:${bucket}` : null,
  );

  if (!pos) return null;

  const isPositive = pos.pnl.startsWith("+");
  const accent = isPositive ? "green" : "red";
  const pnlClass = isPositive ? "text-trading-green" : "text-trading-red";

  return (
    <FeedCard
      tag="Your position"
      tier={1}
      accent={accent}
      compact={compact}
      unread={unread}
      onClick={() => {
        markRead();
        navigate(`/portfolio?position=${pos.id}`);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {pos.event}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {pos.displayOption ?? pos.option}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="text-right">
            <p className={cn("font-mono text-base font-semibold leading-tight", pnlClass)}>
              {pos.pnl}
            </p>
            <p className={cn("font-mono text-[11px] leading-tight", pnlClass)}>
              {pos.pnlPercent}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
        </div>
      </div>
    </FeedCard>
  );
};
