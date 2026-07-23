import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  
  DialogTrigger,
} from "@/components/ui/dialog";
import { PositionDetailContent } from "./PositionDetailContent";
import { UnifiedPosition } from "@/hooks/usePositions";

interface PositionDetailDialogProps {
  position: UnifiedPosition;
  liveMarkPrice?: number;
  fundingRatePerHour?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

/**
 * Desktop position detail (per DESIGN.md §5 Overlays).
 * Mobile equivalent: PositionDetailDrawer.
 */
export const PositionDetailDialog = ({
  position,
  liveMarkPrice,
  fundingRatePerHour,
  open,
  onOpenChange,
  children,
}: PositionDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base leading-snug line-clamp-2">
            {position.event}
          </DialogTitle>
        </DialogHeader>
        <PositionDetailContent
          position={position}
          liveMarkPrice={liveMarkPrice}
          fundingRatePerHour={fundingRatePerHour}
        />
      </DialogContent>
    </Dialog>
  );
};
