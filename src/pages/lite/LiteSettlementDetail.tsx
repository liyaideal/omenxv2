// ============================================================
// Lite settlement detail page (CPO v1.17 §4b/§4c).
// The page is a thin shell: data → view-model → the pure SettlementDetail
// views, which the style guide mounts with fixtures.
// Mobile: MobileHeader + BottomNav. Desktop: site header + standard container,
// no bottom nav.
// ============================================================
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { EventsDesktopHeader } from "@/components/EventsDesktopHeader";
import { BottomNav } from "@/components/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettlementDetail } from "@/hooks/useSettlementDetail";
import { useSettlements } from "@/hooks/useSettlements";
import { optionSideWord } from "@/lib/liteSideName";
import { liteTradePath, segmentFromProductLine } from "@/lib/liteTradePath";
import { fromState } from "@/lib/portfolioReturn";
import {
  SettlementDetailDesktop,
  SettlementDetailMobile,
  type SettlementDetailVM,
} from "@/components/portfolio/lite/SettlementDetailView";
import { LiteAuthGate } from "@/components/portfolio/lite/LiteAuthGate";

export default function LiteSettlementDetail() {
  const { settlementId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [params] = useSearchParams();
  const fromSeries = params.get("series");
  const { data: s, isLoading } = useSettlementDetail({ settlementId });
  const { data: settlements = [] } = useSettlements();

  // Always a determinate target — history-based back would bounce between this
  // page and the trade page reached via "View event".
  const backTo = fromSeries
    ? `/portfolio?tab=settled&series=${encodeURIComponent(fromSeries)}`
    : "/portfolio?tab=settled";

  if (isLoading || !s) {
    const body = (
      <div className="px-4 py-10 text-center text-[13px] text-[#6B7280]">
        {isLoading ? "Loading…" : "Not found"}
      </div>
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
    sideWord: optionSideWord(s.option, s.sideLabels),
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

  const actions = {
    backLabel: fromSeries ? "Back to series" : "Back to settled",
    onBack: () =>
      navigate(
        fromSeries
          ? `/portfolio?tab=settled&series=${fromSeries}`
          : "/portfolio?tab=settled",
      ),
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
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <MobileHeader variant="inner" title={s.event} />
        <LiteAuthGate>
          <SettlementDetailMobile vm={vm} actions={actions} />
        </LiteAuthGate>
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
      </div>
    </div>
  );
}
