import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { ChevronDown, Gift } from "lucide-react";
import { MobileTradingLayout, TradingContextData } from "@/components/MobileTradingLayout";
import { TradeForm } from "@/components/TradeForm";
import { isSingleMarketBinary, getBinarySideLabels, getYesNoOptions } from "@/lib/eventUtils";
import { OrderCard } from "@/components/OrderCard";
import { PositionCard } from "@/components/PositionCard";
import { AirdropPositionCard } from "@/components/AirdropPositionCard";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import { useOrders } from "@/hooks/useOrders";
import { usePositions } from "@/hooks/usePositions";
import { useAnimatedOrderBook } from "@/hooks/useAnimatedOrderBook";
import { useTradeSideStore, tradeSideKey } from "@/stores/useTradeSideStore";


interface LocationState {
  tab?: string;
  highlightPosition?: number;
}

interface TradeOrderContentProps {
  selectedEvent: TradingContextData['selectedEvent'];
  selectedOptionData: TradingContextData['selectedOptionData'];
  options: TradingContextData['options'];
  setSelectedOption: TradingContextData['setSelectedOption'];
}


function TradeOrderContent({ selectedEvent, selectedOptionData, options, setSelectedOption }: TradeOrderContentProps) {
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  // Use unified hooks — /trade is futures-only, filter spot at hook boundary.
  const { orders: allOrders, isLoading: ordersLoading } = useOrders();
  const orders = useMemo(() => allOrders.filter((o) => (o.productLine ?? "futures") !== "spot"), [allOrders]);
  const { positions: allPositions, isLoading: positionsLoading } = usePositions();
  const positions = useMemo(() => allPositions.filter((p) => p.productLine !== "spot"), [allPositions]);
  const { pendingAirdrops, activateAirdrop, isActivating } = useAirdropPositions();
  const totalPositionCount = positions.length + pendingAirdrops.length;
  
  const [bottomTab, setBottomTab] = useState(state?.tab || "Orders");
  const [highlightedPosition, setHighlightedPosition] = useState<number | null>(state?.highlightPosition ?? null);

  // Shared side state — synced with /trade Charts page
  const sideKey = tradeSideKey(selectedEvent.id, selectedOptionData.id);
  const side = useTradeSideStore((s) => s.sideByKey[sideKey] ?? "buy");
  const setSideInStore = useTradeSideStore((s) => s.setSide);
  const setSide = (next: "buy" | "sell") => setSideInStore(sideKey, next);

  // Transform price for the order book based on side (Sell = 1 - p, asks/bids swap)
  const transformPrice = (price: string): string => {
    if (side === "buy") return price;
    const decimals = (price.split(".")[1] || "").length || 4;
    return Math.max(0, 1 - parseFloat(price)).toFixed(decimals);
  };
  const positionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabSectionRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToSection = useRef(false);

  // Scroll to positions section when coming from "View All"
  useEffect(() => {
    if (state?.tab === "Positions" && highlightedPosition === null && !hasScrolledToSection.current) {
      hasScrolledToSection.current = true;
      setTimeout(() => {
        if (tabSectionRef.current) {
          const headerOffset = 100; // Account for sticky header
          const elementPosition = tabSectionRef.current.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }, 100);
    }
  }, [state?.tab, highlightedPosition]);

  // Scroll to and highlight specific position when clicking a card
  useEffect(() => {
    if (highlightedPosition !== null && positionRefs.current[highlightedPosition]) {
      // Mark as scrolled to prevent the section scroll from triggering later
      hasScrolledToSection.current = true;
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = positionRefs.current[highlightedPosition];
        if (element) {
          const headerOffset = 200; // Account for sticky header and tab bar
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }, 100);
      
      // Clear highlight after animation
      const timer = setTimeout(() => {
        setHighlightedPosition(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedPosition]);

  // Use animated order book with live updates
  const orderBookData = useAnimatedOrderBook({
    basePrice: parseFloat(selectedOptionData.price),
    depth: 10,
    updateInterval: 500,
    volatility: 0.3,
  });

  return (
    <div className="pb-8 overflow-x-hidden">
      {/* Main Content Area - Two Column Layout */}
      <div className="flex w-full">
        {/* Left: Trade Form + Price Info */}
        <div className="flex-1 min-w-0 border-r border-border/30">
          {/* Market Stats Strip — single-line, compact units, never wraps */}
          <div className="px-3 py-1.5 border-b border-border/30 overflow-hidden">
            <div className="flex items-center justify-between gap-2 text-[10px] whitespace-nowrap font-mono tabular-nums">
              <span className="text-muted-foreground truncate">
                Vol <span className="font-medium text-foreground">{selectedEvent?.volume || "—"}</span>
              </span>
              <span className="text-muted-foreground truncate">
                OI <span className="font-medium text-foreground">$480K</span>
              </span>
              <span className="text-muted-foreground truncate">
                Funding <span className="font-medium text-trading-red">-0.01%</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="font-medium text-foreground">28m</span>
              </span>
            </div>
          </div>


          {/* Trade Form */}
          {(() => {
            const isBinary = isSingleMarketBinary(options);
            const labels = getBinarySideLabels(selectedEvent);
            const yn = getYesNoOptions(options);
            const yesPrice = yn.yes ? parseFloat(yn.yes.price) || 0 : 0;
            const noPrice = yn.no ? parseFloat(yn.no.price) || 0 : 0;
            const binaryMode = isBinary && yn.yes && yn.no
              ? {
                  yesLabel: labels.yes,
                  noLabel: labels.no,
                  yesPrice,
                  noPrice,
                  isYesSelected: selectedOptionData.id === yn.yes.id,
                  onSelectYes: () => { setSide("buy"); setSelectedOption(yn.yes!.id); },
                  onSelectNo: () => { setSide("buy"); setSelectedOption(yn.no!.id); },
                }
              : undefined;
            return (
              <TradeForm 
                selectedPrice={selectedOptionData.price} 
                eventName={selectedEvent?.name || ""}
                optionLabel={selectedOptionData.label}
                side={side}
                onSideChange={setSide}
                binaryMode={binaryMode}
                sideLabels={isBinary ? labels : null}
              />
            );
          })()}
        </div>

        {/* Right: Order Book — driven by trade form side */}
        <div className="w-[120px] flex-shrink-0">
          <div className="px-1.5 py-1.5">
            <div className="grid grid-cols-2 text-[9px] text-muted-foreground mb-1">
              <span>Price</span>
              <span className="text-right">Amount</span>
            </div>
          </div>
          
          {/* Asks (red, top): for sell-side view, source from bids and transform price */}
          <div className="overflow-y-auto scrollbar-hide">
            {(side === "buy" ? orderBookData.asks : orderBookData.bids).slice(0, 10).map((ask, index) => (
              <div
                key={`ask-${index}`}
                className="flex justify-between px-1.5 py-0.5 text-[10px]"
              >
                <span className="price-red">{transformPrice(ask.price)}</span>
                <span className="text-muted-foreground font-mono">{ask.amount}</span>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="px-1.5 py-1.5 text-center">
            <span className="text-sm font-bold font-mono">{transformPrice(selectedOptionData.price)}</span>
          </div>

          {/* Bids (green, bottom): for sell-side view, source from asks and transform price */}
          <div className="overflow-y-auto scrollbar-hide">
            {(side === "buy" ? orderBookData.bids : orderBookData.asks).slice(0, 10).map((bid, index) => (
              <div
                key={`bid-${index}`}
                className="flex justify-between px-1.5 py-0.5 text-[10px]"
              >
                <span className="price-green">{transformPrice(bid.price)}</span>
                <span className="text-muted-foreground font-mono">{bid.amount}</span>
              </div>
            ))}
          </div>

          {/* Depth Selector */}
          <div className="flex items-center justify-between px-1.5 py-1.5 border-t border-border/30 mt-1">
            <span className="text-[9px] text-muted-foreground">Depth</span>
            <button className="flex items-center gap-0.5 text-[10px]">
              0.1
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Orders/Positions Tabs */}
      <div ref={tabSectionRef} className="flex px-4 mt-2 border-b border-border/30 relative z-20">
        {["Orders", "Positions"].map((tab) => {
          const count = tab === "Orders" ? orders.length : totalPositionCount;
          return (
            <button
              key={tab}
              onClick={() => setBottomTab(tab)}
              className={`py-2 mr-6 text-sm font-medium transition-all flex items-center gap-1.5 ${
                bottomTab === tab
                  ? "text-trading-purple border-b-2 border-trading-purple"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className="bg-primary/20 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AuthGateOverlay title="Sign in to view positions" description="Log in or create an account to view and manage your trades." compact>
      <div className="px-4 py-3 space-y-3">
        {bottomTab === "Orders" && (
          ordersLoading ? (
            <div className="text-center text-muted-foreground py-4">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">No open orders</div>
          ) : (
            orders.map((order, index) => (
              <OrderCard 
                key={order.id || index} 
                {...order} 
              />
            ))
          )
        )}
        {bottomTab === "Positions" && (
          <>
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
                  <div 
                    key={index} 
                    ref={(el) => (positionRefs.current[index] = el)}
                    className={`transition-all duration-500 ${
                      highlightedPosition === index 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg" 
                        : ""
                    }`}
                  >
                    <PositionCard 
                      {...position}
                      size={position.size}
                      sizeDisplay={position.sizeDisplay}
                      optionId={position.optionId}
                      positionId={position.id}
                      positionIndex={index}
                      position={position}
                    />
                  </div>
                ))}
                {pendingAirdrops.map((airdrop) => (
                  <AirdropPositionCard key={airdrop.id} airdrop={airdrop} onActivate={activateAirdrop} isActivating={isActivating} />
                ))}
              </>
            )}
          </>
        )}
      </div>
      </AuthGateOverlay>
    </div>
  );
}

export default function TradeOrder() {
  return (
    <MobileTradingLayout activeTab="Trade">
      {(context) => (
        <TradeOrderContent 
          selectedEvent={context.selectedEvent} 
          selectedOptionData={context.selectedOptionData} 
          options={context.options}
          setSelectedOption={context.setSelectedOption}
        />
      )}
    </MobileTradingLayout>
  );
}
