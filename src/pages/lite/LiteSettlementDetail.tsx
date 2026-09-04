// ============================================================
// Lite settlement detail page (CPO v1.17 §4b/§4c).
// The page is a thin shell: data → view-model → the pure SettlementDetail
// views, which the style guide mounts with fixtures.
// Mobile: MobileHeader + BottomNav. Desktop: site header + standard container,
// no bottom nav.
// ============================================================
import { Share2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MobileHeader, MobileHeaderIconButton } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettlementDetail } from "@/hooks/useSettlementDetail";
import { useSettlements } from "@/hooks/useSettlements";
import { resolveLegSide, legTitle } from "@/lib/liteSideName";
import { liteTradePath, segmentFromProductLine } from "@/lib/liteTradePath";
import { fromState } from "@/lib/portfolioReturn";
import {
  SettlementDetailDesktop,
  SettlementDetailMobile,
  type SettlementDetailVM,
} from "@/components/portfolio/lite/SettlementDetailView";
import { LiteAuthGate } from "@/components/auth/LiteAuthGate";
import { PortfolioNotFound } from "@/components/portfolio/lite/PortfolioAsyncStates";
import {
  LiteManualShareCard,
  type LiteManualShareSnap,
} from "@/components/lite/share/LiteShareFlow";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function LiteSettlementDetail() {
  const { settlementId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [params] = useSearchParams();
  const fromSeries = params.get("series");
  const { data: s, isLoading } = useSettlementDetail({ settlementId });
  const { data: settlements = [] } = useSettlements();
  const { user } = useAuth();
  const [manualShare, setManualShare] = useState<LiteManualShareSnap | null>(null);

  // Always a determinate target — history-based back would bounce between this
  // page and the trade page reached via "View event".
  const backTo = fromSeries
    ? `/portfolio?tab=settled&series=${encodeURIComponent(fromSeries)}`
    : "/portfolio?tab=settled";

  if (isLoading || !s) {
    // Missing id and somebody else's id render IDENTICALLY — the detail query
    // is already scoped to the signed-in user, so an out-of-scope id lands here
    // and never leaks the other reader's event name or money.
    const body = isLoading ? (
      <div className="px-4 py-10 text-center text-[13px] text-[#6B7280]">Loading…</div>
    ) : (
      <PortfolioNotFound />
    );
    return isMobile ? (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader variant="inner" title="Settled" showBack backTo={backTo} />

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

  // Fees on the list row are pro-rated per position; the detail hook sums the
  // whole (event, option) ledger, which over-counts on shared series ledgers.
  const listRow = settlements.find((x) => x.id === s.id);
  const fees = listRow ? listRow.fees : s.fee;

  const vm: SettlementDetailVM = {
    eventName: s.event,
    eventId: s.eventId,
    closeReason: s.closeReason,
    net: s.pnl,
    cost: s.margin,
    fees,
    shares: s.size,
    avgPrice: s.entryPrice,
    exitPrice: s.exitPrice,
    leverage: s.leverage,
    sideWord: legTitle(resolveLegSide({ option: s.option, type: s.side }, { side_labels: s.sideLabels })),
    outcomeWon: s.outcomeWon,
    openedAt: s.openedAt,
    closedAt: s.settledAt,
    trades: s.trades.map((t) => ({
      id: t.id,
      time: t.time,
      action: t.action,
      total: t.total,
      price: t.price,
    })),
  };

  const shareSnap: LiteManualShareSnap = {
    state: "settled",
    eventId: s.eventId ?? "",
    eventName: s.event,
    sideLine: legTitle(resolveLegSide({ option: s.option, type: s.side }, { side_labels: s.sideLabels })),
    pnl: s.pnl,
    pnlPercent: s.margin > 0 ? (s.pnl / s.margin) * 100 : 0,
    leftAmount: s.margin,
    rightAmount: Math.max(0, s.margin + s.pnl - fees),
    segment: segmentFromProductLine(s.productLine),
    dateISO: s.settledAt,
    settlementId: settlementId ?? null,
  };

  const openShare = () => setManualShare(shareSnap);

  const actions = {
    backLabel: fromSeries ? "Back to series" : "Back to settled",
    onBack: () => navigate(backTo),

    onViewEvent: s.eventId
      ? () =>
          // The trade page back arrow returns to this settlement detail page.
          navigate(
            liteTradePath(s.eventId, segmentFromProductLine(s.productLine)),
            fromState(
              `/portfolio/settlement/${settlementId}${
                fromSeries ? `?series=${encodeURIComponent(fromSeries)}` : ""
              }`,
            ),
          )
      : undefined,
    onShare: user ? openShare : undefined,
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader
          variant="inner"
          title={s.event}
          showBack
          backTo={backTo}
          rightContent={
            user ? (
              <MobileHeaderIconButton aria-label="Share" onClick={openShare}>
                <Share2 className="h-[18px] w-[18px]" />
              </MobileHeaderIconButton>
            ) : undefined
          }
        />
        <LiteAuthGate>
          <SettlementDetailMobile vm={vm} actions={actions} />
        </LiteAuthGate>
        <LiteManualShareCard snap={manualShare} onClose={() => setManualShare(null)} />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventsDesktopHeader />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
        <LiteAuthGate>
          <SettlementDetailDesktop vm={vm} actions={actions} />
        </LiteAuthGate>
        <LiteManualShareCard snap={manualShare} onClose={() => setManualShare(null)} />
      </div>
    </div>
  );
}
