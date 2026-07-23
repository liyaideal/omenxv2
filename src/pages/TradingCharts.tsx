import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Gift } from "lucide-react";
import { MobileTradingLayout, TradingContextData } from "@/components/MobileTradingLayout";
import { CandlestickChart } from "@/components/CandlestickChart";
import { OrderBook } from "@/components/OrderBook";
import { OrderCard } from "@/components/OrderCard";
import { PositionCard } from "@/components/PositionCard";
import { AirdropPositionCard } from "@/components/AirdropPositionCard";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import { usePositions } from "@/hooks/usePositions";
import { useOrders } from "@/hooks/useOrders";
import { useAnimatedOrderBook } from "@/hooks/useAnimatedOrderBook";
import { useAnimatedTradesHistory } from "@/hooks/useAnimatedTradesHistory";
import { tradingStats } from "@/lib/tradingUtils";
import { TRADING_TERMS } from "@/lib/tradingTerms";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTradeSideStore, tradeSideKey } from "@/stores/useTradeSideStore";
import { getBinarySideLabels, isSingleMarketBinary } from "@/lib/eventUtils";
import { ArrowRight } from "lucide-react";

const bottomTabs = ["Order Book", "Trades history", "Orders", "Positions"];

interface TradingChartsContentProps {
  selectedEvent: TradingContextData['selectedEvent'];
  selectedOptionData: TradingContextData['selectedOptionData'];
  options: TradingContextData['options'];
}

function TradingChartsContent({ selectedEvent, selectedOptionData, options }: TradingChartsContentProps) {
  const navigate = useNavigate();
  // /trade (mobile Charts) is futures-only — filter spot out at the hook boundary.
  const { positions: allPositions, isLoading: positionsLoading } = usePositions();
  const positions = useMemo(() => allPositions.filter((p) => p.productLine !== "spot"), [allPositions]);
  const { pendingAirdrops, activateAirdrop, isActivating } = useAirdropPositions();
  const { orders: allOrders, isLoading: ordersLoading } = useOrders();
  const orders = useMemo(() => allOrders.filter((o) => (o.productLine ?? "futures") !== "spot"), [allOrders]);
  const { profile } = useUserProfile();
  const totalPositionCount = positions.length + pendingAirdrops.length;

  const [bottomTab, setBottomTab] = useState("Order Book");

  // Shared side state (synced with /trade/order TradeForm)
  const sideKey = tradeSideKey(selectedEvent.id, selectedOptionData.id);
  const side = useTradeSideStore((s) => s.sideByKey[sideKey] ?? "buy");
  const setSide = useTradeSideStore((s) => s.setSide);

  // binary 单 market 别名（如体育队名）；非 binary 时回退 "Yes"/"No"
  const isBinary = isSingleMarketBinary(options);
  const sideLabels = getBinarySideLabels(selectedEvent);
  const yesLabel = isBinary ? sideLabels.yes : "Yes";
  const noLabel = isBinary ? sideLabels.no : "No";

  // Mirror price for sell perspective (Yes-only model: Sell = 1 - p)
  const longPrice = parseFloat(selectedOptionData.price);
  const shortPrice = +(1 - longPrice).toFixed(4);
  const displayPrice = side === "buy" ? longPrice : shortPrice;
  const decimals = (selectedOptionData.price.split(".")[1] || "").length || 4;
  const transformPrice = (price: string): string => {
    if (side === "buy") return price;
    const d = (price.split(".")[1] || "").length || decimals;
    return Math.max(0, 1 - parseFloat(price)).toFixed(d);
  };

  // Use animated order book with live updates (raw = buy-perspective)
  const orderBookData = useAnimatedOrderBook({
    basePrice: longPrice,
    depth: 8,
    updateInterval: 600,
    volatility: 0.25,
  });

  // For sell perspective: swap asks/bids and transform every price
  const displayAsks = useMemo(() => {
    const source = side === "buy" ? orderBookData.asks : orderBookData.bids;
    return source.map((row) => ({ ...row, price: transformPrice(row.price) }));
  }, [side, orderBookData.asks, orderBookData.bids]);
  const displayBids = useMemo(() => {
    const source = side === "buy" ? orderBookData.bids : orderBookData.asks;
    return source.map((row) => ({ ...row, price: transformPrice(row.price) }));
  }, [side, orderBookData.asks, orderBookData.bids]);

  // Use animated trades history with live updates (raw = buy-perspective)
  const { trades: tradesHistory, newTradeIndex } = useAnimatedTradesHistory({
    basePrice: longPrice,
    initialCount: 20,
    newTradeInterval: 1200,
  });

  // Calculate price change (mock) — based on the displayed price perspective
  const priceChange = useMemo(() => {
    const change = (Math.random() * 0.02 - 0.01).toFixed(4);
    const percentage = ((parseFloat(change) / displayPrice) * 100).toFixed(2);
    const isPositive = parseFloat(change) >= 0;
    return { change, percentage, isPositive };
  }, [displayPrice]);

  // Two-stage tap: 1st tap switches perspective, 2nd tap (on active side) jumps to order page
  const handleSideButtonClick = (clickedSide: "buy" | "sell") => {
    if (side !== clickedSide) {
      setSide(sideKey, clickedSide);
    } else {
      navigate(`/trade/order?event=${selectedEvent.id}`);
    }
  };

  const displayPriceStr = displayPrice.toFixed(decimals);

  return (
    <div className="pb-40">
      {/* Price + Stats Row - Horizontal Layout */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/20">
        {/* Left: Price Display */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight">{displayPriceStr}</span>
            <span className={`text-sm font-mono ${priceChange.isPositive ? "text-trading-green" : "text-trading-red"}`}>
              ({priceChange.isPositive ? "+" : ""}{priceChange.percentage}%)
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
            <span>{TRADING_TERMS.MARK_PRICE} {displayPriceStr}</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
              side === "buy"
                ? "bg-trading-green/15 text-trading-green"
                : "bg-trading-red/15 text-trading-red"
            )}>
              {side === "buy" ? yesLabel : noLabel}
            </span>
          </div>
        </div>

        {/* Right: Stats - Vertical Layout */}
        <div className="flex flex-col gap-1">
          {tradingStats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 text-right justify-end">
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              <span className={`font-mono text-xs font-semibold ${
                stat.isPositive ? "text-trading-green" : "text-foreground"
              }`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Candlestick Chart */}
      <div className="h-[450px]">
        <CandlestickChart basePrice={longPrice} side={side} />
      </div>

      {/* Bottom Tabs */}
      <div className="flex px-4 mt-2 border-b border-border/30">
        {bottomTabs.map((tab) => {
          const count = tab === "Orders" ? orders.length : tab === "Positions" ? totalPositionCount : null;
          return (
            <button
              key={tab}
              onClick={() => setBottomTab(tab)}
              className={`py-3 mr-4 text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                bottomTab === tab
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
              {count !== null && count > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {bottomTab === "Order Book" && (
        <OrderBook
          asks={displayAsks}
          bids={displayBids}
          currentPrice={displayPriceStr}
        />
      )}

      {bottomTab === "Trades history" && (
        <div className="px-4">
          {/* Header */}
          <div className="grid grid-cols-3 text-xs text-muted-foreground py-2">
            <span>Price (USDT)</span>
            <span className="text-center">Amount</span>
            <span className="text-right">Time</span>
          </div>
          {/* Trades List */}
          <div className="space-y-0">
            {tradesHistory.map((trade, index) => {
              // Mirror price by side; flip the buy/sell colour so a "sell-side" view
              // shows the action from the short trader's perspective (consistency with order book).
              const shownPrice = transformPrice(trade.price);
              const shownIsBuy = side === "buy" ? trade.isBuy : !trade.isBuy;
              return (
                <div
                  key={`${trade.time}-${index}`}
                  className={cn(
                    "grid grid-cols-3 text-xs py-1.5 transition-all duration-300",
                    index === newTradeIndex && (shownIsBuy
                      ? "bg-trading-green/25 animate-fade-in"
                      : "bg-trading-red/25 animate-fade-in"
                    )
                  )}
                >
                  <span className={cn(
                    "font-mono transition-all duration-200",
                    shownIsBuy ? "text-trading-green" : "text-trading-red",
                    index === newTradeIndex && "font-semibold"
                  )}>
                    {shownPrice}
                  </span>
                  <span className={cn(
                    "text-center font-mono transition-all duration-200",
                    index === newTradeIndex ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {trade.amount}
                  </span>
                  <span className={cn(
                    "text-right font-mono transition-all duration-200",
                    index === newTradeIndex ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {trade.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {bottomTab === "Orders" && (
        <div className="px-4 py-3 space-y-3">
          {ordersLoading ? (
            <div className="text-center text-muted-foreground py-4">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No open orders</div>
          ) : (
            orders.map((order, index) => (
              <OrderCard key={order.id || index} {...order} />
            ))
          )}
        </div>
      )}

      {bottomTab === "Positions" && (
        <div className="px-4 py-3 space-y-3">
          {/* Pending Airdrop Banner */}
          {pendingAirdrops.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-trading-yellow/10 border border-trading-yellow/20 mb-3">
              <Gift className="w-4 h-4 text-trading-yellow flex-shrink-0" />
              <span className="text-xs text-trading-yellow">
                🎁 You have {pendingAirdrops.length} airdrop{pendingAirdrops.length > 1 ? "s" : ""} pending activation — tap Activate to claim
              </span>
            </div>
          )}
          {positionsLoading ? (
            <div className="text-center text-muted-foreground py-4">Loading positions...</div>
          ) : positions.length === 0 && pendingAirdrops.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No open positions</div>
          ) : (
            <>
              {positions.map((position, index) => (
                <PositionCard
                  key={position.id}
                  {...position}
                  size={position.size}
                  sizeDisplay={position.sizeDisplay}
                  optionId={position.optionId}
                  positionId={position.id}
                  positionIndex={index}
                  position={position}
                />
              ))}
              {pendingAirdrops.map((airdrop) => (
                <AirdropPositionCard key={airdrop.id} airdrop={airdrop} onActivate={activateAirdrop} isActivating={isActivating} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Bottom Action Bar — two-stage tap */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 px-4 py-3 z-50">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
          <span>
            Available {profile?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'} USDC
          </span>
          <span className="opacity-70">
            Tap to switch view · tap again to trade
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSideButtonClick("buy")}
            aria-pressed={side === "buy"}
            className={cn(
              "flex-1 font-semibold rounded-lg py-2.5 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5",
              side === "buy"
                ? "bg-trading-green text-trading-green-foreground shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_3px_hsl(var(--trading-green)/0.4)]"
                : "bg-trading-green/15 text-trading-green border border-trading-green/30"
            )}
          >
            <span>{yesLabel}</span>
            {side === "buy" && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleSideButtonClick("sell")}
            aria-pressed={side === "sell"}
            className={cn(
              "flex-1 font-semibold rounded-lg py-2.5 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5",
              side === "sell"
                ? "bg-trading-red text-foreground shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_3px_hsl(var(--trading-red)/0.4)]"
                : "bg-trading-red/15 text-trading-red border border-trading-red/30"
            )}
          >
            <span>{noLabel}</span>
            {side === "sell" && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TradingCharts() {
  return (
    <MobileTradingLayout activeTab="Charts">
      {(context) => (
        <TradingChartsContent
          selectedEvent={context.selectedEvent}
          selectedOptionData={context.selectedOptionData}
          options={context.options}
        />
      )}
    </MobileTradingLayout>
  );
}
