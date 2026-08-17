import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { Button } from '@/components/ui/button';
import { WalletWithdraw } from '@/components/withdraw/WalletWithdraw';
import {
  WithdrawSubmitProvider,
  useWithdrawSubmit,
} from '@/components/withdraw/WithdrawSubmitContext';

/** Sticky primary CTA for the full-screen withdraw flow (DESIGN.md §5). */
const StickyWithdrawBar = () => {
  const ctx = useWithdrawSubmit();
  if (!ctx?.state.visible) return null;
  const { disabled, loading, onSubmit } = ctx.state;

  return (
    <div
      className="sticky z-30 bg-background border-t border-border px-4 pt-3"
      style={{
        bottom: 'var(--bottom-nav-h, 76px)',
        marginBottom: 'var(--bottom-nav-h, 76px)',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
      }}
    >
      <Button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover font-semibold text-sm"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
        ) : (
          'Withdraw'
        )}
      </Button>
    </div>
  );
};

export default function Withdraw() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile !== undefined && isMobile === false) {
      navigate('/wallet', { replace: true });
    }
  }, [isMobile, navigate]);

  if (isMobile === undefined || isMobile === false) return null;

  return (
    <WithdrawSubmitProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <MobileHeader title="Withdraw" showBack showLogo={false} />

        <main className="flex-1 overflow-auto pb-40">
          <WalletWithdraw />

          {/* Support is a quiet text link at the very bottom — never header chrome. */}
          <div className="px-4 pb-4 text-center">
            <a
              href="mailto:customerservice@omenx.com?subject=Withdraw Support"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Need help? Contact support
            </a>
          </div>
        </main>

        <StickyWithdrawBar />

        <BottomNav />
      </div>
    </WithdrawSubmitProvider>
  );
}
