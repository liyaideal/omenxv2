// Settlement row previews for Style Guide (Round 4B).
// MIRROR: uses production components exported from PortfolioSettlements.tsx —
// if you change the row layout there, the previews below update automatically.
// Also demos the SPOT badge treatments across resolved / list surfaces.

import { SettlementRowDesktop, SettlementRowMobile } from "@/pages/PortfolioSettlements";
import type { SettlementListItem } from "@/hooks/useSettlements";
import { ProductLineBadge } from "@/lib/productLineBadge";
import { ResolvedMarketCard } from "@/components/resolved/ResolvedMarketCard";
import { MarketCardB } from "@/components/events/MarketCardB";
import type { ResolvedEvent } from "@/hooks/useResolvedEvents";
import type { EventRow } from "@/hooks/useMarketListData";

const now = new Date().toISOString().split("T")[0];

const mkRow = (over: Partial<SettlementListItem>): SettlementListItem => ({
  id: "demo",
  event: "Will NVDA close up on 2026-07-22?",
  option: "Up",
  side: "long",
  entryPrice: "$0.5400",
  exitPrice: "$1.0000",
  size: "120",
  pnl: "+$55.20",
  pnlValue: 55.2,
  pnlPercent: "(+42.1%)",
  leverage: "5x",
  settledAt: now,
  result: "win",
  kind: "settled",
  productLine: "futures",
  ...over,
});

/** Futures · settled · win — leverage chip + Win badge. */
export const SettlementFuturesWinDesktopPreview = () => (
  <table className="w-full text-sm">
    <tbody>
      <SettlementRowDesktop settlement={mkRow({})} optionDisplay="Up" onOpen={() => {}} />
    </tbody>
  </table>
);

/** Spot · settled — SPOT badge + $1/$0 exit + Win/Loss chip. */
export const SettlementSpotSettledDesktopPreview = () => (
  <table className="w-full text-sm">
    <tbody>
      <SettlementRowDesktop
        settlement={mkRow({
          productLine: "spot",
          leverage: "SPOT",
          event: "NVDA · Up on 07-22",
        })}
        optionDisplay="Up"
        onOpen={() => {}}
      />
    </tbody>
  </table>
);

/** Spot · intraday close — no Win/Loss chip, PnL number is the only signal. */
export const SettlementSpotClosedDesktopPreview = () => (
  <table className="w-full text-sm">
    <tbody>
      <SettlementRowDesktop
        settlement={mkRow({
          productLine: "spot",
          leverage: "SPOT",
          kind: "closed",
          exitPrice: "$0.6720",
          pnl: "-$14.40",
          pnlValue: -14.4,
          pnlPercent: "(-22.2%)",
          result: "lose",
        })}
        optionDisplay="Up"
        onOpen={() => {}}
      />
    </tbody>
  </table>
);

export const SettlementFuturesWinMobilePreview = () => (
  <div className="space-y-2">
    <SettlementRowMobile settlement={mkRow({})} optionDisplay="Up" onOpen={() => {}} />
  </div>
);

export const SettlementSpotSettledMobilePreview = () => (
  <div className="space-y-2">
    <SettlementRowMobile
      settlement={mkRow({ productLine: "spot", leverage: "SPOT", event: "NVDA · Up on 07-22" })}
      optionDisplay="Up"
      onOpen={() => {}}
    />
  </div>
);

export const SettlementSpotClosedMobilePreview = () => (
  <div className="space-y-2">
    <SettlementRowMobile
      settlement={mkRow({
        productLine: "spot",
        leverage: "SPOT",
        kind: "closed",
        exitPrice: "$0.6720",
        pnl: "-$14.40",
        pnlValue: -14.4,
        pnlPercent: "(-22.2%)",
        result: "lose",
      })}
      optionDisplay="Up"
      onOpen={() => {}}
    />
  </div>
);

/** Product-line badge legend — three surfaces where SPOT appears. */
export const ProductLineBadgeLegendPreview = () => (
  <div className="space-y-2 text-xs text-muted-foreground">
    <div className="flex items-center gap-2">
      <ProductLineBadge line="spot" />
      <span>Row inline (Settlements · Transactions · Transparency · Resolved · Events list)</span>
    </div>
    <div className="flex items-center gap-2">
      <ProductLineBadge line="futures" />
      <span>Reserved for surfaces where both lines must coexist (Transactions row).</span>
    </div>
    <p className="text-[10px]">
      /spot terminal header keeps its neutral outline badge (§14 LOCKED) — do not swap.
    </p>
  </div>
);

/** /resolved card with SPOT badge — real ResolvedMarketCard, mock event. */
const spotResolvedEvent: ResolvedEvent = {
  id: "demo-spot-resolved",
  name: "Will NVDA close higher today?",
  category: "stocks",
  description: null,
  volume: "$248000",
  is_resolved: true,
  settled_at: new Date().toISOString(),
  winning_option_id: "opt-up",
  options: [
    { id: "opt-up", event_id: "demo-spot-resolved", label: "Up", price: 1, final_price: 1, is_winner: true },
    { id: "opt-down", event_id: "demo-spot-resolved", label: "Down", price: 0, final_price: 0, is_winner: false },
  ],
  sideLabels: undefined,
  productLines: ["spot"],
  userParticipated: true,
  userPnl: 46,
};

export const ResolvedMarketCardSpotPreview = () => (
  <div className="max-w-md">
    <ResolvedMarketCard event={spotResolvedEvent} />
  </div>
);

/** Search-results row with SPOT badge — real MarketCardB, mock EventRow. */
const spotSearchRow: EventRow = {
  id: "demo-spot-row",
  eventId: "demo-spot-row",
  eventName: "Will NVDA close higher today?",
  eventIcon: "📈",
  category: "stocks",
  categoryLabel: "Stocks",
  productLines: ["spot"],
  eventSubtype: "us_stock",
  lifecycleStatus: "ACTIVE",
  basePrice: 118.42,
  change1h: 0.4,
  change4h: 1.1,
  change24h: 2.6,
  volume1h: 12000,
  volume4h: 48000,
  volume24h: 248000,
  totalVolume: 248000,
  openInterest: 74000,
  expiry: new Date(Date.now() + 6 * 3600 * 1000),
  createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  isNew: false,
  isClosingSoon: true,
  topMarket: { label: "Up" },
  childCount: 2,
  children: [],
};

export const MarketSearchRowSpotPreview = () => (
  <div className="max-w-md">
    <MarketCardB
      market={spotSearchRow}
      isWatched={false}
      onToggleWatch={() => {}}
      chgTimeframe="24h"
    />
  </div>
);

