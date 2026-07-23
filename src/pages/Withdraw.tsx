import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, HelpCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BottomNav } from '@/components/BottomNav';
import { WalletWithdraw } from '@/components/withdraw/WalletWithdraw';

export default function Withdraw() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile !== undefined && isMobile === false) {
      navigate('/wallet', { replace: true });
    }
  }, [isMobile, navigate]);

  const handleBack = () => navigate(-1);
  const handleClose = () => navigate(-1);

  if (isMobile === undefined || isMobile === false) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={handleBack} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Withdraw</h1>
          <div className="flex items-center gap-2">
            <a href="mailto:customerservice@omenx.com?subject=Withdraw Support" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="w-5 h-5" />
            </a>
            <button onClick={handleClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-24">
        <WalletWithdraw />
      </main>

      <BottomNav />
    </div>
  );
}
