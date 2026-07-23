import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Copy, Loader2, ExternalLink } from 'lucide-react';
import { DesktopBackLink } from '@/components/ui/desktop-back-link';
import { toast } from 'sonner';
import { useRecoveryRequest } from '@/hooks/useRecoveryRequests';
import { RecoveryStatusTimeline, RecoveryStatusBadge } from '@/components/recovery/RecoveryStatusTimeline';
import { useIsMobile } from '@/hooks/use-mobile';
import { EventsDesktopHeader } from '@/components/EventsDesktopHeader';
import { BottomNav } from '@/components/BottomNav';

const FEE_PERCENT = 10;

export default function RecoveryRequestDetailPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { id } = useParams();
  const { data: req, isLoading } = useRecoveryRequest(id);

  if (isMobile === undefined) return null;

  const back = () => navigate('/wallet/recovery');

  const renderShell = (children: React.ReactNode) => {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <MobileHeader onBack={back} />
          {children}
          <BottomNav />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <EventsDesktopHeader />
        {children}
      </div>
    );
  };

  if (isLoading) {
    return renderShell(
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>,
    );
  }

  if (!req) {
    return renderShell(
      <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Request not found.
      </div>,
    );
  }

  const copy = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast.success(`${label} copied`);
  };

  const amountNum = Number(req.claimed_amount) || 0;
  const feeAmount = (amountNum * FEE_PERCENT) / 100;
  const estimatedReturn =
    req.estimated_return != null ? Number(req.estimated_return) : amountNum - feeAmount;

  // Reusable card content blocks
  const statusCard = (
    <div className={`rounded-xl border bg-card ${isMobile ? 'p-4' : 'p-6'} space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className={isMobile ? 'text-sm font-semibold' : 'text-base font-semibold'}>Status</h2>
        <RecoveryStatusBadge status={req.status} />
      </div>
      <RecoveryStatusTimeline status={req.status} />
      {req.status === 'submitted' && (
        <p className="text-xs text-muted-foreground">
          Our team is reviewing and attempting recovery. This typically takes 3–7 business days.
        </p>
      )}
    </div>
  );

  const payoutCard = req.status !== 'rejected' && (
    <div
      className={`rounded-xl border ${
        req.status === 'completed'
          ? 'border-trading-green/30 bg-trading-green/5'
          : 'border-border bg-muted/30'
      } ${isMobile ? 'p-4' : 'p-6'} space-y-2`}
    >
      <div className="text-sm font-semibold">
        {req.status === 'completed' ? 'Funds credited' : 'Estimated payout'}
      </div>
      <div className="space-y-1.5 text-sm">
        <Row label="Amount sent" value={`$${amountNum.toFixed(2)}`} />
        <Row label={`Recovery fee (${FEE_PERCENT}%)`} value={`-$${feeAmount.toFixed(2)}`} />
        <div className="border-t pt-2 flex items-center justify-between">
          <span className="font-medium">
            {req.status === 'completed' ? 'Credited to balance' : 'You will receive'}
          </span>
          <span
            className={`font-mono font-semibold ${
              req.status === 'completed' ? 'text-trading-green' : 'text-primary'
            }`}
          >
            {req.status === 'completed' ? '+' : ''}${estimatedReturn.toFixed(2)}
          </span>
        </div>
      </div>
      {req.status === 'completed' && req.processed_tx_hash && (
        <div className="flex items-center justify-between text-xs pt-1 border-t border-trading-green/20">
          <span className="text-muted-foreground">Internal ref</span>
          <span className="font-mono">{truncate(req.processed_tx_hash)}</span>
        </div>
      )}
    </div>
  );


  const detailsCard = (
    <div className={`rounded-xl border bg-card ${isMobile ? 'p-4' : 'p-6'} space-y-3`}>
      <h2 className={isMobile ? 'text-sm font-semibold mb-1' : 'text-base font-semibold mb-1'}>
        Request details
      </h2>
      <DetailRow label="Amount sent" value={`$${Number(req.claimed_amount).toFixed(2)}`} mono />
      <DetailRow label="Token" value={req.wrong_token} />
      <DetailRow label="Wrong network" value={req.wrong_network} />
      <DetailRow
        label="Transaction hash"
        value={truncate(req.tx_hash)}
        mono
        onCopy={() => copy(req.tx_hash, 'Hash')}
      />
      <DetailRow
        label="Sender wallet"
        value={truncate(req.sender_address)}
        mono
        onCopy={() => copy(req.sender_address, 'Address')}
      />
      <DetailRow label="Submitted" value={new Date(req.created_at).toLocaleString()} />
      {req.user_note && (
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">Your note</div>
          <div className="text-sm text-foreground whitespace-pre-wrap">{req.user_note}</div>
        </div>
      )}
    </div>
  );

  const adminCard = req.admin_note && (
    <div className={`rounded-xl border bg-card ${isMobile ? 'p-4' : 'p-6'} space-y-1.5`}>
      <h2 className={isMobile ? 'text-sm font-semibold' : 'text-base font-semibold'}>
        Message from OmenX
      </h2>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{req.admin_note}</p>
    </div>
  );

  const supportFooter = (
    <div className="text-xs text-muted-foreground text-center pt-2">
      Questions?{' '}
      <a
        href="https://discord.gg/qXssm2crf9"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline inline-flex items-center gap-0.5"
      >
        Contact support
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  // ---- Desktop ----
  if (!isMobile) {
    return renderShell(
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          <div>
            <DesktopBackLink label="Recovery requests" onClick={back} className="mb-3" />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-semibold">Recovery request</h1>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  #{req.id.slice(0, 8)}
                </p>
              </div>
              <RecoveryStatusBadge status={req.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
            <div className="space-y-6">
              {statusCard}
              {payoutCard}
              {adminCard}
            </div>
            <div className="space-y-6">
              {detailsCard}
              {supportFooter}
            </div>
          </div>
        </div>
      </main>,
    );
  }

  // ---- Mobile ----
  return renderShell(
    <main className="flex-1 overflow-auto pb-24 px-4 py-5 space-y-5">
      {statusCard}
      {payoutCard}
      {detailsCard}
      {adminCard}
      {supportFooter}
    </main>,
  );
}

const MobileHeader = ({ onBack }: { onBack: () => void }) => (
  <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
    <div className="flex items-center justify-between px-4 h-14">
      <button
        onClick={onBack}
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="text-lg font-semibold">Recovery request</h1>
      <div className="w-9" />
    </div>
  </header>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono">{value}</span>
  </div>
);

const DetailRow = ({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy?: () => void;
}) => (
  <div className="flex items-center justify-between text-sm gap-3">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <div className="flex items-center gap-1.5 min-w-0">
      <span className={mono ? 'font-mono' : ''}>{value}</span>
      {onCopy && (
        <button
          onClick={onCopy}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  </div>
);

const truncate = (s: string) =>
  s.length <= 14 ? s : `${s.slice(0, 6)}...${s.slice(-6)}`;
