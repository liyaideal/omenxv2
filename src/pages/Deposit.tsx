import { t } from "@/i18n";
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletDeposit } from '@/components/deposit/WalletDeposit';
import { CrossChainDeposit } from '@/components/deposit/CrossChainDeposit';
import { BuyWithCard, useCardRegion } from '@/components/deposit/BuyWithCard';

import { AccountPicker, AccountPickerRows, type AccountKind } from '@/components/wallet/AccountPicker';
import { useAccountPreference, ACCOUNT_LABEL } from '@/hooks/useAccountPreference';
import { useAuth } from '@/hooks/useAuth';
import { WalletAuthGate, WalletGatePlaceholder } from '@/pages/Wallet';

export default function Deposit() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const orderTxId = searchParams.get('order');
  // Card tab shows only where MoonPay can take cards (rule 3). Until the lookup
  // answers we render today's two tabs; when supported, Card is first + default.
  const region = useCardRegion();
  const cardAvailable = region?.isBuyAllowed === true;
  const [activeTab, setActiveTab] = useState<string>(orderTxId ? 'card' : 'wallet');
  const [tabTouched, setTabTouched] = useState(!!orderTxId);
  useEffect(() => {
    if (!tabTouched && cardAvailable) setActiveTab('card');
  }, [cardAvailable, tabTouched]);
  const { account, setAccount } = useAccountPreference('deposit');
  const { user } = useAuth();
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
        <MobileHeader title={t("common.deposit")} showBack showLogo={false} />
        <main className="flex-1 overflow-auto pb-24">
          <WalletAuthGate isLite>
            <WalletGatePlaceholder />
          </WalletAuthGate>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader title={t("common.deposit")} showBack showLogo={false} />

      {!account ? (
        /* Step 1: Deposit to */
        <main className="flex-1 overflow-auto p-4 pb-24 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-1">{t("wallet.depositTo")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("wallet.depositAccountHint")}
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

          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setTabTouched(true); }} className="flex flex-col flex-1">
            <div className="px-4 pt-3 bg-background">
              <TabsList className={cn("w-full grid h-10", cardAvailable ? "grid-cols-3" : "grid-cols-2")}>
                {cardAvailable && <TabsTrigger value="card" className="text-xs">{t("settings.wallet.deposit_tab_card")}</TabsTrigger>}
                <TabsTrigger value="wallet" className="text-xs">{t("settings.wallet.deposit_tab_crypto")}</TabsTrigger>
                <TabsTrigger value="crosschain" className="text-xs">{t("settings.wallet.deposit_tab_cross_chain")}</TabsTrigger>
              </TabsList>
            </div>

            <main className="flex-1 overflow-auto pb-24 flex flex-col">
              {cardAvailable && (
                <TabsContent value="card" className="mt-0 flex-1 flex flex-col">
                  <BuyWithCard account={account} initialTransactionId={orderTxId} />
                </TabsContent>
              )}
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
            title={t("wallet.depositTo")}
          />
        </>
      )}

      {/* Support is a quiet text link at the very bottom — never header chrome. */}
      <div className="px-4 pb-6 text-center">
        <a
          href="mailto:customerservice@omenx.com?subject=Deposit Support"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("settings.wallet.need_help_contact_support")}
        </a>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
