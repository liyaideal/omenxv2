/**
 * DeleteAddressDrawer — mobile confirm drawer for deleting a saved address.
 * Mounted by: src/pages/Wallet.tsx (mobile layout) and the style-guide funding preview.
 */
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MobileDrawer,
  MobileDrawerActions,
  MobileDrawerStatus,
} from "@/components/ui/mobile-drawer";

interface DeleteAddressDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Saved-address label shown in the confirmation sentence. */
  label?: string;
  onConfirm: () => void;
  deleting?: boolean;
}

export const DeleteAddressDrawer = ({
  open,
  onOpenChange,
  label,
  onConfirm,
  deleting = false,
}: DeleteAddressDrawerProps) => (
  <MobileDrawer open={open} onOpenChange={onOpenChange} showHandle>
    <MobileDrawerStatus
      icon={<AlertTriangle className="w-8 h-8 text-trading-red" />}
      title="Delete Address?"
      description={`Are you sure you want to delete "${label ?? ""}"? This action cannot be undone.`}
      variant="error"
    />
    <MobileDrawerActions className="flex gap-2 space-y-0">
      <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-11">
        Cancel
      </Button>
      <Button
        onClick={onConfirm}
        disabled={deleting}
        className="flex-1 h-11 bg-trading-red hover:bg-trading-red/90 text-white"
      >
        {deleting ? "Deleting..." : "Delete"}
      </Button>
    </MobileDrawerActions>
  </MobileDrawer>
);
