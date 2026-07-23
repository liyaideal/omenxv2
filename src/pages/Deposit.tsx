import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, HelpCircle, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNav } from '@/components/BottomNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletDeposit } from '@/components/deposit/WalletDeposit';
import { CrossChainDeposit } from '@/components/deposit/CrossChainDeposit';
import { BuyWithFiat } from '@/components/deposit/BuyWithFiat';

import { AccountPicker, AccountPickerRows, type AccountKind } from '@/components/wallet/AccountPicker';
import { useAccountPreference, ACCOUNT_LABEL } from '@/hooks/useAccountPreference';

export default function Deposit() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('wallet');
  const { account, setAccount } = useAccountPreference('deposit');
  const [pickerOpen, setPickerOpen] = useState(false);
  
  // On desktop, redirect to wallet page
  useEffect(() => {
    if (isMobile !== undefined && isMobile === false) {
      navigate('/wallet', { replace: true });
    }
  }, [isMobile, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleClose = () => {
    navigate(-1);
  };

  // Don't render on desktop or during initial load
  if (isMobile === undefined || isMobile === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg font-semibold">Deposit</h1>
          
          <div className="flex items-center gap-2">
            <a
              href="mailto:customerservice@omenx.com?subject=Deposit Support"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </a>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {!account ? (
        /* Step 1: Deposit to */
        <main className="flex-1 overflow-auto p-4 pb-24 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">Deposit to</h3>
            <p className="text-xs text-muted-foreground">
              Pick which account will receive your funds. You can change this later.
            </p>
          </div>
          <AccountPickerRows
            selected={null}
            onSelect={(a: AccountKind) => setAccount(a)}
          />
        </main>
      ) : (
        <>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-between px-4 py-2.5 text-xs border-b border-border/50 bg-muted/20"
          >
            <span className="text-muted-foreground">
              To: <span className="font-medium text-foreground">{ACCOUNT_LABEL[account]}</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
            <div className="px-4 pt-3 bg-background">
              <TabsList className="w-full grid grid-cols-3 h-10">
                <TabsTrigger value="wallet" className="text-xs">Address</TabsTrigger>
                <TabsTrigger value="crosschain" className="text-xs">Wallet</TabsTrigger>
                <TabsTrigger value="fiat" className="text-xs">Fiat</TabsTrigger>
              </TabsList>
            </div>

            <main className="flex-1 overflow-auto pb-24">
              <TabsContent value="wallet" className="mt-0">
                <WalletDeposit account={account} />
              </TabsContent>
              <TabsContent value="crosschain" className="mt-0">
                <CrossChainDeposit account={account} />
              </TabsContent>
              <TabsContent value="fiat" className="mt-0">
                <BuyWithFiat account={account} />
              </TabsContent>
            </main>
          </Tabs>

          <AccountPicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            selected={account}
            onSelect={(a) => {
              setAccount(a);
              setPickerOpen(false);
            }}
            title="Deposit to"
          />
        </>
      )}

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
