import { t } from "@/i18n";
import { useEffect, useState } from 'react';
import { X, HelpCircle, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletDeposit } from './WalletDeposit';
import { CrossChainDeposit } from './CrossChainDeposit';
import { BuyWithCard, useCardRegion } from './BuyWithCard';
import { cn } from '@/lib/utils';
import { AccountPickerRows, type AccountKind } from '@/components/wallet/AccountPicker';
import { useAccountPreference, ACCOUNT_LABEL } from '@/hooks/useAccountPreference';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Open straight on a card order's tracking state (Wallet ledger "View order status"). */
  cardOrderTransactionId?: string | null;
}

export const DepositDialog = ({ open, onOpenChange, cardOrderTransactionId = null }: DepositDialogProps) => {
  // Card tab only where MoonPay can take cards (rule 3); first + default when it can.
  const region = useCardRegion();
  const cardAvailable = region?.isBuyAllowed === true;
  const [activeTab, setActiveTab] = useState<string>('wallet');
  const [tabTouched, setTabTouched] = useState(false);
  useEffect(() => {
    if (!open) return;
    if (cardOrderTransactionId) { setActiveTab('card'); setTabTouched(true); return; }
    if (!tabTouched && cardAvailable) setActiveTab('card');
  }, [open, cardAvailable, tabTouched, cardOrderTransactionId]);
  const { account, setAccount } = useAccountPreference('deposit');
  const [editingAccount, setEditingAccount] = useState(false);

  const handleClose = () => {
    setActiveTab(cardAvailable ? 'card' : 'wallet');
    setTabTouched(false);
    setEditingAccount(false);
    onOpenChange(false);
  };

  const handleSelect = (next: AccountKind) => {
    setAccount(next);
    setEditingAccount(false);
  };

  const needsSelection = !account || editingAccount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 max-h-[90vh] flex flex-col" hideCloseButton>
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">{t("common.deposit")}</DialogTitle>
            <div className="flex items-center gap-2">
              <a
                href="mailto:customerservice@omenx.com?subject=Deposit Support"
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

        {needsSelection ? (
          /* Step 1: Deposit to (account selection) */
          <div className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">{t("wallet.depositTo")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("wallet.depositAccountHint")}
              </p>
            </div>
            <AccountPickerRows selected={null} onSelect={handleSelect} />
          </div>

        ) : (
          <>
            {/* Account crumb — click to edit selection inline (no nested Dialog) */}
            <button
              type="button"
              onClick={() => setEditingAccount(true)}
              className="flex items-center justify-between px-6 py-2.5 text-xs border-b border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <span className="text-muted-foreground">
                To: <span className="font-medium text-foreground">{ACCOUNT_LABEL[account]}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setTabTouched(true); }} className="flex flex-col flex-1 min-h-0">
              <div className="px-4 pt-3 flex-shrink-0">
                <TabsList className={cn("w-full grid h-9", cardAvailable ? "grid-cols-3" : "grid-cols-2")}>
                  {cardAvailable && <TabsTrigger value="card" className="text-xs">{t("settings.wallet.deposit_tab_card")}</TabsTrigger>}
                  <TabsTrigger value="wallet" className="text-xs">{t("settings.wallet.deposit_tab_crypto")}</TabsTrigger>
                  <TabsTrigger value="crosschain" className="text-xs">{t("settings.wallet.deposit_tab_cross_chain")}</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                {cardAvailable && (
                  <TabsContent value="card" className="mt-0">
                    <BuyWithCard account={account} initialTransactionId={cardOrderTransactionId} onDone={handleClose} />
                  </TabsContent>
                )}
                <TabsContent value="wallet" className="mt-0">
                  <WalletDeposit onDone={handleClose} account={account} />
                </TabsContent>
                <TabsContent value="crosschain" className="mt-0">
                  <CrossChainDeposit account={account} />
                </TabsContent>
              </div>
            </Tabs>

          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
