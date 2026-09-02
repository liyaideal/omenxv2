import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { CloseVoucherContent } from "./CloseVoucherContent";

interface CloseVoucherDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: string;
  optionLabel: string;
  side: "long" | "short";
  entryPrice: number;
  markPrice: number;
  faceValue: number;
  redeemableCap?: number | null;
  redeemableCapPct?: number | null;
  payoutMode?: "instant" | "tiered" | null;
  onConfirm: () => void | Promise<void>;
  isClosing?: boolean;
}

export const CloseVoucherDrawer = ({
  open,
  onOpenChange,
  event,
  optionLabel,
  side,
  entryPrice,
  markPrice,
  faceValue,
  redeemableCap,
  redeemableCapPct,
  payoutMode,
  onConfirm,
  isClosing = false,
}: CloseVoucherDrawerProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <MobileDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Close voucher position"
      description={event}
    >
      <CloseVoucherContent
        variant="drawer"
        optionLabel={optionLabel}
        side={side}
        entryPrice={entryPrice}
        markPrice={markPrice}
        faceValue={faceValue}
        redeemableCap={redeemableCap}
        redeemableCapPct={redeemableCapPct}
        payoutMode={payoutMode}
        onConfirm={handleConfirm}
        onCancel={() => onOpenChange(false)}
        isClosing={isClosing}
      />
    </MobileDrawer>
  );
};
