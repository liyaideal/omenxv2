import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { useOrdersStore, Order } from "@/stores/useOrdersStore";
import { usePositionsStore, Position } from "@/stores/usePositionsStore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePositions } from "@/hooks/usePositions";
import { executeTrade } from "@/services/tradingService";
import { Loader2 } from "lucide-react";
import { AuthSheet } from "@/components/auth/AuthSheet";

import { classifyOrderIntent, getIntentLabel } from "@/lib/positionIntent";
import { TradeSubmitButton } from "@/components/trading/TradeSubmitButton";

interface OrderDetail {
  label: string;
  value: string;
  highlight?: "green" | "red" | "purple";
}

interface OrderCalculations {
  notionalValue: string;
  marginRequired: string;
  estimatedFee: string;
  total: string;
  quantity: string;
  potentialWin: string;
  liqPrice: string;
}

export default function OrderPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addOrder } = useOrdersStore();
  const { addPosition } = usePositionsStore();
  const { balance, user, deductBalance, addBalance } = useUserProfile();
  const { positions, refetch: refetchPositions } = usePositions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authSheetOpen, setAuthSheetOpen] = useState(false);

  const orderData = location.state || {};
  const orderCalculations: OrderCalculations = orderData.orderCalculations || {
    notionalValue: "0.00",
    marginRequired: "0.00",
    estimatedFee: "0.00",
    total: "0.00",
    quantity: "0",
    potentialWin: "0",
    liqPrice: "0.0000",
  };
  const isBuy = orderData.side === "buy";
  
  // Get event and option from order data or use defaults
  const eventName = orderData.event || "Elon Musk # tweets December 12 - December 19, 2025?";
  const optionLabel = orderData.option || "200-219";
  const sideLabels: { yes: string; no: string } | null = orderData.sideLabels ?? null;
  const lcOpt = optionLabel.trim().toLowerCase();
  const isBinaryOption = lcOpt === "yes" || lcOpt === "no";
  // Binary: 方向由 option (yes/no) 决定，不看 buy/sell；多 outcome 才看 buy/sell
  const previewOutcome: "yes" | "no" = isBinaryOption ? (lcOpt as "yes" | "no") : (isBuy ? "yes" : "no");
  const sideDisplay = isBinaryOption
    ? (sideLabels ? (previewOutcome === "yes" ? sideLabels.yes : sideLabels.no) : (previewOutcome === "yes" ? "Yes" : "No"))
    : (isBuy ? "Yes" : "No");
  const sideHighlight: "green" | "red" = previewOutcome === "yes" ? "green" : "red";
  const totalCost = parseFloat(orderCalculations.total) || 0;
  const orderIntent = useMemo(() => classifyOrderIntent({
    positions,
    eventName,
    optionLabel,
    side: (orderData.side as "buy" | "sell") || "buy",
    quantity: parseInt(orderCalculations.quantity) || 0,
    clickedPrice: parseFloat(orderData.price) || 0,
    leverage: parseInt(orderData.leverage) || 10,
  }), [positions, eventName, optionLabel, orderData.side, orderData.price, orderData.leverage, orderCalculations.quantity]);
  const isReducing = orderIntent.kind === "reduce" || orderIntent.kind === "close";
  const effectiveTotalCost = orderIntent.incrementalMargin + (parseFloat(orderCalculations.estimatedFee) || 0);


  const hasSufficientFunds = balance >= effectiveTotalCost;

  const orderDetails: OrderDetail[] = [
    { label: "Event", value: eventName },
    ...(isBinaryOption
      ? [{ label: "Option", value: sideDisplay, highlight: sideHighlight as "green" | "red" }]
      : [
          { label: "Option", value: optionLabel },
          { label: "Side", value: sideDisplay, highlight: sideHighlight as "green" | "red" },
        ]),
    { label: "Margin type", value: orderData.marginType || "Cross" },
    { label: "Type", value: orderData.orderType || "Market" },
    { label: "Order Price", value: `${orderData.price || "0.0000"} USDC` },
    { label: "Order Cost", value: `${orderData.amount || "0.00"} USDC` },
    { label: "Traded notional", value: `${orderCalculations.notionalValue} USDC` },
    { label: "Opening notional", value: `${orderIntent.openingNotional.toFixed(2)} USDC` },
    { label: "Leverage", value: orderData.leverage || "10x" },
    { label: "Intent", value: orderIntent.kind.replace(/-/g, " ") },
    { label: "Margin required", value: `${orderIntent.incrementalMargin.toFixed(2)} USDC` },
    ...(isReducing ? [
      { label: "Released margin est.", value: `${orderIntent.releasedMargin.toFixed(2)} USDC`, highlight: "green" as const },
      { label: "Realized PnL est.", value: `${orderIntent.realizedPnl >= 0 ? "+" : "-"}${Math.abs(orderIntent.realizedPnl).toFixed(2)} USDC`, highlight: orderIntent.realizedPnl >= 0 ? "green" as const : "red" as const },
    ] : []),
    { label: "TP/SL", value: orderData.tpsl ? "Set" : "--" },
    { label: "Estimated Liq. Price", value: `${orderCalculations.liqPrice} USDC` },
    { label: "Available Balance", value: `${balance.toFixed(2)} USDC`, highlight: hasSufficientFunds ? "green" as const : "red" as const },
  ];

  const potentialWin = parseInt(orderCalculations.potentialWin) || 0;

  const handleConfirm = async () => {
    // Check if user is logged in
    if (!user) {
      setAuthSheetOpen(true);
      return;
    }

    // Check if user has enough total balance (trial + real)
    if (orderIntent.kind === "blocked-cross-zero") {
      toast.error("Close existing position first before opening the opposite side.");
      return;
    }

    if (!hasSufficientFunds) {
      toast.error(`Insufficient balance. You need ${effectiveTotalCost.toFixed(2)} USDC but only have ${balance.toFixed(2)} USDC available.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute trade in database
      const tradeData = {
        eventName,
        optionLabel,
        side: orderData.side as "buy" | "sell",
        orderType: (orderData.orderType as "Market" | "Limit") || "Market",
        price: parseFloat(orderData.price) || 0,
        amount: parseFloat(orderData.amount) || 0,
        quantity: parseInt(orderCalculations.quantity) || 0,
        leverage: parseInt(orderData.leverage) || 10,
        margin: orderIntent.incrementalMargin,
        fee: parseFloat(orderCalculations.estimatedFee) || 0,
        tpValue: orderData.tpsl?.tp ? parseFloat(orderData.tpsl.tp.value) : undefined,
        tpMode: orderData.tpsl?.tp?.mode === "pct" ? "%" as const : "$" as const,
        slValue: orderData.tpsl?.sl ? parseFloat(orderData.tpsl.sl.value) : undefined,
        slMode: orderData.tpsl?.sl?.mode === "pct" ? "%" as const : "$" as const,
      };

      const result = await executeTrade(user.id, tradeData);

      if (result.balanceDelta < 0) {
        const deducted = await deductBalance(Math.abs(result.balanceDelta));
        if (!deducted) throw new Error("Failed to deduct balance");
      } else if (result.balanceDelta > 0) {
        await addBalance(result.balanceDelta);
      }

      // Market orders execute immediately and become positions
      // No need to add to orders store - just refetch positions from database
      refetchPositions();

      toast.success("Order executed successfully!");
      navigate("/trade");
    } catch (error: any) {
      console.error("Order execution error:", error);
      toast.error(error.message || "Failed to execute order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <MobileHeader title="Order preview" showLogo={false} />

      {/* Order Details Card */}
      <div className="px-4 py-4 animate-fade-in">
        <div className="trading-card p-4">
          <div className="space-y-0">
            {orderDetails.map((detail, index) => (
              <div
                key={detail.label}
                className={`flex justify-between gap-4 py-3 ${
                  index !== orderDetails.length - 1 ? "border-b border-border/20" : ""
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-muted-foreground text-sm flex-shrink-0">{detail.label}</span>
                <span
                  className={`font-medium text-sm text-right ${
                    detail.highlight === "green"
                      ? "text-trading-green"
                      : detail.highlight === "red"
                      ? "text-trading-red"
                      : detail.highlight === "purple"
                      ? "text-trading-purple"
                      : "text-foreground"
                  }`}
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
          
        </div>
      </div>

      {/* Confirm Button */}
      <div className="fixed bottom-20 left-0 right-0 bg-background px-4 py-3">
        <TradeSubmitButton
          side={orderData.side || "buy"}
          label={getIntentLabel(orderIntent, orderData.side || "buy", sideLabels)}
          potentialWin={potentialWin.toLocaleString()}
          onClick={handleConfirm}
          loading={isSubmitting}
          size="lg"
          className="animate-slide-up"
        />
      </div>

      {/* Auth Sheet for login */}
      <AuthSheet open={authSheetOpen} onOpenChange={setAuthSheetOpen} />

      <BottomNav />
    </div>
  );
}
