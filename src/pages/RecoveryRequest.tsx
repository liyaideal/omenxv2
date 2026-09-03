import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Loader2, Plus, Info } from 'lucide-react';
import { DesktopSubpageHeader } from '@/components/layout/DesktopSubpageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useRecoveryRequests } from '@/hooks/useRecoveryRequests';
import { RecoveryStatusBadge } from '@/components/recovery/RecoveryStatusTimeline';
import { RecoveryForm } from '@/components/recovery/RecoveryForm';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { EventsDesktopHeader } from '@/components/EventsDesktopHeader';
import { BottomNav } from '@/components/BottomNav';
import { MobileHeader } from '@/components/MobileHeader';
import lynxEmptyRecovery from '@/assets/wallet/lynx-empty-recovery.png';

export default function RecoveryRequestPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { list } = useRecoveryRequests();
  const [showForm, setShowForm] = useState(false);

  const requests = list.data ?? [];

  if (isMobile === undefined) return null;

  // ---- Signed-out ----
  if (!user) {
    const signInPrompt = (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="space-y-3 max-w-sm">
          <AlertTriangle className="w-10 h-10 text-trading-yellow mx-auto" />
          <h2 className="text-lg font-semibold">Sign in required</h2>
          <p className="text-sm text-muted-foreground">
            Please sign in to submit or view your recovery requests.
          </p>
        </div>
      </div>
    );

    if (isMobile) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <MobileHeader title="Recovery" showBack showLogo={false} />
          {signInPrompt}
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <EventsDesktopHeader />
        {signInPrompt}
      </div>
    );
  }

  // ---- Intro / list section (shared content data) ----
  const intro = (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-trading-yellow shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <div className="font-semibold text-foreground">Wrong-chain recovery service</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We can attempt to retrieve funds sent to the wrong network or with the wrong token.
            A flat <span className="text-trading-yellow font-medium">10% recovery fee</span> applies
            (covers source-chain gas, bridge cost, and manual processing).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We cannot recover funds sent to chains we do not operate on. You'll be notified once funds are credited or if recovery is not possible.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Pill>10% flat fee</Pill>
            <Pill>3–7 business days</Pill>
          </div>
        </div>
      </div>
    </div>
  );

  const listSection = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className={isMobile ? 'text-sm font-semibold' : 'text-base font-semibold'}>Your requests</h2>
        {isMobile && (
          <Button size="sm" onClick={() => setShowForm(true)} className="h-8 rounded-lg">
            <Plus className="w-3.5 h-3.5 mr-1" />
            New request
          </Button>
        )}
      </div>

      {list.isLoading ? (
        <div className="py-10 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/40 p-10 text-center space-y-2">
          <img
            src={lynxEmptyRecovery}
            alt=""
            aria-hidden
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            className="mx-auto w-24 h-24 object-contain pointer-events-none select-none"
          />
          <div className="text-sm font-medium">No recovery requests yet</div>
          <div className="text-xs text-muted-foreground">
            Submit a request if a deposit was sent to the wrong network.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/wallet/recovery/${r.id}`)}
              className="w-full text-left rounded-xl border bg-card hover:bg-accent/40 transition-colors p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    ${Number(r.claimed_amount).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.wrong_token} on {r.wrong_network}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RecoveryStatusBadge status={r.status} />
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const formSection = (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className={isMobile ? 'text-sm font-semibold' : 'text-base font-semibold'}>
          New recovery request
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(false)}
          className={isMobile ? 'h-8 rounded-lg' : 'h-9 rounded-lg'}
        >
          Cancel
        </Button>
      </div>
      <div className={isMobile ? '' : 'max-w-xl'}>
        <RecoveryForm />
      </div>
    </div>
  );

  // ---- Desktop ----
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <EventsDesktopHeader />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-6">
            <DesktopSubpageHeader title="Recovery" onBack={() => navigate('/wallet')}>
              <Button size="sm" onClick={() => setShowForm(true)} className="h-9 rounded-lg">
                <Plus className="w-3.5 h-3.5 mr-1" />
                New request
              </Button>
            </DesktopSubpageHeader>
            <div className="mt-[22px] space-y-6">
              {intro}
              {showForm ? formSection : listSection}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---- Mobile ----
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MobileHeader title="Recovery" showBack showLogo={false} />
      <main className="flex-1 overflow-auto pb-24">
        <div className="px-4 mt-5">{intro}</div>
        <div className="px-4 mt-6">{showForm ? formSection : listSection}</div>
      </main>
      <BottomNav />
    </div>
  );
}

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
    {children}
  </span>
);

