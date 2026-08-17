import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import { WalletWithdraw } from '@/components/withdraw/WalletWithdraw';

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
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader title="Withdraw" showBack showLogo={false} />

      <main className="flex-1 overflow-auto pb-24">
        <WalletWithdraw />
      </main>

      {/* Support is a quiet text link at the very bottom — never header chrome. */}
      <div className="px-4 pb-6 text-center">
        <a
          href="mailto:customerservice@omenx.com?subject=Withdraw Support"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Need help? Contact support
        </a>
      </div>

      <BottomNav />
    </div>
  );
}
