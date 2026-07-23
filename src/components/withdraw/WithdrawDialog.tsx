import { X, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WalletWithdraw } from './WalletWithdraw';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WithdrawDialog = ({ open, onOpenChange }: WithdrawDialogProps) => {
  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 max-h-[90vh] flex flex-col" hideCloseButton>
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Withdraw</DialogTitle>
            <div className="flex items-center gap-2">
              <a
                href="mailto:customerservice@omenx.com?subject=Withdraw Support"
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                <HelpCircle className="w-5 h-5" />
              </a>
              <button
                onClick={handleClose}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <WalletWithdraw onDone={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
