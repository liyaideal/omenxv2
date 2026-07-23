import { useState } from "react";
import { useTreasureDrop } from "@/hooks/useTreasureDrop";
import penguinGiftBox from "@/assets/penguin-gift-box.gif";
import { TreasureClaimDialog } from "./TreasureClaimDialog";

interface TreasureDropButtonProps {
  className?: string;
}

export const TreasureDropButton = ({ className = "" }: TreasureDropButtonProps) => {
  const { shouldShowTreasure, claimTreasure, isClaiming, hideTreasure } = useTreasureDrop();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    pointsDropped: number;
    tier: string;
    newBalance: number;
  } | null>(null);

  const handleClick = async () => {
    try {
      const result = await claimTreasure();
      setClaimResult({
        pointsDropped: result.pointsDropped,
        tier: result.tier,
        newBalance: result.newBalance,
      });
      setDialogOpen(true);
    } catch (error) {
      console.error('Failed to claim treasure:', error);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setClaimResult(null);
    hideTreasure();
  };

  // Always render the dialog (even when button is hidden) so animation can play
  return (
    <>
      {shouldShowTreasure && (
        <button
          onClick={handleClick}
          disabled={isClaiming}
          className={`
            fixed bottom-24 right-4 z-50
            transition-all duration-300
            hover:scale-105
            active:scale-95
            disabled:opacity-50
            ${className}
          `}
          aria-label="Open Treasure"
        >
          <div className="relative w-28 h-28 md:w-40 md:h-40">
            <img 
              src={penguinGiftBox} 
              alt="Treasure"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10 animate-pulse" />
          </div>
        </button>
      )}

      {/* Dialog always rendered so it can display after claim */}
      <TreasureClaimDialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        pointsDropped={claimResult?.pointsDropped || 0}
        tier={claimResult?.tier || 'mid'}
        newBalance={claimResult?.newBalance || 0}
      />
    </>
  );
};
