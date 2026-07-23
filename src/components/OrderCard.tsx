import { useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { MobileDrawer, MobileDrawerActions } from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getBinaryOutcome } from "@/lib/eventUtils";

interface OrderCardProps {
  type: "buy" | "sell";
  orderType: "Limit" | "Market";
  event: string;
  option: string;
  /** Display label after applying sideLabels; falls back to option. */
  displayOption?: string;
  probability?: string;
  price: string;
  amount: string;
  total: string;
  time: string;
  status: "Pending" | "Partially Filled" | "Partial Filled" | "Filled" | "Cancelled";
  onCancel?: () => void;
  onFill?: () => void;
}

export const OrderCard = ({
  type,
  orderType,
  event,
  option,
  displayOption,
  probability,
  price,
  amount,
  total,
  time,
  status,
  onCancel,
  onFill,
}: OrderCardProps) => {
  const optionDisplay = displayOption ?? option;
  const outcome = getBinaryOutcome(option);
  const isBinary = outcome !== null;
  const outcomeTextColor = outcome === "yes" ? "text-trading-green" : outcome === "no" ? "text-trading-red" : "";
  // Multi-outcome: 方向 chip = Yes/No (基于 buy/sell)。Binary: header chip 隐藏，drawer 中 Order Type 不再重复 contract，只显示 orderType 文字。
  const sideText = isBinary ? null : (type === "buy" ? "Yes" : "No");
  const sideColor = isBinary
    ? outcomeTextColor
    : (type === "buy" ? "text-trading-green" : "text-trading-red");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const { toast } = useToast();

  const statusColors: Record<string, string> = {
    Pending: "bg-amber-500/20 text-amber-400",
    "Partially Filled": "bg-cyan-500/20 text-cyan-400",
    "Partial Filled": "bg-cyan-500/20 text-cyan-400",
    Filled: "bg-trading-green/20 text-trading-green",
    Cancelled: "bg-trading-red/20 text-trading-red",
  };

  const handleCancelOrder = () => {
    onCancel?.();
    toast({
      title: "Order Cancelled",
      description: `Your ${type} order for ${optionDisplay} has been cancelled.`,
    });
    setCancelDialogOpen(false);
  };

  const handleFillOrder = () => {
    onFill?.();
    toast({
      title: "Order Filled",
      description: `Your ${type} order for ${optionDisplay} has been executed. Check your positions.`,
    });
    setFillDialogOpen(false);
  };

  const isPending = status === "Pending" || status === "Partially Filled" || status === "Partial Filled";

  return (
    <>
      <div className="bg-card rounded-xl p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {!isBinary && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  type === "buy"
                    ? "bg-trading-green/20 text-trading-green"
                    : "bg-trading-red/20 text-trading-red"
                }`}
              >
                {type === "buy" ? "Yes" : "No"}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{orderType}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[status]}`}>
            {status}
          </span>
        </div>

        {/* Event Info */}
        <div className="mb-2">
          <h3 className="font-medium text-foreground text-sm">{event}</h3>
          <p className="text-xs">
            <span className={isBinary ? `${outcomeTextColor} font-medium` : "text-muted-foreground"}>{optionDisplay}</span>
            {probability ? <span className="text-muted-foreground"> · {probability}</span> : null}
          </p>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div>
            <span className="text-[10px] text-muted-foreground block">Price</span>
            <span className="font-mono text-xs">{price}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Amount</span>
            <span className="font-mono text-xs">{amount}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">
              {orderType === "Market" ? "Est. Total" : "Total"}
            </span>
            <span className="font-mono text-xs">{total}</span>
          </div>
        </div>

        {/* Footer with time */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
      </div>

      {/* Fill Order Confirmation Drawer */}
      <MobileDrawer
        open={fillDialogOpen}
        onOpenChange={setFillDialogOpen}
        title="Fill Order"
        description="Simulate this order being filled? It will create a new position."
      >
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Order Type</span>
            <span className={`${sideColor} font-medium`}>
              <CheckCircle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              {sideText ? `${sideText} ${orderType}` : orderType}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Contract</span>
            <span className="font-medium">{optionDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono">{price}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-mono">{amount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono">{total}</span>
          </div>
        </div>
        <MobileDrawerActions>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setFillDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 bg-trading-green hover:bg-trading-green/90 text-white"
              onClick={handleFillOrder}
            >
              Fill Order
            </Button>
          </div>
        </MobileDrawerActions>
      </MobileDrawer>

      {/* Cancel Order Confirmation Drawer */}
      <MobileDrawer
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Order"
        description="Are you sure you want to cancel this order?"
      >
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Order Type</span>
            <span className={`${sideColor} font-medium`}>
              <AlertTriangle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              {sideText ? `${sideText} ${orderType}` : orderType}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Contract</span>
            <span className="font-medium">{optionDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono">{price}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-mono">{amount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono">{total}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <span className={statusColors[status].split(' ')[1]}>{status}</span>
          </div>
        </div>
        <MobileDrawerActions>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setCancelDialogOpen(false)}>
              Keep Order
            </Button>
            <Button
              className="flex-1 h-11 bg-trading-red hover:bg-trading-red/90 text-white"
              onClick={handleCancelOrder}
            >
              Cancel Order
            </Button>
          </div>
        </MobileDrawerActions>
      </MobileDrawer>
    </>
  );
};
