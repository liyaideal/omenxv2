import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { TransferForm, type TransferDirection } from "./TransferForm";

interface TransferDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDirection?: TransferDirection;
}

/**
 * Mobile Transfer bottom drawer (Dual-Account 2b). Desktop counterpart: TransferDialog.
 * DESIGN.md §5 LOCKED — no Dialog on mobile.
 */
export const TransferDrawer = ({ open, onOpenChange, initialDirection }: TransferDrawerProps) => (
  <MobileDrawer
    open={open}
    onOpenChange={onOpenChange}
    title="Transfer funds"
    description="Move USDC between your Spot and Futures accounts."
  >
    <TransferForm
      onCancel={() => onOpenChange(false)}
      onSuccess={() => onOpenChange(false)}
      initialDirection={initialDirection}
    />
  </MobileDrawer>
);
