// ============================================================
// Settled-side share snapshots (CPO 2026-11-05).
//
// One poster component (LitePnlPoster, state "settled") serves every settled
// share; only the values differ. Single positions mirror the settlement
// detail page exactly; a series fills the same fields with its totals:
//   eventName  = series (event) name
//   sideLine   = "Won {wins} of {count} rounds"   (single: the side word)
//   pnl / ROI  = series price result before fees / (that ÷ total cost)
//   Put in     = total cost      Paid out = total cost + that result
//
// Posters never take fees off (CPO 2026-11-13): no trading fee, no winning
// commission — a share card is for sharing, not reconciling. The settled
// record (list, KPI, detail page) stays net of every fee.
//   date chip  = last settled round
//   link       = the event page (a series has no single settlement id)
// ============================================================
import { t } from "@/i18n";
import type { SettlementListItem } from "@/hooks/useSettlements";
import type { SeriesDetailVM } from "@/components/portfolio/lite/SeriesDetailView";
import type { LiteManualShareSnap } from "@/components/lite/share/LiteShareFlow";
import { legTitle, resolveLegSide } from "@/lib/liteSideName";
import { segmentFromProductLine } from "@/lib/liteTradePath";

/** Same numbers as LiteSettlementDetail's share snapshot: the price result before any fee (CPO 2026-11-13). */
export const singleSettlementShareSnap = (
  s: SettlementListItem,
  eventId?: string | null,
): LiteManualShareSnap => ({
  state: "settled",
  eventId: eventId ?? "",
  eventName: s.event,
  sideLine: legTitle(resolveLegSide({ option: s.option, type: s.side }, { side_labels: s.sideLabels })),
  pnl: s.pnlValue,
  pnlPercent: s.cost > 0 ? (s.pnlValue / s.cost) * 100 : 0,
  leftAmount: s.cost,
  rightAmount: Math.max(0, s.cost + s.pnlValue),
  segment: segmentFromProductLine(s.productLine),
  dateISO: s.closedAt,
  settlementId: s.id,
});

export const seriesShareSnap = (vm: SeriesDetailVM): LiteManualShareSnap => ({
  state: "settled",
  eventId: vm.eventId ?? "",
  eventName: vm.seriesName,
  sideLine: t("portfolio.lite.series.share_side_line", { wins: vm.wins, count: vm.rounds.length }),
  pnl: vm.net + vm.fees,
  pnlPercent: vm.cost > 0 ? ((vm.net + vm.fees) / vm.cost) * 100 : 0,
  leftAmount: vm.cost,
  rightAmount: Math.max(0, vm.cost + vm.net + vm.fees),
  segment: vm.segmentLabel === "Standard" ? "standard" : "boost",
  // rounds are newest-first
  dateISO: vm.rounds[0]?.closedAt,
  settlementId: null,
});
