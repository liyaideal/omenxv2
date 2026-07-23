import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { ClosePositionForm } from "./ClosePositionForm";

interface ClosePositionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  option: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  fullCloseOnly?: boolean;
  onConfirm: (closeQty: number) => void | Promise<void>;
  isClosing?: boolean;
}

/**
 * Mobile Close Position bottom drawer (per DESIGN.md & /style-guide:
 * all mobile bottom sheets must use MobileDrawer).
 */
export const ClosePositionDrawer = ({
  open,
  onOpenChange,
  option,
  side,
  size,
  entryPrice,
  markPrice,
  margin,
  fullCloseOnly = false,
  onConfirm,
  isClosing = false,
}: ClosePositionDrawerProps) => {
  const safeSize = Math.max(1, Math.floor(size));
  const description = `${option} · ${safeSize.toLocaleString()} contracts`;

  const handleConfirm = async (qty: number) => {
    await onConfirm(qty);
    onOpenChange(false);
  };

  return (
    <MobileDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Close position"
      description={description}
    >
      <ClosePositionForm
        option={option}
        side={side}
        size={size}
        entryPrice={entryPrice}
        markPrice={markPrice}
        margin={margin}
        fullCloseOnly={fullCloseOnly}
        onConfirm={handleConfirm}
        onCancel={() => onOpenChange(false)}
        isClosing={isClosing}
        showHeader={false}
      />
    </MobileDrawer>
  );
};
