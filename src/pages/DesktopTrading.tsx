import { useState, useMemo, useEffect, useRef } from "react"; // v2
import { useNavigate, useNavigationType, useSearchParams, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, Plus, ArrowLeftRight, Star, Info, Flag, Search, ExternalLink, X, Pencil, AlertTriangle, ArrowLeft, Loader2, Gift, Lock } from "lucide-react";
import { ExternalHedgeLinks } from "@/components/ExternalHedgeLinks";
import { EventInfoContent } from "@/components/EventInfoContent";
import { ExpiredEventFallback } from "@/components/ExpiredEventFallback";
import { useOrdersStore, Order } from "@/stores/useOrdersStore";
import { usePositions, UnifiedPosition } from "@/hooks/usePositions";
import { ClosePositionDialog } from "@/components/positions/ClosePositionDialog";
import { CloseVoucherDialog } from "@/components/positions/CloseVoucherDialog";
import { PositionDetailDialog } from "@/components/positions/PositionDetailDialog";
import { useOrders } from "@/hooks/useOrders";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CandlestickChart } from "@/components/CandlestickChart";
import { DesktopOrderBook } from "@/components/DesktopOrderBook";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { TRADING_TERMS } from "@/lib/tradingTerms";
import { calcLiqPrice } from "@/lib/tradingUtils";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useEvents } from "@/hooks/useEvents";
import { isSingleMarketBinary, getBinarySideLabels, getYesNoOptions, getBinaryOutcome } from "@/lib/eventUtils";
import { useEventSideLabelsLookup, resolveBinarySideLabel } from "@/hooks/useEventSideLabelsLookup";


import { useUserProfile } from "@/hooks/useUserProfile";
import { executeTrade } from "@/services/tradingService";
import { classifyOrderIntent, getIntentLabel } from "@/lib/positionIntent";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AccountRiskIndicator } from "@/components/AccountRiskIndicator";
import { useRealtimePositionsPnL } from "@/hooks/useRealtimePositionsPnL";
import { AuthGateOverlay } from "@/components/AuthGateOverlay";
import { useAirdropPositions } from "@/hooks/useAirdropPositions";
import { ActivateAirdropButton } from "@/components/ActivateAirdropButton";
import { Badge } from "@/components/ui/badge";
import { TradeSubmitButton } from "@/components/trading/TradeSubmitButton";

// Countdown hook
const useCountdown = (endTime: Date | undefined) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const difference = end - now;

      if (difference <= 0) {
        return "00:00:00";
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        return `${days}d ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return timeLeft;
};


const generateOrderBookData = (basePrice: number) => {
  const asks = [];
  const bids = [];
  
  let cumulativeAsk = 0;
  let cumulativeBid = 0;
  
  for (let i = 0; i < 12; i++) {
    const askPrice = (basePrice + 0.0005 * (i + 1)).toFixed(4);
    const bidPrice = (basePrice - 0.0005 * (i + 1)).toFixed(4);
    const askAmount = Math.floor(Math.random() * 50000 + 500).toString();
    const bidAmount = Math.floor(Math.random() * 50000 + 500).toString();
    
    cumulativeAsk += parseInt(askAmount);
    cumulativeBid += parseInt(bidAmount);
    
    asks.push({ 
      price: askPrice, 
      amount: parseInt(askAmount).toLocaleString(),
      total: cumulativeAsk.toLocaleString()
    });
    bids.push({ 
      price: bidPrice, 
      amount: parseInt(bidAmount).toLocaleString(),
      total: cumulativeBid.toLocaleString()
    });
  }
  
  return { asks, bids };
};

// mockOrders removed - now using useOrdersStore

// Format TP/SL display with unit
const formatTpSlDisplay = (value: string, mode: "%" | "$", isProfit: boolean) => {
  if (!value) return "";
  if (mode === "%") {
    return isProfit ? `+${value}%` : `-${value}%`;
  }
  return `$${value}`;
};

interface LocationState {
  tab?: string;
  highlightPosition?: number;
}

export default function DesktopTrading() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event") || undefined;
  
  // Show back button only if user navigated here (PUSH), not if they used bottom nav or direct URL
  const showBackButton = navigationType === "PUSH";
  
  
  // selectedOption is now managed by useEvents hook
  const [bottomTab, setBottomTab] = useState<"Orders" | "Positions">(
    locationState?.tab === "Positions" ? "Positions" : "Orders"
  );
  const [chartTab, setChartTab] = useState<"Chart" | "Event Info">("Chart");
  
  // Highlighted position state for scrolling and visual feedback
  const [highlightedPosition, setHighlightedPosition] = useState<number | null>(
    locationState?.highlightPosition ?? null
  );
  const positionRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  
  // Scroll to and highlight specific position when navigating from Portfolio
  useEffect(() => {
    if (highlightedPosition !== null && positionRowRefs.current[highlightedPosition]) {
      setTimeout(() => {
        const element = positionRowRefs.current[highlightedPosition];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      
      // Clear highlight after animation
      const timer = setTimeout(() => {
        setHighlightedPosition(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [highlightedPosition]);
  
  // Trade form state
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [marginType, setMarginType] = useState<"Cross" | "Isolated">("Cross");
  const [marginDropdownOpen, setMarginDropdownOpen] = useState(false);
  const [leverage, setLeverage] = useState(10);
  const [orderType, setOrderType] = useState<"Limit" | "Market">("Market");
  const [limitPrice, setLimitPrice] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [sliderValue, setSliderValue] = useState([0]);
  const [tpsl, setTpsl] = useState(false);
  // TP/SL states
  const [tpMode, setTpMode] = useState<"pct" | "price">("pct");
  const [slMode, setSlMode] = useState<"pct" | "price">("pct");
  const [tpValue, setTpValue] = useState("");
  const [slValue, setSlValue] = useState("");
  const [inputMode, setInputMode] = useState<"amount" | "qty">("amount");
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [orderPreviewOpen, setOrderPreviewOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "signup">("signup");
  
  // User profile for balance and auth
  const { user, balance, deductBalance, addBalance } = useUserProfile();
  
  // Positions and Orders state - using unified hooks (Supabase for logged-in, local for guests).
  // /trade is the futures cockpit — filter out spot rows at the hook boundary so every
  // downstream table/tab consumes futures-only data. Spot lives at /spot.
  const { positions: allPositions, partialClosePosition, closePosition, updatePositionTpSl: updateTpSlFn, isClosing, refetch: refetchPositions } = usePositions();
  const positions = useMemo(() => allPositions.filter((p) => p.productLine !== "spot"), [allPositions]);
  const { refetch: refetchOrders } = useOrders();
  
  // Realtime PnL calculation hook
  const { calculateRealtimePnL, formatPnL, formatMarkPrice } = useRealtimePositionsPnL();
  
  // Airdrop positions for banner and rows
  const { pendingAirdrops, activateAirdrop, isActivating } = useAirdropPositions();
  const totalPositionCount = positions.length + pendingAirdrops.length;
  
  // Position TP/SL edit state
  const [positionTpSlOpen, setPositionTpSlOpen] = useState(false);
  const [editingPositionIndex, setEditingPositionIndex] = useState<number | null>(null);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [positionTpValue, setPositionTpValue] = useState("");
  const [positionSlValue, setPositionSlValue] = useState("");
  const [positionTpMode, setPositionTpMode] = useState<"%" | "$">("$");
  const [positionSlMode, setPositionSlMode] = useState<"%" | "$">("$");
  
  
  // Cancel order dialog state - using unified orders hook (futures-only view)
  const { orders: allUnifiedOrders, cancelOrder: cancelUnifiedOrder, isCancelling } = useOrders();
  const unifiedOrders = useMemo(
    () => allUnifiedOrders.filter((o) => (o.productLine ?? "futures") !== "spot"),
    [allUnifiedOrders]
  );
  const { addOrder } = useOrdersStore(); // Keep for local guest fallback only
  const [cancelOrderOpen, setCancelOrderOpen] = useState(false);
  const [cancellingOrderIndex, setCancellingOrderIndex] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  
  const handleCancelOrderClick = (index: number, orderId?: string) => {
    setCancellingOrderIndex(index);
    setCancellingOrderId(orderId || null);
    setCancelOrderOpen(true);
  };
  
  const handleConfirmCancelOrder = async () => {
    if (cancellingOrderIndex !== null) {
      const order = unifiedOrders[cancellingOrderIndex];
      try {
        if (cancellingOrderId) {
          await cancelUnifiedOrder(cancellingOrderId);
        } else {
          await cancelUnifiedOrder(cancellingOrderIndex);
        }
        toast.success("Order Cancelled", {
          description: `Your ${order.type} order for ${order.option} has been cancelled.`,
        });
      } catch (error) {
        toast.error("Failed to cancel order");
      }
    }
    setCancelOrderOpen(false);
    setCancellingOrderIndex(null);
    setCancellingOrderId(null);
  };
  
  const handleEditPositionTpSl = (index: number, positionId: string) => {
    const position = positions[index];
    setEditingPositionIndex(index);
    setEditingPositionId(positionId);
    setPositionTpValue(position.tp || "");
    setPositionSlValue(position.sl || "");
    setPositionTpMode(position.tpMode || "%");
    setPositionSlMode(position.slMode || "%");
    setPositionTpSlOpen(true);
  };
  
  const handleSavePositionTpSl = async () => {
    if (editingPositionIndex !== null && editingPositionId !== null) {
      await updateTpSlFn(editingPositionId, editingPositionIndex, positionTpValue, positionSlValue, positionTpMode, positionSlMode);
    }
    const tpDisplay = positionTpValue ? (positionTpMode === "%" ? `+${positionTpValue}%` : `$${positionTpValue}`) : "Not set";
    const slDisplay = positionSlValue ? (positionSlMode === "%" ? `-${positionSlValue}%` : `$${positionSlValue}`) : "Not set";
    toast.success("TP/SL Updated", {
      description: `Take Profit: ${tpDisplay}, Stop Loss: ${slDisplay}`,
    });
    setPositionTpSlOpen(false);
    setEditingPositionIndex(null);
    setEditingPositionId(null);
  };
  
  const handleCancelPositionTpSl = () => {
    setPositionTpValue("");
    setPositionSlValue("");
    setPositionTpSlOpen(false);
    setEditingPositionIndex(null);
    setEditingPositionId(null);
  };
  
  // Use events hook
  const {
    isLoading,
    events,
    selectedEvent,
    setSelectedEvent,
    selectedOption,
    setSelectedOption,
    options,
    selectedOptionData,
    favorites,
    toggleFavorite: toggleFavoriteBase,
    searchQuery: eventSearchQuery,
    setSearchQuery: setEventSearchQuery,
    filteredEvents,
    getEventById,
    showFavoritesOnly,
    toggleShowFavoritesOnly,
  } = useEvents(eventId);
  
  const countdown = useCountdown(selectedEvent?.endTime);

  // Wrapper to update URL when switching events
  const handleEventSelect = (event: NonNullable<typeof selectedEvent>) => {
    setSelectedEvent(event);
    // Stay on /trade route (desktop renders here via TradingPage component)
    navigate(`/trade?event=${event.id}`, { replace: true });
  };

  const toggleFavorite = (eventId: string, e: React.MouseEvent) => {
    toggleFavoriteBase(eventId, e);
    if (favorites.has(eventId)) {
      toast.success("Removed from favorites");
    } else {
      toast.success("Added to favorites");
    }
  };
  
  const available = balance;
  const feeRate = 0.0005; // 0.05% trading fee

  
  
  const orderBookData = useMemo(() => {
    const basePrice = parseFloat(selectedOptionData.price);
    return generateOrderBookData(basePrice);
  }, [selectedOptionData.price]);

  const priceChange = useMemo(() => {
    const change = (Math.random() * 0.02 - 0.01).toFixed(4);
    const percentage = ((parseFloat(change) / parseFloat(selectedOptionData.price)) * 100).toFixed(2);
    const isPositive = parseFloat(change) >= 0;
    return { change, percentage, isPositive };
  }, [selectedOptionData.price]);

  // Yes/No asymmetric pricing: noPrice = 1 - yesPrice (underlying side stays long/short)
  const longPrice = useMemo(() => parseFloat(selectedOptionData.price) || 0, [selectedOptionData.price]);
  const shortPrice = useMemo(() => +(1 - longPrice).toFixed(4), [longPrice]);
  const sidePrice = side === "buy" ? longPrice : shortPrice;

  // Binary single-market 检测：折叠顶部 chip 行、Yes/No 按钮直连 option 切换
  const isBinarySingleMarket = useMemo(() => isSingleMarketBinary(options), [options]);
  const binaryLabels = useMemo(() => getBinarySideLabels(selectedEvent), [selectedEvent]);
  const yesNoOptions = useMemo(() => getYesNoOptions(options), [options]);
  const lookupSideLabels = useEventSideLabelsLookup();
  const yesPrice = useMemo(
    () => (yesNoOptions.yes ? parseFloat(yesNoOptions.yes.price) || 0 : longPrice),
    [yesNoOptions.yes, longPrice],
  );
  const noPrice = useMemo(
    () => (yesNoOptions.no ? parseFloat(yesNoOptions.no.price) || 0 : shortPrice),
    [yesNoOptions.no, shortPrice],
  );
  const isYesSelected = isBinarySingleMarket
    ? selectedOption === yesNoOptions.yes?.id
    : side === "buy";


  // Calculate order values based on amount and leverage
  const orderCalculations = useMemo(() => {
    const amountValue = parseFloat(amount) || 0;
    const price = sidePrice;

    // Notional value = amount * leverage
    const notionalValue = amountValue * leverage;

    // Margin required = notional value / leverage = amount (same as input)
    const marginRequired = amountValue;

    // Estimated fee = notional value * fee rate
    const estimatedFee = notionalValue * feeRate;

    // Total = margin required + fee
    const total = marginRequired + estimatedFee;

    // Quantity = notional value / price
    const quantity = price > 0 ? notionalValue / price : 0;

    // Potential win = (1 - price) * quantity (if outcome resolves in user's favor)
    const potentialWin = (1 - price) * quantity;

    // Estimated liquidation price - sell side moves opposite direction
    const liqPrice = price > 0
      ? (side === "buy"
          ? price * (1 - 1 / leverage * 0.9)
          : price * (1 + 1 / leverage * 0.9)
        ).toFixed(4)
      : "0.0000";

    return {
      notionalValue: notionalValue.toFixed(2),
      marginRequired: marginRequired.toFixed(2),
      estimatedFee: estimatedFee.toFixed(2),
      total: total.toFixed(2),
      quantity: quantity.toFixed(0),
      potentialWin: potentialWin.toFixed(0),
      liqPrice,
    };
  }, [amount, leverage, sidePrice, side]);

  const orderIntent = useMemo(() => classifyOrderIntent({
    positions,
    eventName: selectedEvent?.name || "",
    optionLabel: selectedOptionData.label,
    side,
    quantity: parseFloat(orderCalculations.quantity) || 0,
    clickedPrice: sidePrice,
    leverage,
  }), [positions, selectedEvent?.name, selectedOptionData.label, side, orderCalculations.quantity, sidePrice, leverage]);

  const displayCalculations = useMemo(() => {
    const estimatedFee = orderIntent.tradedNotional * feeRate;
    const total = orderIntent.incrementalMargin + estimatedFee;
    return {
      ...orderCalculations,
      notionalValue: orderIntent.tradedNotional.toFixed(2),
      marginRequired: orderIntent.incrementalMargin.toFixed(2),
      estimatedFee: estimatedFee.toFixed(2),
      total: total.toFixed(2),
    };
  }, [orderCalculations, orderIntent.tradedNotional, orderIntent.incrementalMargin]);

  // TP/SL calculations
  const currentPrice = sidePrice;

  const tpslCalculations = useMemo(() => {
    const tpPct = parseFloat(tpValue) || 0;
    const slPct = parseFloat(slValue) || 0;
    
    let tpPrice = 0;
    let slPrice = 0;
    
    if (tpMode === "pct") {
      tpPrice = side === "buy" 
        ? currentPrice * (1 + tpPct / 100)
        : currentPrice * (1 - tpPct / 100);
    } else {
      tpPrice = parseFloat(tpValue) || 0;
    }
    
    if (slMode === "pct") {
      slPrice = side === "buy"
        ? currentPrice * (1 - slPct / 100)
        : currentPrice * (1 + slPct / 100);
    } else {
      slPrice = parseFloat(slValue) || 0;
    }
    
    const amountValue = parseFloat(amount) || 0;
    const notionalValue = amountValue * leverage;
    const quantity = currentPrice > 0 ? notionalValue / currentPrice : 0;
    
    const tpPnL = side === "buy"
      ? (tpPrice - currentPrice) * quantity
      : (currentPrice - tpPrice) * quantity;
    
    const slPnL = side === "buy"
      ? (slPrice - currentPrice) * quantity
      : (currentPrice - slPrice) * quantity;
    
    return {
      tpPrice: tpPrice.toFixed(4),
      slPrice: slPrice.toFixed(4),
      tpPnL: tpPnL.toFixed(2),
      slPnL: slPnL.toFixed(2),
    };
  }, [tpValue, slValue, tpMode, slMode, side, currentPrice, amount, leverage]);

  // Binary 下方向由用户点击的 Yes/No option 决定（side 恒为 buy）；多 outcome 才看 side
  const previewOutcome: "yes" | "no" = isBinarySingleMarket
    ? (isYesSelected ? "yes" : "no")
    : (side === "buy" ? "yes" : "no");
  const previewSideLabel = resolveBinarySideLabel(previewOutcome, isBinarySingleMarket ? binaryLabels : undefined);
  const previewSideColor: "green" | "red" = previewOutcome === "yes" ? "green" : "red";
  // 单 market binary: Option 直接显示队名/别名（previewSideLabel），不再渲染独立 Side 行/chip
  // 多 outcome: Option 显示 option 名，Side 显示 Yes/No
  const previewOptionLabel = isBinarySingleMarket ? previewSideLabel : selectedOptionData.label;

  const orderDetails = useMemo(() => [
    { label: "Event", value: selectedEvent?.name || "" },
    { label: "Option", value: previewOptionLabel, highlight: isBinarySingleMarket ? previewSideColor : undefined },
    ...(isBinarySingleMarket ? [] : [{ label: "Side", value: previewSideLabel, highlight: previewSideColor }]),
    { label: "Margin type", value: marginType },
    { label: "Type", value: orderType },
    { label: "Order Price", value: `${sidePrice.toFixed(4)} USDC` },
    { label: "Order Cost", value: `${amount} USDC` },
    { label: "Traded notional", value: `${displayCalculations.notionalValue} USDC` },
    { label: "Opening notional", value: `${orderIntent.openingNotional.toFixed(2)} USDC` },
    { label: "Leverage", value: `${leverage}X` },
    { label: "Intent", value: orderIntent.kind.replace(/-/g, " ") },
    { label: "Margin required", value: `${displayCalculations.marginRequired} USDC` },
    { label: "TP/SL", value: tpsl ? `TP: ${tpValue ? tpslCalculations.tpPrice : '--'} / SL: ${slValue ? tpslCalculations.slPrice : '--'}` : "--" },
    { label: "Estimated Liq. Price", value: `${orderCalculations.liqPrice} USDC` },
  ], [selectedEvent, previewOptionLabel, isBinarySingleMarket, previewSideLabel, previewSideColor, marginType, orderType, amount, leverage, tpsl, tpValue, slValue, tpslCalculations, orderCalculations, displayCalculations, orderIntent.kind, orderIntent.openingNotional, sidePrice]);

  const isReducingOrder = orderIntent.kind === "reduce" || orderIntent.kind === "close";
  const formattedIntent = orderIntent.kind.replace(/-/g, " ");
  const previewTradeFields = useMemo(() => [
    { label: "Type", value: orderType },
    { label: "Margin", value: marginType },
    { label: "Leverage", value: `${leverage}X` },
    { label: "Price", value: `${sidePrice.toFixed(4)} USDC` },
  ], [orderType, marginType, leverage, sidePrice]);
  const previewNotionalFields = useMemo(() => [
    { label: "Order cost", value: `${amount} USDC` },
    { label: "Traded notional", value: `${displayCalculations.notionalValue} USDC` },
    { label: "Opening notional", value: `${orderIntent.openingNotional.toFixed(2)} USDC` },
    { label: "Margin required", value: `${displayCalculations.marginRequired} USDC`, highlight: true },
  ], [amount, displayCalculations.notionalValue, displayCalculations.marginRequired, orderIntent.openingNotional]);

  const handlePreview = () => {
    // Check if user is logged in first
    if (!user) {
      setAuthDefaultTab("signup");
      setAuthDialogOpen(true);
      return;
    }
    if (orderIntent.kind === "blocked-cross-zero") {
      toast.error("Close existing position first before opening the opposite side.");
      return;
    }
    setOrderPreviewOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedEvent) return;
    
    // Check if user is logged in
    if (!user) {
      setOrderPreviewOpen(false);
      setAuthDefaultTab("signup");
      setAuthDialogOpen(true);
      return;
    }
    
    const totalCost = parseFloat(displayCalculations.total) || 0;
    
    // Check balance
    if (balance < totalCost) {
      toast.error(`Insufficient balance. You need ${totalCost.toFixed(2)} USDC but only have ${balance.toFixed(2)} USDC.`);
      return;
    }
    
    setIsSubmittingOrder(true);
    
    try {
      // Execute trade in database
      const tradeData = {
        eventName: selectedEvent.name,
        optionLabel: selectedOptionData.label,
        optionId: selectedOptionData.id, // Direct reference for realtime price lookup
        side: side as "buy" | "sell",
        orderType: orderType as "Market" | "Limit",
        price: sidePrice || 0,
        amount: parseFloat(amount) || 0,
        quantity: parseInt(orderCalculations.quantity) || 0,
        leverage: leverage,
        margin: orderIntent.incrementalMargin,
        fee: parseFloat(displayCalculations.estimatedFee) || 0,
        tpValue: tpsl && tpValue ? parseFloat(tpslCalculations.tpPrice) : undefined,
        tpMode: tpsl && tpValue ? "$" as const : undefined,
        slValue: tpsl && slValue ? parseFloat(tpslCalculations.slPrice) : undefined,
        slMode: tpsl && slValue ? "$" as const : undefined,
      };

      const result = await executeTrade(user.id, tradeData);

      if (result.balanceDelta < 0) {
        const deducted = await deductBalance(Math.abs(result.balanceDelta));
        if (!deducted) throw new Error("Failed to deduct balance");
      } else if (result.balanceDelta > 0) {
        await addBalance(result.balanceDelta);
      }
      
      // Refetch based on order type
      if (orderType === "Market") {
        // Market orders execute immediately, refetch positions
        refetchPositions();
        toast.success("Order executed successfully!");
      } else {
        // Limit orders go to pending orders
        refetchOrders();
        toast.success("Limit order placed successfully!");
      }
      
      setOrderPreviewOpen(false);
      // Reset form
      setAmount("0.00");
      setSliderValue([0]);
      setTpValue("");
      setSlValue("");
      setTpsl(false);
    } catch (error: any) {
      console.error("Order execution error:", error);
      toast.error(error.message || "Failed to execute order");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  // No event found — check if URL has an expired/invalid event ID
  if (!selectedEvent) {
    if (eventId) {
      return <ExpiredEventFallback eventId={eventId} />;
    }
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="text-lg font-medium text-foreground">No events available</p>
          <p className="text-sm text-muted-foreground">Please check back later for new trading events.</p>
          <button 
            onClick={() => navigate("/")}
            className="text-primary hover:underline"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center gap-4 px-4 py-2 bg-background border-b border-border/30">
        {/* Back Button - only show if navigated here */}
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center transition-all duration-200 hover:bg-muted flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        
        <div className="flex items-center gap-3 flex-1 min-w-0 relative">
          {/* Event Dropdown Trigger */}
          <button 
            onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
            className="flex items-center gap-2 min-w-0 hover:bg-muted/30 rounded-lg p-1 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate">
                  {selectedEvent.name}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${eventDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span className="w-1.5 h-1.5 bg-trading-red rounded-full animate-pulse" />
                <span>Ends in</span>
                <span className="text-trading-red font-mono font-medium">{countdown}</span>
              </div>
            </div>
          </button>
          
          {/* Real-time Indicator Badge - Unified for all event types */}
          {(selectedEvent.tweetCount !== undefined || selectedEvent.currentPrice !== undefined) && (
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="flex items-center gap-2 px-3 py-1.5 bg-indicator/10 border border-indicator/30 rounded-lg hover:bg-indicator/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indicator rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                      {selectedEvent.currentPrice ? "Current Price" : "Current Tweets"}
                    </span>
                  </div>
                  <span className="text-sm text-indicator font-mono font-bold">
                    {selectedEvent.currentPrice || selectedEvent.tweetCount}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <div className="space-y-3">
                  {/* Header with title and value */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedEvent.currentPrice ? (selectedEvent.priceLabel || "Current Price") : "Tweet Count"}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indicator">
                        {selectedEvent.currentPrice || selectedEvent.tweetCount}
                      </div>
                      {selectedEvent.priceChange24h && (
                        <div className={`text-xs font-mono ${selectedEvent.priceChange24h.startsWith('+') ? 'text-trading-green' : 'text-trading-red'}`}>
                          {selectedEvent.priceChange24h} (24h)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Unified stats section - shows available fields */}
                  <div className="text-xs text-muted-foreground space-y-1 border-t border-border/30 pt-2">
                    {/* Period - always show */}
                    <div className="flex justify-between">
                      <span>Period</span>
                      <span>{selectedEvent.period}</span>
                    </div>
                    
                    {/* 24h stats - show if available */}
                    {selectedEvent.stats?.high24h && (
                      <div className="flex justify-between">
                        <span>24h High</span>
                        <span className="text-trading-green font-mono">{selectedEvent.stats.high24h}</span>
                      </div>
                    )}
                    {selectedEvent.stats?.low24h && (
                      <div className="flex justify-between">
                        <span>24h Low</span>
                        <span className="text-trading-red font-mono">{selectedEvent.stats.low24h}</span>
                      </div>
                    )}
                    {selectedEvent.stats?.volume24h && (
                      <div className="flex justify-between">
                        <span>24h Volume</span>
                        <span className="font-mono">{selectedEvent.stats.volume24h}</span>
                      </div>
                    )}
                    {selectedEvent.stats?.marketCap && (
                      <div className="flex justify-between">
                        <span>Market Cap</span>
                        <span className="font-mono">{selectedEvent.stats.marketCap}</span>
                      </div>
                    )}
                    
                    {/* Last updated - always show */}
                    <div className="flex justify-between">
                      <span>Last updated</span>
                      <span>Just now</span>
                    </div>
                  </div>
                  
                  {/* Source link */}
                  {selectedEvent.sourceUrl && (
                    <a
                      href={selectedEvent.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {selectedEvent.sourceName || "View Source"}
                    </a>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Event Dropdown */}
          {eventDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 bg-background border border-border rounded-lg shadow-xl w-[500px]">
              {/* Search Input */}
              <div className="p-3 border-b border-border/30">
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={eventSearchQuery}
                    onChange={(e) => setEventSearchQuery(e.target.value)}
                    placeholder={showFavoritesOnly ? "Search favorites..." : "Search events..."}
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                  <button
                    onClick={toggleShowFavoritesOnly}
                    className="p-1 rounded hover:bg-muted/50 transition-colors"
                    title={showFavoritesOnly ? "Show all events" : "Show favorites only"}
                  >
                    <Star className={`w-4 h-4 transition-colors ${
                      showFavoritesOnly 
                        ? "text-trading-yellow fill-trading-yellow" 
                        : "text-muted-foreground hover:text-trading-yellow"
                    }`} />
                  </button>
                </div>
                {showFavoritesOnly && (
                  <div className="mt-2 text-xs text-trading-yellow flex items-center gap-1">
                    <Star className="w-3 h-3 fill-trading-yellow" />
                    Showing favorites only ({filteredEvents.length})
                  </div>
                )}
              </div>

              {/* Events List Header */}
              <div className="grid grid-cols-3 text-xs text-muted-foreground px-4 py-2 border-b border-border/30">
                <span>Event</span>
                <span className="text-right">End Date</span>
                <span className="text-right">Volume</span>
              </div>

              {/* Events List */}
              <div className="max-h-[300px] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    {showFavoritesOnly ? (
                      <>
                        <Star className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground mb-1">No favorites yet</p>
                        <p className="text-xs text-muted-foreground/70">
                          Click the star icon next to events to add them to your favorites
                        </p>
                        <button
                          onClick={toggleShowFavoritesOnly}
                          className="mt-3 text-xs text-primary hover:underline"
                        >
                          View all events
                        </button>
                      </>
                    ) : (
                      <>
                        <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No events found</p>
                        <p className="text-xs text-muted-foreground/70">
                          Try a different search term
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => {
                        handleEventSelect(event);
                        setEventDropdownOpen(false);
                        setEventSearchQuery("");
                      }}
                      className={`w-full grid grid-cols-3 items-center px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedEvent.id === event.id ? "bg-muted/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => toggleFavorite(event.id, e)}
                          className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <Star 
                            className={`w-4 h-4 transition-colors ${
                              favorites.has(event.id) 
                                ? "text-trading-yellow fill-trading-yellow" 
                                : "text-muted-foreground hover:text-trading-yellow"
                            }`} 
                          />
                        </button>
                        <span className="text-sm font-medium truncate">{event.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground text-right">{event.ends}</span>
                      <span className="text-xs font-mono text-right">{event.volume}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <div className="text-muted-foreground">24h Volume</div>
            <div className="font-mono font-medium">$2.45M</div>
          </div>
          <div>
            <div className="text-muted-foreground">OI</div>
            <div className="font-mono font-medium">$480K</div>
          </div>
          <div>
            <div className="text-muted-foreground">Funding Rate</div>
            <div className="font-mono font-medium text-trading-green">+0.05%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Next Funding</div>
            <div className="font-mono font-medium">28min</div>
          </div>
        </div>
        
        {/* Favorite Star - Far right */}
        <button 
          onClick={(e) => toggleFavorite(selectedEvent.id, e)}
          className="p-2 rounded-md hover:bg-muted/50 transition-colors flex-shrink-0"
        >
          <Star 
            className={`w-5 h-5 transition-colors cursor-pointer ${
              favorites.has(selectedEvent.id) 
                ? "text-trading-yellow fill-trading-yellow" 
                : "text-muted-foreground hover:text-trading-yellow"
            }`} 
          />
        </button>

      </header>

      {/* Option Chips Row — 单 market binary 不渲染（对阵信息已在标题+Yes/No 切换器表达）；多 outcome 才显示 chip 切换 */}
      {!isBinarySingleMarket && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-muted-foreground flex-shrink-0">Select Option:</span>
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedOption === option.id
                  ? "bg-trading-purple/20 border border-trading-purple text-foreground"
                  : "bg-muted border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{option.label}</span>
              <span className={`ml-2 font-mono ${selectedOption === option.id ? "text-trading-purple" : ""}`}>
                ${option.price}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Section: Chart + Order Book + Positions */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top: Chart + Order Book (separate containers, tops aligned) */}
          {/* min-h matches the right Trade panel natural height so OrderBook stretches and bottoms align */}
          <div className="flex items-stretch min-h-[680px] gap-1 p-1">
            {/* Chart Area or Event Info - separate container */}
            <div className="flex-1 flex flex-col min-w-0 bg-background rounded border border-border/30">
              {/* Chart / Event Info Tabs */}
              <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30">
                {(["Chart", "Event Info"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setChartTab(tab)}
                    className={`text-sm font-medium transition-all ${
                      chartTab === tab
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {chartTab === "Chart" ? (
                <>
                  <div className="flex items-center gap-4 px-4 py-2 border-b border-border/30">
                    <span className="text-2xl font-bold font-mono">{sidePrice.toFixed(4)}</span>
                    <span className={`text-sm font-mono ${priceChange.isPositive ? "text-trading-green" : "text-trading-red"}`}>
                      {priceChange.isPositive ? "+" : ""}{priceChange.percentage}%
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-trading-yellow font-mono flex items-center gap-1 cursor-help border-b border-dashed border-trading-yellow">
                            <Flag className="w-3 h-3" /> {sidePrice.toFixed(4)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[280px] p-3">
                          <p className="text-sm">Mark price is derived by index price and funding rate, and reflects the fair market price. Liquidation is triggered by mark price.</p>
                          <p className="text-sm text-trading-yellow mt-2 cursor-pointer">Click here for details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex-1 min-h-0">
                    <CandlestickChart remainingDays={7} basePrice={parseFloat(selectedOptionData.price)} side={side} />
                  </div>
                </>
              ) : (
                <div className="flex-1 p-6 overflow-auto">
                  <EventInfoContent event={selectedEvent} />
                </div>
              )}
            </div>

            {/* Order Book - separate container, flex-col so child h-full stretches */}
            <div className="w-[280px] flex-shrink-0 flex flex-col bg-background rounded border border-border/30 overflow-hidden">
              <DesktopOrderBook 
                asks={orderBookData.asks}
                bids={orderBookData.bids}
                currentPrice={selectedOptionData.price}
                priceChange={selectedOptionData.price}
                isPositive={priceChange.isPositive}
                side={side}
                onPriceClick={(price) => {
                  setLimitPrice(price);
                  setOrderType("Limit");
                }}
              />
            </div>
          </div>

          {/* Bottom: Positions Panel */}
          <div className="border-t border-border/30 flex-shrink-0">
            <div className="flex items-center gap-1 px-4 border-b border-border/30 relative z-20">
              {(["Positions", "Current Orders"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab === "Current Orders" ? "Orders" : "Positions")}
                  className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    (bottomTab === "Orders" && tab === "Current Orders") || 
                    (bottomTab === "Positions" && tab === "Positions")
                      ? "text-trading-purple border-b-2 border-trading-purple"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                  <span className="ml-1 text-muted-foreground">
                    ({tab === "Current Orders" ? unifiedOrders.length : totalPositionCount})
                  </span>
                </button>
              ))}
            </div>

            <AuthGateOverlay title="Sign in to view positions" description="Log in or create an account to view and manage your trades.">
            <div className="max-h-[460px] overflow-y-auto overscroll-contain">
              {bottomTab === "Orders" && (
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr className="border-b border-border/30">
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-left">{TRADING_TERMS.CONTRACTS}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-left">{TRADING_TERMS.SIDE}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-left">{TRADING_TERMS.ORDER_TYPE}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.PRICE}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.QTY}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.VALUE}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-left">{TRADING_TERMS.STATUS}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-left">{TRADING_TERMS.TIME}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-center">{TRADING_TERMS.ACTION}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-6 text-center text-sm text-muted-foreground">No open orders</td>
                      </tr>
                    ) : (
                      unifiedOrders.map((order, index) => {
                        const orderOutcome = getBinaryOutcome(order.option);
                        const orderLabelColor = orderOutcome === "yes"
                          ? "text-trading-green"
                          : orderOutcome === "no"
                          ? "text-trading-red"
                          : "text-foreground";
                        const orderDisplay = (order as any).displayOption ?? order.option;
                        return (
                        <tr key={index} className="border-b border-border/30 hover:bg-muted/20">
                          <td className="px-4 py-2">
                            <div className={`text-sm font-medium ${orderLabelColor}`}>{orderDisplay}</div>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="text-xs text-muted-foreground truncate max-w-[180px] cursor-help border-b border-dashed border-transparent hover:border-muted-foreground inline-block">
                                  {order.event}
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-72 p-3" side="bottom" align="start">
                                <p className="text-sm font-medium mb-2">{order.event}</p>
                                <button 
                                  onClick={() => {
                                    const event = events.find(e => e.name === order.event);
                                    if (event) {
                                      handleEventSelect(event);
                                      setEventDropdownOpen(false);
                                    }
                                  }}
                                  className="text-sm text-primary flex items-center gap-1.5 hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Go to this event
                                </button>
                              </HoverCardContent>
                            </HoverCard>
                          </td>
                          <td className="px-4 py-2">
                            {orderOutcome ? (
                              <span className="text-muted-foreground/40">—</span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.type === "buy" ? "bg-trading-green/20 text-trading-green" : "bg-trading-red/20 text-trading-red"}`}>
                                {resolveBinarySideLabel(
                                  order.type === "buy" ? "yes" : "no",
                                  lookupSideLabels(order.event).labels
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">{order.orderType}</td>
                          <td className="px-4 py-2 text-sm font-mono text-right">{order.price}</td>
                          <td className="px-4 py-2 text-sm font-mono text-right">{order.amount}</td>
                          <td className="px-4 py-2 text-sm font-mono text-right">{order.total}</td>
                          <td className="px-4 py-2">
                            {order.status === "Partial Filled" ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="px-2 py-0.5 rounded text-xs bg-trading-yellow/20 text-trading-yellow cursor-help">
                                      {order.status}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="p-2">
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Filled:</span>
                                        <span className="font-mono text-trading-green">{order.filledAmount}</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Remaining:</span>
                                        <span className="font-mono text-trading-yellow">{order.remainingAmount}</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-muted rounded overflow-hidden mt-1">
                                        <div 
                                          className="h-full bg-trading-green" 
                                          style={{ 
                                            width: `${(parseInt(order.filledAmount?.replace(/,/g, '') || '0') / parseInt(order.amount.replace(/,/g, '')) * 100)}%` 
                                          }} 
                                        />
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{order.status}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{order.time}</td>
                          <td className="px-4 py-2 text-center">
                            <button 
                              onClick={() => handleCancelOrderClick(index)}
                              className="px-3 py-1 text-xs text-trading-red border border-trading-red/50 rounded hover:bg-trading-red/10"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {bottomTab === "Positions" && (
                <>
                {/* Pending Airdrop Banner */}
                {pendingAirdrops.length > 0 && (
                  <div className="mx-4 mt-2 mb-1 px-3 py-2 rounded-lg bg-trading-yellow/10 border border-trading-yellow/30 flex items-center gap-2">
                    <span className="text-sm">🎁</span>
                    <span className="text-xs text-trading-yellow">
                      You have {pendingAirdrops.length} airdrop{pendingAirdrops.length > 1 ? "s" : ""} pending activation — click Activate to claim
                    </span>
                  </div>
                )}
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr className="border-b border-border/30">
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-left">{TRADING_TERMS.CONTRACTS}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-left">{TRADING_TERMS.SIDE}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.QTY}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.ENTRY_PRICE}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.MARK_PRICE}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.LIQ_PRICE}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.MARGIN}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-right">{TRADING_TERMS.UNREALIZED_PNL}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-left">{TRADING_TERMS.LEVERAGE_FULL}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-center">{TRADING_TERMS.TPSL}</th>
                      <th className="px-4 py-2 text-xs text-muted-foreground font-normal text-center">{TRADING_TERMS.ACTION}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.length === 0 && pendingAirdrops.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-6 text-center text-sm text-muted-foreground">No open positions</td>
                      </tr>
                    ) : (
                      <>
                      {positions.map((position, index) => {
                        // Calculate realtime PnL
                        const realtimePnL = calculateRealtimePnL(position);
                        const { pnlStr, pnlPercentStr } = formatPnL(realtimePnL.pnl, realtimePnL.pnlPercent);
                        const displayMarkPrice = realtimePnL.hasRealtimePrice 
                          ? formatMarkPrice(realtimePnL.markPrice) 
                          : position.markPrice;
                        const isProfitable = realtimePnL.pnl >= 0;
                        
                        return (
                        <tr 
                          key={index} 
                          ref={(el) => (positionRowRefs.current[index] = el)}
                          className={`border-b border-border/30 hover:bg-muted/20 transition-all duration-500 ${
                            highlightedPosition === index 
                              ? "ring-2 ring-primary ring-inset bg-primary/10" 
                              : ""
                          }`}
                        >
                          {(() => {
                            const outcome = getBinaryOutcome(position.option);
                            const contractColorClass = outcome === "yes"
                              ? "text-trading-green hover:text-trading-green/80 border-trading-green/40 hover:border-trading-green"
                              : outcome === "no"
                              ? "text-trading-red hover:text-trading-red/80 border-trading-red/40 hover:border-trading-red"
                              : "hover:text-primary border-muted-foreground hover:border-foreground";
                            return (
                              <>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-1.5 flex-nowrap">
                                    {position.isAirdrop && (
                                      <span className="inline-flex items-center gap-0.5 bg-primary/20 text-primary border border-primary/30 text-[9px] font-semibold px-1 py-px rounded whitespace-nowrap flex-shrink-0">
                                        <Gift className="w-2.5 h-2.5" />
                                        AIRDROP
                                      </span>
                                    )}
                                    <PositionDetailDialog
                                      position={position}
                                      liveMarkPrice={realtimePnL.hasRealtimePrice ? realtimePnL.markPrice : undefined}
                                    >
                                      <button
                                        type="button"
                                        className={`text-sm font-medium truncate border-b border-dashed transition-colors text-left cursor-pointer ${contractColorClass}`}
                                        title="View position details"
                                      >
                                        {position.displayOption ?? position.option}
                                      </button>
                                    </PositionDetailDialog>
                                  </div>
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <div className="text-xs text-muted-foreground truncate max-w-[180px] cursor-help border-b border-dashed border-transparent hover:border-muted-foreground inline-block">
                                        {position.event}
                                      </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-72 p-3" side="bottom" align="start">
                                      <p className="text-sm font-medium mb-2">{position.event}</p>
                                      <a
                                        href="#"
                                        className="text-sm text-primary flex items-center gap-1.5 hover:underline"
                                        onClick={(e) => e.preventDefault()}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Go to this event
                                      </a>
                                    </HoverCardContent>
                                  </HoverCard>
                                </td>
                                <td className="px-4 py-2">
                                  {outcome ? (
                                    <span className="text-xs text-muted-foreground/40">—</span>
                                  ) : (
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        position.type === "long"
                                          ? "bg-trading-green/20 text-trading-green"
                                          : "bg-trading-red/20 text-trading-red"
                                      }`}
                                    >
                                      {resolveBinarySideLabel(
                                        position.type === "long" ? "yes" : "no",
                                        lookupSideLabels(position.event).labels
                                      )}
                                    </span>
                                  )}
                                </td>
                              </>
                            );
                          })()}
                          <td className="px-4 py-2 text-sm font-mono text-right">{position.sizeDisplay}</td>
                          <td className="px-4 py-2 text-sm font-mono text-right">{position.entryPrice}</td>
                          <td className="px-4 py-2 text-sm font-mono text-right">{displayMarkPrice}</td>
                          <td className="px-4 py-2 text-sm font-mono text-right" title="Estimated, ignores funding and MM buffer">{calcLiqPrice(position.entryPrice, position.leverage, position.type)}</td>
                          <td className="px-4 py-2 text-sm font-mono text-right">{position.margin}</td>
                          <td className="px-4 py-2 text-right">
                            <span className={`text-sm font-mono ${isProfitable ? "text-trading-green" : "text-trading-red"}`}>{pnlStr}</span>
                            <span className={`text-xs ml-1 ${isProfitable ? "text-trading-green" : "text-trading-red"}`}>({pnlPercentStr})</span>
                          </td>
                          <td className="px-4 py-2 text-sm">{position.leverage}</td>
                          <td className="px-4 py-2 text-center">
                            {position.isAirdrop ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center justify-center text-muted-foreground mx-auto"><Lock className="w-3.5 h-3.5" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent><p className="text-xs">{position.airdropSource === "voucher" ? "Voucher positions don't support TP/SL. Close manually within the hold window." : "Airdrop positions auto-settle on event resolution"}</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                            <button
                              onClick={() => handleEditPositionTpSl(index, position.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors group mx-auto"
                            >
                              {position.tp || position.sl ? (
                                <span className="text-xs">
                                  {position.tp && <span className="text-trading-green">{formatTpSlDisplay(position.tp, position.tpMode, true)}</span>}
                                  {position.tp && position.sl && " / "}
                                  {position.sl && <span className="text-trading-red">{formatTpSlDisplay(position.sl, position.slMode, false)}</span>}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Add</span>
                              )}
                              <Pencil className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                            </button>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {position.isAirdrop && position.airdropSource !== "voucher" ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : position.airdropSource === "voucher" ? (
                            <CloseVoucherDialog
                              event={position.event}
                              optionLabel={position.displayOption ?? position.option}
                              side={position.type}
                              entryPrice={parseFloat(position.entryPrice.replace(/[$,]/g, "")) || 0}
                              markPrice={
                                realtimePnL.hasRealtimePrice
                                  ? realtimePnL.markPrice
                                  : parseFloat(position.markPrice.replace(/[$,]/g, "")) || 0
                              }
                              faceValue={position.voucherFaceValue ?? position.marginNum}
                              redeemableCap={position.voucherRedeemableCap ?? null}
                              isClosing={isClosing}
                              onConfirm={() => closePosition(position.id, index)}
                            >
                              <button className="px-3 py-1 text-xs text-foreground border border-border/50 rounded hover:bg-muted">
                                Close
                              </button>
                            </CloseVoucherDialog>
                            ) : (
                            <ClosePositionDialog
                              event={position.event}
                              option={position.displayOption ?? position.option}
                              side={position.type}
                              size={Number(position.size) || 0}
                              entryPrice={parseFloat(position.entryPrice.replace(/[$,]/g, "")) || 0}
                              markPrice={
                                realtimePnL.hasRealtimePrice
                                  ? realtimePnL.markPrice
                                  : parseFloat(position.markPrice.replace(/[$,]/g, "")) || 0
                              }
                              margin={parseFloat(position.margin.replace(/[$,]/g, "")) || 0}
                              leverage={position.leverage}
                              fullCloseOnly={position.isAirdrop}
                              isClosing={isClosing}
                              onConfirm={(qty) => partialClosePosition(position.id, index, qty)}
                            >
                              <button className="px-3 py-1 text-xs text-foreground border border-border/50 rounded hover:bg-muted">
                                Close
                              </button>
                            </ClosePositionDialog>
                            )}
                          </td>

                        </tr>
                        );
                      })}
                      {/* Pending Airdrop Rows */}
                      {pendingAirdrops.map((airdrop) => (
                        <tr key={`airdrop-pending-${airdrop.id}`} className="border-b border-border/30 bg-trading-yellow/5">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5 flex-nowrap">
                              <span className="inline-flex items-center gap-0.5 bg-trading-yellow/20 text-trading-yellow border border-trading-yellow/30 text-[9px] font-semibold px-1 py-px rounded whitespace-nowrap flex-shrink-0">
                                <Gift className="w-2.5 h-2.5" />
                                PENDING
                              </span>
                              <span className="text-sm font-medium truncate">{airdrop.counterOptionLabel}</span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {airdrop.counterEventName}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${airdrop.counterSide === "long" ? "bg-trading-green/20 text-trading-green" : "bg-trading-red/20 text-trading-red"}`}>
                              {resolveBinarySideLabel(airdrop.counterSide === "long" ? "yes" : "no", lookupSideLabels(airdrop.counterEventName).labels)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-mono text-right text-muted-foreground">--</td>
                          <td className="px-4 py-2 text-sm font-mono text-right">${airdrop.counterPrice.toFixed(4)}</td>
                          <td className="px-4 py-2 text-sm font-mono text-right text-muted-foreground">--</td>
                          <td className="px-4 py-2 text-sm font-mono text-right text-muted-foreground">--</td>
                          <td className="px-4 py-2 text-sm font-mono text-right">${airdrop.airdropValue.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-xs text-trading-yellow">Activate to claim</td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">--</td>
                          <td className="px-4 py-2 text-center text-xs text-muted-foreground">--</td>
                          <td className="px-4 py-2 text-center">
                            <ActivateAirdropButton
                              expiresAt={airdrop.expiresAt}
                              onClick={() => activateAirdrop(airdrop.id)}
                              isActivating={isActivating}
                              variant="trading"
                            />
                          </td>
                        </tr>
                      ))}
                      </>
                    )}
                  </tbody>
                </table>
                </>
              )}
            </div>
            </AuthGateOverlay>
          </div>
        </div>

        {/* Right Section: Trade Form + Account Risk - separate containers, no internal scroll */}
        <div className="w-[280px] flex-shrink-0 flex flex-col gap-2 m-1 overflow-y-auto">
          {/* Trade Panel - always fully expanded, no internal scroll */}
          <div className="flex flex-col bg-background rounded-lg border border-border/50 flex-shrink-0">
            <div className="flex items-center px-4 py-2 border-b border-border/30">
              <span className="text-sm font-medium">Trade</span>
            </div>

            <div className="px-4 py-3 space-y-3">
            {/* Yes/No Toggle — v3 双层结构（队名 + 底部独立价格条），与 TradeForm 一致 */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-lg">
              <button
                onClick={() => {
                  setSide("buy");
                  if (isBinarySingleMarket && yesNoOptions.yes) {
                    setSelectedOption(yesNoOptions.yes.id);
                  }
                }}
                className="relative flex flex-col h-full rounded-md overflow-hidden transition-all"
              >
                <div
                  className={`relative flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2 text-[11px] font-semibold leading-tight line-clamp-2 text-center transition-colors ${
                    isYesSelected
                      ? "bg-trading-green text-trading-green-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {binaryLabels.yes}
                  {isYesSelected && (
                    <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-current shadow-[0_0_4px_currentColor]" />
                  )}
                </div>
                <div
                  className={`h-[22px] flex items-center justify-center text-[11px] font-mono border-t ${
                    isYesSelected
                      ? "bg-trading-green/85 text-trading-green-foreground border-black/20"
                      : "bg-muted-foreground/15 text-foreground/80 border-border/40"
                  }`}
                >
                  {yesPrice.toFixed(4)}
                </div>
              </button>
              <button
                onClick={() => {
                  if (isBinarySingleMarket && yesNoOptions.no) {
                    // binary 模式：Buy No 是 No 端的 long 仓位
                    setSide("buy");
                    setSelectedOption(yesNoOptions.no.id);
                  } else {
                    setSide("sell");
                  }
                }}
                className="relative flex flex-col h-full rounded-md overflow-hidden transition-all"
              >
                <div
                  className={`relative flex-1 flex items-center justify-center min-h-[24px] py-1.5 px-2 text-[11px] font-semibold leading-tight line-clamp-2 text-center transition-colors ${
                    !isYesSelected
                      ? "bg-trading-red text-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {binaryLabels.no}
                  {!isYesSelected && (
                    <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-current shadow-[0_0_4px_currentColor]" />
                  )}
                </div>
                <div
                  className={`h-[22px] flex items-center justify-center text-[11px] font-mono border-t ${
                    !isYesSelected
                      ? "bg-trading-red/85 text-foreground border-black/20"
                      : "bg-muted-foreground/15 text-foreground/80 border-border/40"
                  }`}
                >
                  {noPrice.toFixed(4)}
                </div>
              </button>
            </div>


            {/* Margin Mode */}
            <div className="flex items-center justify-between relative">
              <span className="text-xs text-muted-foreground">Margin Mode</span>
              <button 
                onClick={() => setMarginDropdownOpen(!marginDropdownOpen)}
                className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded text-xs"
              >
                {marginType}
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {/* Margin Mode Dropdown */}
              {marginDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-background border border-border rounded-lg shadow-lg min-w-[140px]">
                  <button
                    onClick={() => {
                      setMarginType("Cross");
                      setMarginDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-muted transition-colors ${
                      marginType === "Cross" ? "text-trading-purple" : "text-foreground"
                    }`}
                  >
                    Cross
                  </button>
                  <div className="px-3 py-2 text-xs text-muted-foreground cursor-not-allowed flex items-center justify-between">
                    <span>Isolated</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">Not Supported</span>
                  </div>
                </div>
              )}
            </div>

            {/* Leverage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Leverage</span>
                <span className="text-sm font-bold text-trading-purple">{leverage}x</span>
              </div>
              
              {/* Slider */}
              <Slider
                value={[leverage]}
                onValueChange={(value) => setLeverage(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              
              {/* Quick Select Buttons */}
              <div className="flex gap-1.5">
                {[1, 2, 5, 7, 10].map((lev) => (
                  <button
                    key={lev}
                    onClick={() => setLeverage(lev)}
                    className={`flex-1 py-1 text-xs rounded transition-colors ${
                      leverage === lev 
                        ? "bg-trading-purple text-foreground" 
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>

            {/* Available Balance */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Available (USDC)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{available.toLocaleString()}</span>
                <button 
                  onClick={() => setDepositDialogOpen(true)}
                  className="w-5 h-5 bg-muted rounded-full flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Order Type Tabs */}
            <div className="flex border-b border-border/30">
              {(["Limit", "Market"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`px-2 py-1.5 text-xs font-medium transition-all ${
                    orderType === type ? "text-foreground border-b-2 border-trading-purple" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Price Input (for Limit orders) */}
            {orderType === "Limit" && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Price</span>
                <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
                  <input
                    type="text"
                    value={limitPrice || sidePrice.toFixed(4)}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="flex-1 bg-transparent outline-none font-mono text-sm"
                    placeholder="0.0000"
                  />
                  <span className="text-muted-foreground text-xs">USDC</span>
                </div>
              </div>
            )}

            {/* Amount/Qty Input */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{inputMode === "amount" ? "Amount" : "Qty"}</span>
                <button 
                  onClick={() => setInputMode(inputMode === "amount" ? "qty" : "amount")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center bg-muted rounded-lg px-2.5 py-2">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-transparent outline-none font-mono text-sm"
                  placeholder="0.00"
                />
                {inputMode === "amount" && <span className="text-muted-foreground text-xs font-medium">USDC</span>}
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1">
              <Slider
                value={sliderValue}
                onValueChange={(val) => {
                  setSliderValue(val);
                  setAmount((available * val[0] / 100).toFixed(2));
                }}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                {["0%", "25%", "50%", "75%", "100%"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {/* TP/SL Section - Simple Dropdown Style */}
              <div className="space-y-2">
                <button 
                  onClick={() => setTpsl(!tpsl)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${tpsl ? 'bg-trading-purple border-trading-purple' : 'border-muted-foreground'}`}>
                      {tpsl && <span className="text-[10px] text-foreground">✓</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">TP/SL</span>
                  </div>
                  {tpsl ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                
                {tpsl && (
                  <div className="space-y-2 animate-fade-in">
                    {/* Take Profit */}
                    <div className="space-y-1">
                      <span className="text-xs text-trading-green">Take Profit</span>
                      <div className="flex items-center bg-muted rounded-lg px-2.5 py-2 gap-1">
                        <input
                          type="text"
                          value={tpValue}
                          onChange={(e) => setTpValue(e.target.value)}
                          className="flex-1 min-w-0 bg-transparent outline-none font-mono text-sm"
                          placeholder={tpMode === "pct" ? "0" : "0.0000"}
                        />
                        <div className="flex bg-background/50 rounded p-0.5 shrink-0">
                          <button
                            onClick={() => setTpMode("pct")}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                              tpMode === "pct" ? "bg-trading-green/20 text-trading-green" : "text-muted-foreground"
                            }`}
                          >
                            %
                          </button>
                          <button
                            onClick={() => setTpMode("price")}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                              tpMode === "price" ? "bg-trading-green/20 text-trading-green" : "text-muted-foreground"
                            }`}
                          >
                            $
                          </button>
                        </div>
                      </div>
                      {tpValue && tpMode === "pct" && (
                        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                          <span>Target: ${tpslCalculations.tpPrice}</span>
                          <span className="text-trading-green">+${tpslCalculations.tpPnL}</span>
                        </div>
                      )}
                    </div>

                    {/* Stop Loss */}
                    <div className="space-y-1">
                      <span className="text-xs text-trading-red">Stop Loss</span>
                      <div className="flex items-center bg-muted rounded-lg px-2.5 py-2 gap-1">
                        <input
                          type="text"
                          value={slValue}
                          onChange={(e) => setSlValue(e.target.value)}
                          className="flex-1 min-w-0 bg-transparent outline-none font-mono text-sm"
                          placeholder={slMode === "pct" ? "0" : "0.0000"}
                        />
                        <div className="flex bg-background/50 rounded p-0.5 shrink-0">
                          <button
                            onClick={() => setSlMode("pct")}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                              slMode === "pct" ? "bg-trading-red/20 text-trading-red" : "text-muted-foreground"
                            }`}
                          >
                            %
                          </button>
                          <button
                            onClick={() => setSlMode("price")}
                            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                              slMode === "price" ? "bg-trading-red/20 text-trading-red" : "text-muted-foreground"
                            }`}
                          >
                            $
                          </button>
                        </div>
                      </div>
                      {slValue && slMode === "pct" && (
                        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                          <span>Target: ${tpslCalculations.slPrice}</span>
                          <span className="text-trading-red">{tpslCalculations.slPnL}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-1 text-xs pt-2 border-t border-border/30">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notional val.</span>
                <span className={parseFloat(amount) > 0 ? "text-foreground font-mono" : "text-muted-foreground"}>
                  {parseFloat(amount) > 0 ? `${displayCalculations.notionalValue} USDC` : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin req.</span>
                <span className={parseFloat(amount) > 0 ? "text-foreground font-mono" : "text-muted-foreground"}>
                  {parseFloat(amount) > 0 ? `${displayCalculations.marginRequired} USDC` : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee (est.)</span>
                <span className={parseFloat(amount) > 0 ? "text-foreground font-mono" : "text-muted-foreground"}>
                  {parseFloat(amount) > 0 ? `${displayCalculations.estimatedFee} USDC` : "--"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/30">
                <span className="font-medium text-foreground">Total</span>
                <span className={parseFloat(amount) > 0 ? "text-foreground font-mono font-medium" : "text-muted-foreground"}>
                  {parseFloat(amount) > 0 ? `${displayCalculations.total} USDC` : "--"}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            {orderIntent.kind === "blocked-cross-zero" && (
              <div className="space-y-2 rounded-lg border border-trading-red/30 bg-trading-red/10 px-3 py-2 text-[11px] text-trading-red">
                <p>You hold {orderIntent.existingQty.toLocaleString()} {orderIntent.existingPosition?.type} shares. Close it before opening the opposite side.</p>
                <button
                  type="button"
                  onClick={() => setAmount(((orderIntent.existingQty * sidePrice) / leverage).toFixed(2))}
                  className="text-foreground underline underline-offset-2"
                >
                  Close & Continue
                </button>
              </div>
            )}
            <TradeSubmitButton
              side={side}
              label={getIntentLabel(orderIntent, side, isBinarySingleMarket ? binaryLabels : undefined)}
              potentialWin={parseFloat(amount) > 0 ? parseInt(orderCalculations.potentialWin).toLocaleString() : "0"}
              onClick={handlePreview}
              disabled={orderIntent.kind === "blocked-cross-zero"}
            />
            </div>
          </div>

          {/* Account Risk Indicator - follows Trade panel, no special height constraints */}
          {user && (
            <div className="bg-background rounded-lg border border-border/50 flex-shrink-0">
              <AccountRiskIndicator variant="compact" />
            </div>
          )}
        </div>
      </div>

      {/* Order Preview Dialog */}
      <Dialog open={orderPreviewOpen} onOpenChange={setOrderPreviewOpen}>
        <DialogContent className="sm:max-w-2xl gap-4 p-5">
          <DialogHeader>
            <DialogTitle>Order Preview</DialogTitle>
            <DialogDescription className="sr-only">
              Review the trade, notional values, margin requirement, and position impact before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2 border-b border-border/30 pb-4">
              <p className="text-sm font-medium text-foreground pr-6 line-clamp-2">{selectedEvent?.name}</p>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm truncate font-medium ${isBinarySingleMarket ? (previewSideColor === "green" ? "text-trading-green" : "text-trading-red") : "text-muted-foreground"}`}>
                  {previewOptionLabel}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {!isBinarySingleMarket && (
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${previewSideColor === "green" ? "bg-trading-green/15 text-trading-green" : "bg-trading-red/15 text-trading-red"}`}>
                      {previewSideLabel}
                    </span>
                  )}
                  <span className="rounded bg-muted px-2 py-1 text-xs font-semibold capitalize text-foreground">{formattedIntent}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trade</p>
                <div className="space-y-2">
                  {previewTradeFields.map((field) => (
                    <div key={field.label} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">{field.label}</span>
                      <span className="font-mono text-foreground text-right">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notional</p>
                <div className="space-y-2">
                  {previewNotionalFields.map((field) => (
                    <div key={field.label} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">{field.label}</span>
                      <span className={`font-mono text-right ${field.highlight ? "text-foreground font-semibold" : "text-foreground"}`}>{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-background p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Position impact</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isReducingOrder ? "This order reduces existing risk and releases margin." : "This order increases exposure and requires opening margin."}
                  </p>
                </div>
                <div className="grid min-w-[280px] grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {isReducingOrder ? (
                    <>
                      <span className="text-muted-foreground">Released margin</span>
                      <span className="text-right font-mono text-trading-green">+{orderIntent.releasedMargin.toFixed(2)} USDC</span>
                      <span className="text-muted-foreground">Realized PnL est.</span>
                      <span className={`text-right font-mono ${orderIntent.realizedPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                        {orderIntent.realizedPnl >= 0 ? "+" : "-"}{Math.abs(orderIntent.realizedPnl).toFixed(2)} USDC
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">Margin required</span>
                      <span className="text-right font-mono text-foreground">{displayCalculations.marginRequired} USDC</span>
                      <span className="text-muted-foreground">Liq. price</span>
                      <span className="text-right font-mono text-foreground">{orderCalculations.liqPrice} USDC</span>
                    </>
                  )}
                  <span className="text-muted-foreground">TP/SL</span>
                  <span className="text-right font-mono text-foreground">{tpsl ? `TP ${tpValue ? tpslCalculations.tpPrice : '--'} / SL ${slValue ? tpslCalculations.slPrice : '--'}` : "--"}</span>
                </div>
              </div>
            </div>
          </div>


          <TradeSubmitButton
            side={side}
            label={getIntentLabel(orderIntent, side, isBinarySingleMarket ? binaryLabels : undefined)}
            potentialWin={parseFloat(amount) > 0 ? parseInt(orderCalculations.potentialWin).toLocaleString() : "0"}
            onClick={handleConfirmOrder}
            loading={isSubmittingOrder}
            size="lg"
            className="mt-4"
          />
        </DialogContent>
      </Dialog>

      
      {/* Position TP/SL Edit Dialog */}
      <Dialog open={positionTpSlOpen} onOpenChange={setPositionTpSlOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base">Edit TP/SL</DialogTitle>
          </DialogHeader>
          
          {editingPositionIndex !== null && positions[editingPositionIndex] && (() => {
            const pos = positions[editingPositionIndex];
            const parsePrice = (price: string) => parseFloat(price.replace(/[$,]/g, '')) || 0;
            const parsedEntryPrice = parsePrice(pos.entryPrice);
            const parsedMargin = parsePrice(pos.margin);
            const parsedSize = parseFloat(pos.size.replace(/,/g, '')) || 0;
            const leverageNum = parseFloat(pos.leverage.replace('x', '')) || 1;
            
            const calculateEstimatedPnl = (value: string, mode: "%" | "$", isProfit: boolean) => {
              if (!value || !parsedMargin) return null;
              const numValue = parseFloat(value) || 0;
              if (numValue === 0) return null;
              
              if (mode === "%") {
                const pnl = parsedMargin * (numValue / 100) * leverageNum;
                return isProfit ? pnl : -pnl;
              } else {
                const targetPrice = numValue;
                if (parsedEntryPrice === 0 || parsedSize === 0) return null;
                const priceDiff = targetPrice - parsedEntryPrice;
                const pnl = pos.type === "long" ? priceDiff * parsedSize : -priceDiff * parsedSize;
                return pnl;
              }
            };
            
            const tpEstimatedPnl = calculateEstimatedPnl(positionTpValue, positionTpMode, true);
            const slEstimatedPnl = calculateEstimatedPnl(positionSlValue, positionSlMode, false);
            
            const formatPnl = (pnl: number | null) => {
              if (pnl === null) return "";
              const sign = pnl >= 0 ? "+" : "";
              return `${sign}$${Math.abs(pnl).toFixed(2)}`;
            };
            
            return (
            <div className="space-y-4">
              {/* Position Info */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                {(() => {
                  const outcome = getBinaryOutcome(pos.option);
                  const isYes = outcome === "yes";
                  const isNo = outcome === "no";
                  const colorClass = isYes ? "text-trading-green" : isNo ? "text-trading-red" : pos.type === "long" ? "text-trading-green" : "text-trading-red";
                  const sideLabel = outcome
                    ? resolveBinarySideLabel(outcome, lookupSideLabels(pos.event).labels)
                    : pos.option;
                  return (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Position</span>
                        <span className={colorClass}>{sideLabel} {pos.leverage}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{TRADING_TERMS.CONTRACT}</span>
                        <span className="font-medium">{pos.displayOption ?? pos.option}</span>
                      </div>
                    </>
                  );
                })()}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{TRADING_TERMS.ENTRY_PRICE}</span>
                  <span className="font-mono">{pos.entryPrice}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{TRADING_TERMS.MARK_PRICE}</span>
                  <span className="font-mono">{pos.markPrice}</span>
                </div>
              </div>

              {/* Take Profit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-trading-green font-medium">Take Profit</label>
                  {tpEstimatedPnl !== null && (
                    <span className={`text-xs font-mono ${tpEstimatedPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                      Est. P&L: {formatPnl(tpEstimatedPnl)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={positionTpValue}
                      onChange={(e) => setPositionTpValue(e.target.value)}
                      placeholder="0"
                      className="w-full bg-muted border-0 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
                    <button
                      onClick={() => setPositionTpMode("%")}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                        positionTpMode === "%" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setPositionTpMode("$")}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                        positionTpMode === "$" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      $
                    </button>
                  </div>
                </div>
              </div>

              {/* Stop Loss */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-trading-red font-medium">Stop Loss</label>
                  {slEstimatedPnl !== null && (
                    <span className={`text-xs font-mono ${slEstimatedPnl >= 0 ? "text-trading-green" : "text-trading-red"}`}>
                      Est. P&L: {formatPnl(slEstimatedPnl)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={positionSlValue}
                      onChange={(e) => setPositionSlValue(e.target.value)}
                      placeholder="0"
                      className="w-full bg-muted border-0 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
                    <button
                      onClick={() => setPositionSlMode("%")}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                        positionSlMode === "%" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      %
                    </button>
                    <button
                      onClick={() => setPositionSlMode("$")}
                      className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                        positionSlMode === "$" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      $
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCancelPositionTpSl}
                  className="flex-1 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePositionTpSl}
                  className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          );
          })()}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={cancelOrderOpen} onOpenChange={setCancelOrderOpen}>
        <AlertDialogContent className="max-w-md bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-trading-red" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Are you sure you want to cancel this order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {cancellingOrderIndex !== null && unifiedOrders[cancellingOrderIndex] && (() => {
            const order = unifiedOrders[cancellingOrderIndex];
            const orderOutcome = getBinaryOutcome(order.option);
            const orderDisplay = (order as any).displayOption ?? order.option;
            const outcomeColor = orderOutcome === "yes"
              ? "text-trading-green font-medium"
              : orderOutcome === "no"
              ? "text-trading-red font-medium"
              : (order.type === "buy" ? "text-trading-green font-medium" : "text-trading-red font-medium");
            const typeLabel = orderOutcome
              ? `${orderDisplay} ${order.orderType}`
              : `${resolveBinarySideLabel(order.type === "buy" ? "yes" : "no", lookupSideLabels(order.event).labels)} ${order.orderType}`;
            return (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 my-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Order Type</span>
                  <span className={outcomeColor}>
                    {typeLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contract</span>
                  <span className={`font-medium ${orderOutcome === "yes" ? "text-trading-green" : orderOutcome === "no" ? "text-trading-red" : ""}`}>{orderDisplay}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Event</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{order.event}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-mono">{order.price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-mono">{order.amount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono">{order.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-border/30 pt-2 mt-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    order.status === "Pending" ? "bg-amber-500/20 text-amber-400" :
                    order.status === "Partial Filled" ? "bg-cyan-500/20 text-cyan-400" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            );
          })()}

          <AlertDialogFooter className="flex gap-2 sm:gap-2">
            <AlertDialogCancel className="flex-1">Keep Order</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCancelOrder}
              className="flex-1 bg-trading-red hover:bg-trading-red/90 text-white"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auth Dialog for login/signup */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultTab={authDefaultTab}
      />

      {/* Deposit Dialog */}
      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
      />
    </div>
  );
}
