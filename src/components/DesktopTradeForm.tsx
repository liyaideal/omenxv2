import { useState, useMemo, useEffect } from "react";
import { ChevronDown, Calculator, Plus, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { TRADING_TERMS } from "@/lib/tradingTerms";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AccountRiskIndicator } from "@/components/AccountRiskIndicator";
import { DepositDialog } from "@/components/deposit/DepositDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DesktopTradeFormProps {
  selectedPrice?: string;
  symbol?: string;
}

export const DesktopTradeForm = ({ selectedPrice = "0.1234", symbol = "BTC" }: DesktopTradeFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useUserProfile();
  const [marginType, setMarginType] = useState("Cross");
  const [leverage, setLeverage] = useState("10.00x");
  const [orderType, setOrderType] = useState<"Limit" | "Market" | "Conditional">("Limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const longPrice = useMemo(() => parseFloat(selectedPrice) || 0, [selectedPrice]);
  const shortPrice = useMemo(() => +(1 - longPrice).toFixed(4), [longPrice]);
  const [price, setPrice] = useState(selectedPrice);
  const [userEditedPrice, setUserEditedPrice] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [sliderValue, setSliderValue] = useState([0]);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "signup">("signup");
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);

  // Auto-fill price based on side, unless user manually edited it
  useEffect(() => {
    if (!userEditedPrice) {
      setPrice((side === "buy" ? longPrice : shortPrice).toFixed(4));
    }
  }, [side, longPrice, shortPrice, userEditedPrice]);

  const handlePreview = (clickedSide: "buy" | "sell") => {
    // Check if user is logged in first
    if (!user) {
      setAuthDefaultTab("signup");
      setAuthDialogOpen(true);
      return;
    }

    // Use side-specific price: Buy → longPrice, Sell → shortPrice (unless user manually edited)
    const execPrice = userEditedPrice && clickedSide === side
      ? price
      : (clickedSide === "buy" ? longPrice : shortPrice).toFixed(4);

    navigate("/order-preview", {
      state: {
        side: clickedSide,
        marginType,
        leverage,
        orderType,
        amount: quantity,
        price: execPrice,
      },
    });
  };

  const handleAuth = (type: "signin" | "signup") => {
    setAuthDefaultTab(type);
    setAuthDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <span className="text-sm font-medium text-foreground">Trade</span>
        <div className="flex items-center gap-2">
          <button className="p-1 text-muted-foreground hover:text-foreground">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <rect x="3" y="3" width="6" height="6" rx="1" />
              <rect x="11" y="3" width="6" height="6" rx="1" />
              <rect x="3" y="11" width="6" height="6" rx="1" />
              <rect x="11" y="11" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button className="p-1 text-muted-foreground hover:text-foreground">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="2" />
              <circle cx="10" cy="10" r="2" />
              <circle cx="10" cy="16" r="2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Yes/No price hint */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={() => { setSide("buy"); setUserEditedPrice(false); }}
              className={side === "buy" ? "text-trading-green font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}
            >
              Yes at {longPrice.toFixed(4)}
            </button>
            <span className="text-muted-foreground/50">·</span>
            <button
              onClick={() => { setSide("sell"); setUserEditedPrice(false); }}
              className={side === "sell" ? "text-trading-red font-semibold" : "text-muted-foreground hover:text-foreground transition-colors"}
            >
              No at {shortPrice.toFixed(4)}
            </button>
          </div>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[240px] text-xs">
                Yes and No prices sum to 1. No price = 1 − Yes price, a risk-control adjustment for two-sided exposure.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>


        {/* Margin & Leverage */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded text-xs font-medium">
            {marginType}
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded text-xs font-medium">
            {leverage}
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Order Type Tabs */}
        <div className="flex border-b border-border/30">
          {(["Limit", "Market", "Conditional"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`px-3 py-2 text-sm font-medium transition-all ${
                orderType === type
                  ? "text-foreground border-b-2 border-trading-yellow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Price Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Price <span className={side === "buy" ? "text-trading-green" : "text-trading-red"}>({side === "buy" ? "Yes" : "No"})</span>
            </span>
          </div>

          <div className="flex items-center bg-muted rounded-lg">
            <input
              type="text"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setUserEditedPrice(true); }}
              className="flex-1 bg-transparent outline-none font-mono text-sm px-3 py-2.5"
              placeholder="0.00"
            />
            <button
              onClick={() => setUserEditedPrice(false)}
              className="px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground border-l border-border/30"
            >
              Last
            </button>
            <button className="px-2 py-2.5 text-muted-foreground hover:text-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Quantity</span>
          <div className="flex items-center bg-muted rounded-lg">
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1 bg-transparent outline-none font-mono text-sm px-3 py-2.5"
              placeholder="0.00"
            />
            <button className="flex items-center gap-1 px-3 py-2.5 text-xs font-medium">
              {symbol}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
          <span>100%</span>
          </div>
        </div>

        {/* Available Balance - Only show for logged in users */}
        {user && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Available (USDC)</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <button 
                onClick={() => setDepositDialogOpen(true)}
                className="w-5 h-5 bg-muted rounded-full flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Value & Cost */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Value</span>
            <span className="text-muted-foreground font-mono">-- / --USDT</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Cost</span>
            <span className="text-muted-foreground font-mono">-- / --USDT</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {user ? (
            <>
              <button
                onClick={() => { setSide("buy"); handlePreview("buy"); }}
                className="w-full py-2.5 rounded-lg font-semibold text-sm bg-trading-green text-trading-green-foreground transition-all duration-200 hover:opacity-90"
              >
                Buy Yes · {longPrice.toFixed(4)}
              </button>
              <button
                onClick={() => { setSide("sell"); handlePreview("sell"); }}
                className="w-full py-2.5 rounded-lg font-semibold text-sm bg-trading-red text-foreground transition-all duration-200 hover:opacity-90"
              >
                Buy No · {shortPrice.toFixed(4)}
              </button>

            </>
          ) : (
            <>
              <button
                onClick={() => handleAuth("signup")}
                className="w-full py-2.5 rounded-lg font-semibold text-sm bg-trading-yellow text-background transition-all duration-200 hover:opacity-90"
              >
                Sign Up
              </button>
              <button
                onClick={() => handleAuth("signin")}
                className="w-full py-2.5 rounded-lg font-semibold text-sm bg-muted text-foreground border border-border/50 transition-all duration-200 hover:bg-muted/80"
              >
                Log In
              </button>
              <button className="w-full text-center text-sm text-trading-yellow hover:underline">
                Demo Trading
              </button>
            </>
          )}
        </div>

        {/* Calculator */}
        <div className="flex items-center gap-2 pt-2">
          <Calculator className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Calculator</span>
        </div>

        {/* Account Risk Indicator - only show for logged in users */}
        {user && (
          <div className="pt-4">
            <AccountRiskIndicator variant="compact" />
          </div>
        )}
      </div>

      {/* Contract Details */}
      <div className="px-4 py-3 border-t border-border/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Contract Details BTCUSDT</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expiration Date</span>
            <span>Perpetual</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Index Price</span>
            <span className="font-mono">88,155.51</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{TRADING_TERMS.MARK_PRICE}</span>
            <span className="font-mono">88,132.18</span>
          </div>
        </div>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Show
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Auth Dialog */}
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
};
