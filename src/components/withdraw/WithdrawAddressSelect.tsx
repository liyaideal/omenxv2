import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { Button } from '@/components/ui/button';
import { MonoText } from '@/components/typography';
import { cn } from '@/lib/utils';
import {
  MobileDrawer,
  MobileDrawerActions,
  MobileDrawerList,
} from '@/components/ui/mobile-drawer';
import {
  AddAddressFields,
  type AddAddressValues,
} from '@/components/wallet/AddAddressDialog';
import { toast } from 'sonner';

interface WithdrawAddressSelectProps {
  open: boolean;
  onClose: () => void;
  selectedAddress: string;
  onSelectAddress: (address: string) => void;
  /** Seeds the internal step — style-guide only; production callers omit it. */
  initialStep?: 'list' | 'add';
}

const EMPTY_FORM: AddAddressValues = { label: '', address: '', network: '' };

/**
 * Mobile withdrawal-address picker (DESIGN.md §5).
 * A drawer never opens another drawer — "Add new address" swaps the content
 * of this same drawer to an internal "add" step that reuses AddAddressFields.
 */
export const WithdrawAddressSelect = ({
  open,
  onClose,
  selectedAddress,
  onSelectAddress,
  initialStep = 'list',
}: WithdrawAddressSelectProps) => {
  const { wallets, addWallet } = useWallets();
  const [step, setStep] = useState<'list' | 'add'>(initialStep);
  const [form, setForm] = useState<AddAddressValues>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setForm(EMPTY_FORM);
    }
  }, [open, initialStep]);

  const handleSave = async () => {
    if (!form.label.trim()) return toast.error('Please enter a label');
    if (!form.address.trim()) return toast.error('Please enter an address');
    if (!form.network) return toast.error('Please select a network');

    setIsSaving(true);
    const result = await addWallet({
      label: form.label.trim(),
      fullAddress: form.address.trim(),
      network: form.network,
    });
    setIsSaving(false);

    if (result.success) {
      toast.success('Address saved');
      onSelectAddress(form.address.trim());
      setForm(EMPTY_FORM);
      setStep('list');
    } else {
      toast.error(result.error || 'Failed to save address');
    }
  };

  return (
    <MobileDrawer
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
      title={step === 'list' ? 'Withdrawal address' : 'Add address'}
    >
      {step === 'list' ? (
        <MobileDrawerList className="pb-6">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => onSelectAddress(wallet.fullAddress)}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl transition-colors',
                selectedAddress === wallet.fullAddress
                  ? 'bg-primary/10 border border-primary'
                  : 'bg-muted/30 border border-transparent hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center p-2 shrink-0">
                  <img src={wallet.icon} alt={wallet.network} className="w-6 h-6" />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{wallet.label}</span>
                    {wallet.isPrimary && (
                       <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase shrink-0 bg-trading-green/15 text-trading-green">
                        Default
                      </span>
                    )}
                  </div>
                  <MonoText className="text-sm text-muted-foreground truncate block">
                    {wallet.address}
                  </MonoText>
                </div>
              </div>
              {selectedAddress === wallet.fullAddress && (
                <Check className="w-5 h-5 text-primary shrink-0" />
              )}
            </button>
          ))}

          <button
            onClick={() => setStep('add')}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add new address</span>
          </button>

          {wallets.length === 0 && (
            <div className="py-4 text-center">
              <p className="text-muted-foreground text-sm">
                Save addresses for quick withdrawals
              </p>
            </div>
          )}
        </MobileDrawerList>
      ) : (
        <>
          <AddAddressFields values={form} onChange={setForm} idPrefix="withdraw-add-addr" />
          <MobileDrawerActions className="flex gap-2 space-y-0">
            <Button variant="outline" onClick={() => setStep('list')} className="flex-1 h-11">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-11 btn-primary">
              {isSaving ? 'Saving...' : 'Save address'}
            </Button>
          </MobileDrawerActions>
        </>
      )}
    </MobileDrawer>
  );
};
