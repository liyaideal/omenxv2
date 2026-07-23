import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { PositionDetailContent } from "./PositionDetailContent";
import { UnifiedPosition } from "@/hooks/usePositions";

interface PositionDetailDrawerProps {
  position: UnifiedPosition;
  liveMarkPrice?: number;
  fundingRatePerHour?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mobile position detail bottom drawer.
 * Desktop equivalent: PositionDetailDialog.
 */
export const PositionDetailDrawer = ({
  position,
  liveMarkPrice,
  fundingRatePerHour,
  open,
  onOpenChange,
}: PositionDetailDrawerProps) => {
  return (
    <MobileDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={position.event}
    >
      <PositionDetailContent
        position={position}
        liveMarkPrice={liveMarkPrice}
        fundingRatePerHour={fundingRatePerHour}
      />
    </MobileDrawer>
  );
};
