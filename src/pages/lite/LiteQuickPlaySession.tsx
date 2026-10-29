// ============================================================
// /portfolio/quick-play/:sessionKey — one Quick Play session (CPO 2026-10-29).
// Thin shell: the session row from arcade_my_sessions + its calls from
// arcade_my_session_calls → view-model → the pure QuickPlaySession views,
// which the style guide mounts with fixtures. Share reuses the cabinet's
// run poster, fed from the session's numbers.
// ============================================================
import { t } from "@/i18n";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useArcadeSessionCalls, useArcadeSessions } from "@/hooks/useArcadeSessions";
import { quickPlaySessionVM, quickPlayShareRun } from "@/lib/arcade/quickPlayPortfolio";
import { QuickPlaySessionDesktop, QuickPlaySessionMobile } from "@/components/portfolio/lite/QuickPlaySessionView";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import { PortfolioNotFound } from "@/components/portfolio/lite/PortfolioAsyncStates";
import { ArcadeShareCard } from "@/components/lite/arcade/ArcadeShareCard";
import type { ArcadeRunShare } from "@/pages/arcade/arcadeEngine";

const BACK_TO = "/portfolio?tab=settled";

export default function LiteQuickPlaySession() {
  const { sessionKey } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: sessions = [], isLoading } = useArcadeSessions();
  const calls = useArcadeSessionCalls(sessionKey);
  const [shareRun, setShareRun] = useState<ArcadeRunShare | null>(null);

  const session = sessions.find((s) => s.session_key === sessionKey);

  if (isLoading || !session) {
    // Missing key and somebody else's key render identically — the list is
    // scoped to the signed-in user, so a foreign key simply isn't there.
    const body = isLoading ? (
      <div className="px-4 py-10 text-center text-[13px] text-[#6B7280]">{t("common.loading")}</div>
    ) : (
      <PortfolioNotFound />
    );
    return isMobile ? (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader variant="inner" title="Quick Play" showBack backTo={BACK_TO} />
        <LiteAuthGate>{body}</LiteAuthGate>
        <BottomNav />
      </div>
    ) : (
      <div className="min-h-screen bg-background">
        <EventsDesktopHeader />
        <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
          <LiteAuthGate>{body}</LiteAuthGate>
        </div>
      </div>
    );
  }

  const vm = quickPlaySessionVM(session, calls.rows, { hasMore: calls.hasMore, loading: calls.loading });
  const canShare = !!user && session.calls > 0;
  const openShare = () => setShareRun(quickPlayShareRun(session));

  const actions = {
    backLabel: "Back to settled",
    onBack: () => navigate(BACK_TO),
    onOpenQuickPlay: () => navigate("/arcade"),
    onShare: canShare ? openShare : undefined,
    onLoadMore: calls.loadMore,
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader
          variant="inner"
          title="Quick Play"
          showBack
          backTo={BACK_TO}
          rightContent={
            canShare ? (
              <MobileHeaderIconButton aria-label={t("common.share")} onClick={openShare}>
                <Share2 className="h-[18px] w-[18px]" />
              </MobileHeaderIconButton>
            ) : undefined
          }
        />
        <LiteAuthGate>
          <QuickPlaySessionMobile vm={vm} actions={actions} />
        </LiteAuthGate>
        <ArcadeShareCard run={shareRun} onClose={() => setShareRun(null)} />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventsDesktopHeader />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
        <LiteAuthGate>
          <QuickPlaySessionDesktop vm={vm} actions={actions} />
        </LiteAuthGate>
        <ArcadeShareCard run={shareRun} onClose={() => setShareRun(null)} />
      </div>
    </div>
  );
}
