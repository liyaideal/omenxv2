import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MobileDrawer,
  MobileDrawerActions,
} from '@/components/ui/mobile-drawer';
import { useWallets } from '@/hooks/useWallets';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const NETWORKS = [
  "Ethereum",
  "BNB Smart Chain (BEP20)",
  "Tron (TRC20)",
  "Polygon",
  "Arbitrum One",
  "Solana",
  "Avalanche C-Chain",
  "Bitcoin",
];

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the full address after successful save */
  onAdded?: (fullAddress: string) => void;
}

export const AddAddressDialog = ({
  open,
  onOpenChange,
  onAdded,
}: AddAddressDialogProps) => {
  const isMobile = useIsMobile();
  const { addWallet } = useWallets();
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNetwork, setNewNetwork] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const reset = () => {
    setNewLabel("");
    setNewAddress("");
    setNewNetwork("");
  };

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) reset();
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) {
      toast.error("Please enter a label");
      return;
    }
    if (!newAddress.trim()) {
      toast.error("Please enter an address");
      return;
    }
    if (!newNetwork) {
      toast.error("Please select a network");
      return;
    }

    setIsAdding(true);
    const result = await addWallet({
      label: newLabel.trim(),
      fullAddress: newAddress.trim(),
      network: newNetwork,
    });

    if (result.success) {
      toast.success("Address saved");
      const addr = newAddress.trim();
      reset();
      onOpenChange(false);
      onAdded?.(addr);
    } else {
      toast.error(result.error || "Failed to save address");
    }
    setIsAdding(false);
  };

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="add-addr-label">Label</Label>
        <Input
          id="add-addr-label"
          placeholder="e.g. My Binance, Cold Wallet"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="add-addr-address">Address</Label>
        <Input
          id="add-addr-address"
          placeholder="Paste wallet address"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
          className="font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label>Network</Label>
        <Select value={newNetwork} onValueChange={setNewNetwork}>
          <SelectTrigger>
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((net) => (
              <SelectItem key={net} value={net}>{net}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={handleClose}
        title="Add Address"
      >
        {formContent}
        <MobileDrawerActions>
          <Button
            onClick={handleAdd}
            disabled={isAdding}
            className="w-full btn-primary h-12"
          >
            {isAdding ? "Saving..." : "Save Address"}
          </Button>
        </MobileDrawerActions>
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Address</DialogTitle>
          <DialogDescription>Save a wallet address for quick deposits and withdrawals</DialogDescription>
        </DialogHeader>
        {formContent}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => handleClose(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isAdding} className="flex-1 btn-primary">
            {isAdding ? "Saving..." : "Save Address"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
