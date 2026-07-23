import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TransferForm, type TransferDirection } from "./TransferForm";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDirection?: TransferDirection;
}

/**
 * Desktop Transfer dialog (Dual-Account 2b). Mobile counterpart: TransferDrawer.
 * Per DESIGN.md §5 (LOCKED): mobile MUST use MobileDrawer.
 */
export const TransferDialog = ({ open, onOpenChange, initialDirection }: TransferDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md bg-card border-border">
      <DialogHeader>
        <DialogTitle>Transfer funds</DialogTitle>
        <DialogDescription className="text-xs">
          Move USDC between your Spot and Futures accounts.
        </DialogDescription>
      </DialogHeader>
      <TransferForm
        onCancel={() => onOpenChange(false)}
        onSuccess={() => onOpenChange(false)}
        initialDirection={initialDirection}
      />
    </DialogContent>
  </Dialog>
);
