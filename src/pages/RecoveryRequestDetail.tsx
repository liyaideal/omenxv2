import { t } from "@/i18n";
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Loader2, ExternalLink } from 'lucide-react';
import { DesktopSubpageHeader } from '@/components/layout/DesktopSubpageHeader';
import { LiteAuthGate } from '@/components/auth/LiteAuthGate';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useRecoveryRequest } from '@/hooks/useRecoveryRequests';
import { RecoveryStatusTimeline, RecoveryStatusBadge } from '@/components/recovery/RecoveryStatusTimeline';
import { useIsMobile } from '@/hooks/use-mobile';
import { EventsDesktopHeader } from '@/components/EventsDesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';

const FEE_PERCENT = 10;

export default function RecoveryRequestDetailPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { id } = useParams();
  const { user } = useAuth();
  const { data: req, isLoading } = useRecoveryRequest(id);

  if (isMobile === undefined) return null;

  const back = () => navigate('/wallet/recovery');

  const renderShell = (children: React.ReactNode) => {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <MobileHeader title={t("settings.wallet.recovery_request_title")} showBack showLogo={false} />
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

  // ---- Signed-out: global LiteAuthGate over gray skeleton (no data fetch) ----
  if (!user) {
    const gate = (
      <LiteAuthGate
        title={t("auth.lite.recovery_title")}
        description={t("auth.lite.recovery_description")}
      >
        <div className="space-y-4">
          <div className="h-[140px] rounded-xl border bg-muted/30" />
          <div className="h-[110px] rounded-xl border bg-muted/30" />
          <div className="h-[180px] rounded-xl border bg-muted/30" />
        </div>
      </LiteAuthGate>
    );
    return renderShell(
      isMobile ? (
        <main className="flex-1 overflow-auto pb-24 px-4 py-5">{gate}</main>
      ) : (
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6">
            <DesktopSubpageHeader title={t("settings.wallet.recovery_request_detail_title")} onBack={back} />
            <div className="mt-[22px]">{gate}</div>
          </div>
        </main>
      ),
    );
  }

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
        {t("settings.wallet.recovery_not_found")}
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
        <h2 className={isMobile ? 'text-sm font-semibold' : 'text-base font-semibold'}>{t("common.status")}</h2>
        <RecoveryStatusBadge status={req.status} />
      </div>
      <RecoveryStatusTimeline status={req.status} />
      {req.status === 'submitted' && (
        <p className="text-xs text-muted-foreground">
          {t("settings.wallet.recovery_status_submitted_hint")}
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
        <Row label={t("settings.wallet.amount_sent")} value={`$${amountNum.toFixed(2)}`} />
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
          <span className="text-muted-foreground">{t("settings.wallet.recovery_internal_ref")}</span>
          <span className="font-mono">{truncate(req.processed_tx_hash)}</span>
        </div>
      )}
    </div>
  );


  const detailsCard = (
    <div className={`rounded-xl border bg-card ${isMobile ? 'p-4' : 'p-6'} space-y-3`}>
      <h2 className={isMobile ? 'text-sm font-semibold mb-1' : 'text-base font-semibold mb-1'}>
        {t("settings.wallet.recovery_details_title")}
      </h2>
      <DetailRow label={t("settings.wallet.amount_sent")} value={`$${Number(req.claimed_amount).toFixed(2)}`} mono />
      <DetailRow label={t("wallet.screen.cross_chain_deposit.token")} value={req.wrong_token} />
      <DetailRow label={t("settings.wallet.recovery_wrong_network_short")} value={req.wrong_network} />
      <DetailRow
        label={t("wallet.screen.withdraw_status_tracker.transaction_hash")}
        value={truncate(req.tx_hash)}
        mono
        onCopy={() => copy(req.tx_hash, 'Hash')}
      />
      <DetailRow
        label={t("settings.wallet.recovery_sender_wallet_short")}
        value={truncate(req.sender_address)}
        mono
        onCopy={() => copy(req.sender_address, 'Address')}
      />
      <DetailRow label={t("wallet.screen.recovery_status.steps.submitted")} value={new Date(req.created_at).toLocaleString()} />
      {req.user_note && (
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">{t("settings.wallet.recovery_your_note")}</div>
          <div className="text-sm text-foreground whitespace-pre-wrap">{req.user_note}</div>
        </div>
      )}
    </div>
  );

  const adminCard = req.admin_note && (
    <div className={`rounded-xl border bg-card ${isMobile ? 'p-4' : 'p-6'} space-y-1.5`}>
      <h2 className={isMobile ? 'text-sm font-semibold' : 'text-base font-semibold'}>
        {t("settings.wallet.recovery_admin_note_title")}
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
        {t("settings.wallet.recovery_support_link")}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );

  // ---- Desktop ----
  if (!isMobile) {
    return renderShell(
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6">
          <DesktopSubpageHeader title={t("settings.wallet.recovery_request_detail_title")} onBack={back} />

          <div className="mt-[22px] grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
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
