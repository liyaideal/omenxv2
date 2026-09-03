import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletDeposit } from '@/components/deposit/WalletDeposit';
import { CrossChainDeposit } from '@/components/deposit/CrossChainDeposit';

import { AccountPicker, AccountPickerRows, type AccountKind } from '@/components/wallet/AccountPicker';
import { useAccountPreference, ACCOUNT_LABEL } from '@/hooks/useAccountPreference';
import { useAuth } from '@/hooks/useAuth';
import { useSurface } from '@/contexts/SurfaceContext';
import { WalletAuthGate, WalletGatePlaceholder } from '@/pages/Wallet';

export default function Deposit() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('wallet');
  const { account, setAccount } = useAccountPreference('deposit');
  const { user } = useAuth();
  const { surface } = useSurface();
  const [pickerOpen, setPickerOpen] = useState(false);
  
  // On desktop, redirect to wallet page
  useEffect(() => {
    if (isMobile !== undefined && isMobile === false) {
      navigate('/wallet', { replace: true });
    }
  }, [isMobile, navigate]);

  // Don't render on desktop or during initial load
  if (isMobile === undefined || isMobile === false) {
    return null;
  }

  // Guest gate — same door as /wallet. No deposit address is rendered.
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <MobileHeader title="Deposit" showBack showLogo={false} />
        <main className="flex-1 overflow-auto pb-24">
          <WalletAuthGate isLite={surface === 'lite'}>
            <WalletGatePlaceholder />
          </WalletAuthGate>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader title="Deposit" showBack showLogo={false} />

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
              <TabsList className="w-full grid grid-cols-2 h-10">
                <TabsTrigger value="wallet" className="text-xs">Address</TabsTrigger>
                <TabsTrigger value="crosschain" className="text-xs">Wallet</TabsTrigger>
              </TabsList>
            </div>

            <main className="flex-1 overflow-auto pb-24">
              <TabsContent value="wallet" className="mt-0">
                <WalletDeposit account={account} />
              </TabsContent>
              <TabsContent value="crosschain" className="mt-0">
                <CrossChainDeposit account={account} />
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

      {/* Support is a quiet text link at the very bottom — never header chrome. */}
      <div className="px-4 pb-6 text-center">
        <a
          href="mailto:customerservice@omenx.com?subject=Deposit Support"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Need help? Contact support
        </a>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
