import { useNavigate } from "react-router-dom";
import { usePoints } from "@/hooks/usePoints";
import { useTasks } from "@/hooks/useTasks";
import { useTreasureDrop } from "@/hooks/useTreasureDrop";
import bonusBadge from "@/assets/bonus-badge.gif";

interface FloatingRewardsButtonProps {
  className?: string;
}

export const FloatingRewardsButton = ({ className = "" }: FloatingRewardsButtonProps) => {
  const navigate = useNavigate();
  const { pointsBalance } = usePoints();
  const { tasks } = useTasks();
  const { hasClaimed, isLoading } = useTreasureDrop();

  // Check if there are claimable tasks
  const claimableTasks = tasks.filter(t => t.isCompleted && !t.isClaimed);
  const hasClaimable = claimableTasks.length > 0;

  // Only show floating button after user has claimed their treasure drop
  if (!hasClaimed || isLoading) return null;

  return (
    <button
      onClick={() => navigate("/rewards")}
      className={`
        fixed z-50 group
        ${className}
      `}
      aria-label="Open Rewards Center"
    >
      {/* Main button - GIF badge */}
      <div 
        className={`
          relative w-20 h-20
          transition-all duration-300
          group-hover:scale-110
          group-active:scale-95
        `}
      >
        <img 
          src={bonusBadge} 
          alt="Bonus"
          className="w-full h-full object-contain drop-shadow-lg"
        />

        {/* Notification badge */}
        {hasClaimable && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-trading-red flex items-center justify-center shadow-lg">
            <span className="text-[10px] font-bold text-white">
              {claimableTasks.length}
            </span>
          </div>
        )}
      </div>

      {/* Points preview tooltip */}
      <div 
        className={`
          absolute right-full mr-3 top-1/2 -translate-y-1/2
          px-3 py-1.5 rounded-lg
          bg-background/95 backdrop-blur-sm border border-border/50
          shadow-lg
          opacity-0 group-hover:opacity-100
          transition-all duration-200
          pointer-events-none
          whitespace-nowrap
        `}
      >
        <p className="text-xs text-muted-foreground">Points Balance</p>
        <p className="font-bold text-primary font-mono">{pointsBalance.toLocaleString()}</p>
      </div>
    </button>
  );
};
