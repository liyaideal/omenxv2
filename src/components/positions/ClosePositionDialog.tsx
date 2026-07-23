import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClosePositionForm } from "./ClosePositionForm";

interface ClosePositionDialogProps {
  children: React.ReactNode;
  event: string;
  option: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  leverage: string;
  fullCloseOnly?: boolean;
  onConfirm: (closeQty: number) => void | Promise<void>;
  isClosing?: boolean;
}

/**
 * Desktop Close Position dialog (per DESIGN.md §5 Overlays:
 * 资金/不可逆确认类操作在桌面必须使用 Dialog；移动端对等组件为 ClosePositionDrawer)。
 */
export const ClosePositionDialog = ({
  children,
  option,
  side,
  size,
  entryPrice,
  markPrice,
  margin,
  leverage,
  fullCloseOnly = false,
  onConfirm,
  isClosing = false,
}: ClosePositionDialogProps) => {
  const safeSize = Math.max(1, Math.floor(size));
  // option 已经是 display label（binary 别名或 Yes/No 或多 outcome 名），直接显示即可
  const description = `${option} ${leverage} · ${safeSize.toLocaleString()} contracts`;
  const [open, setOpen] = useState(false);

  const handleConfirm = async (qty: number) => {
    await onConfirm(qty);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Close position</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>
        <ClosePositionForm
          option={option}
          side={side}
          size={size}
          entryPrice={entryPrice}
          markPrice={markPrice}
          margin={margin}
          fullCloseOnly={fullCloseOnly}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
          isClosing={isClosing}
          showHeader={false}
        />
      </DialogContent>
    </Dialog>
  );
};
