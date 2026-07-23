import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, CreditCard, Copy, Check, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onTopUp?: (amount: number, method: string) => void;
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

const DEPOSIT_ADDRESS = "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12";

// Generate QR code URL
const getQRCodeUrl = (text: string, size: number = 160) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=1a1a2e&color=ffffff`;
};

export function TopUpDialog({ open, onOpenChange, currentBalance, onTopUp }: TopUpDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("crypto");
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMobile = useIsMobile();
  const { user, addBalance, refetchProfile } = useUserProfile();

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTopUp = async () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!user) {
      toast.error("Please log in to top up");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Calculate the amount after fee (2.5% fee for card payments)
      const feePercent = 0.025;
      const receivedAmount = numAmount * (1 - feePercent);
      
      // Add balance to user profile
      const success = await addBalance(receivedAmount);
      
      if (success) {
        // Record the transaction via privileged edge function
        const { error: txError } = await supabase.functions.invoke("record-transaction", {
          body: {
            type: "card_deposit",
            amount: receivedAmount,
            description: `Card deposit of $${numAmount.toFixed(2)} (Fee: $${(numAmount * feePercent).toFixed(2)})`,
            status: "completed",
          },
        });

        if (txError) {
          console.error("Failed to record transaction:", txError);
        }

        // Refetch profile to update UI
        await refetchProfile();
        
        toast.success(`Successfully added $${receivedAmount.toFixed(2)} USDC to your balance`);
        
        // Call optional callback
        if (onTopUp) {
          onTopUp(receivedAmount, selectedMethod);
        }
        
        setAmount("");
        onOpenChange(false);
      } else {
        toast.error("Failed to add balance. Please try again.");
      }
    } catch (error) {
      console.error("Top up error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const methods = [
    { id: "crypto", label: "Crypto", icon: Wallet, desc: "Deposit USDC" },
    { id: "card", label: "Card", icon: CreditCard, desc: "Visa, Mastercard" },
  ];

  // Shared content for both Dialog and Drawer
  const TopUpContent = () => (
    <div className="space-y-4">
      {/* Current Balance - Compact for mobile */}
      <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Current Balance</div>
          <div className="text-xl font-mono font-semibold">{currentBalance.toLocaleString()} <span className="text-sm text-muted-foreground">USDC</span></div>
        </div>
        <div className="w-10 h-10 rounded-full bg-trading-green/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-trading-green" />
        </div>
      </div>

      {/* Deposit Method - Horizontal pills for mobile */}
      <div className="flex gap-2">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
              selectedMethod === method.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 hover:border-muted-foreground/50"
            }`}
          >
            <method.icon className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm font-medium">{method.label}</div>
              <div className="text-[10px] text-muted-foreground">{method.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Crypto Deposit */}
      {selectedMethod === "crypto" && (
        <div className="space-y-4">
          {/* QR Code - Larger and centered */}
          <div className="flex flex-col items-center py-2">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <img 
                src={getQRCodeUrl(DEPOSIT_ADDRESS, 180)} 
                alt="Deposit QR Code"
                className="w-44 h-44"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Scan to deposit USDC (Ethereum)</p>
          </div>

          {/* Address - Touch-friendly copy button */}
          <button
            onClick={handleCopyAddress}
            className="w-full flex items-center gap-3 bg-muted rounded-xl p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex-1 text-left">
              <div className="text-[10px] text-muted-foreground mb-1">Wallet Address</div>
              <code className="text-xs font-mono block truncate">{DEPOSIT_ADDRESS}</code>
            </div>
            <div className={`p-2 rounded-lg transition-colors ${copied ? "bg-trading-green/20" : "bg-muted-foreground/10"}`}>
              {copied ? (
                <Check className="w-5 h-5 text-trading-green" />
              ) : (
                <Copy className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>
          
          {copied && (
            <p className="text-xs text-trading-green text-center animate-in fade-in">Address copied!</p>
          )}
        </div>
      )}

      {/* Card Payment */}
      {selectedMethod === "card" && (
        <div className="space-y-4">
          {/* Amount Input - Large touch target */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Amount (USDC)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="font-mono text-2xl h-14 text-center rounded-xl"
            />
          </div>

          {/* Quick Amount Buttons - Larger for touch */}
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                onClick={() => handleQuickAmount(value)}
                className={`py-3 text-sm font-medium rounded-xl border-2 transition-all active:scale-95 ${
                  amount === value.toString()
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 hover:border-muted-foreground/50"
                }`}
              >
                ${value}
              </button>
            ))}
          </div>

          {/* Fee Info - Card style */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono">${amount || "0.00"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fee (2.5%)</span>
              <span className="font-mono">${amount ? (parseFloat(amount) * 0.025).toFixed(2) : "0.00"}</span>
            </div>
            <div className="border-t border-border/50 pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>You receive</span>
                <span className="font-mono text-trading-green">${amount ? (parseFloat(amount) * 0.975).toFixed(2) : "0.00"} USDC</span>
              </div>
            </div>
          </div>

          {/* Submit Button - Full width, prominent */}
          <Button
            onClick={handleTopUp}
            disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
            className="w-full h-14 bg-trading-green hover:bg-trading-green/90 text-background font-semibold text-base rounded-xl"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay with Card"
            )}
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile: Use MobileDrawer
  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Top Up"
      >
        <TopUpContent />
      </MobileDrawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Top Up Balance</DialogTitle>
        </DialogHeader>
        <TopUpContent />
      </DialogContent>
    </Dialog>
  );
}
