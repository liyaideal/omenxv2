import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CloseVoucherContent } from "./CloseVoucherContent";

interface CloseVoucherDialogProps {
  children: React.ReactNode;
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

export const CloseVoucherDialog = ({
  children,
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
}: CloseVoucherDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Close voucher position</DialogTitle>
          <DialogDescription className="text-xs">{event}</DialogDescription>
        </DialogHeader>
        <CloseVoucherContent
          variant="dialog"
          optionLabel={optionLabel}
          side={side}
          entryPrice={entryPrice}
          markPrice={markPrice}
          faceValue={faceValue}
          redeemableCap={redeemableCap}
          redeemableCapPct={redeemableCapPct}
          payoutMode={payoutMode}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
          isClosing={isClosing}
        />
      </DialogContent>
    </Dialog>
  );
};
