import { useState, useEffect } from "react";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MobileDrawer,
  MobileDrawerActions,
} from "@/components/ui/mobile-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useUserProfile } from "@/hooks/useUserProfile";
import { buildSignMessage, EIP712_DOMAIN, EIP712_TYPES } from "@/lib/eip712";
import { BrowserProvider } from "ethers";
import { toast } from "sonner";

interface PolymarketConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

/**
 * Reusable Polymarket wallet connection dialog.
 * Extracted from ConnectedAccountsCard so it can be triggered from
 * Settings AND the H2E landing page (/hedge).
 */
export const PolymarketConnectDialog = ({
  open,
  onOpenChange,
  onConnected,
}: PolymarketConnectDialogProps) => {
  const isMobile = useIsMobile();
  const { user } = useUserProfile();
  const { verifyAndConnect, isVerifying, isDemoMode } = useConnectedAccounts();

  const [walletAddress, setWalletAddress] = useState("");
  const [step, setStep] = useState<"detect" | "signing" | "verifying">("detect");
  const [isDetectingWallet, setIsDetectingWallet] = useState(false);

  useEffect(() => {
    if (!open) {
      setWalletAddress("");
      setStep("detect");
      setIsDetectingWallet(false);
    }
  }, [open]);

  const isValidAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a);

  const handleDetectWallet = async () => {
    try {
      setIsDetectingWallet(true);

      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 900));
        setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
        toast.success("Wallet address detected");
        return;
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        toast.error("No wallet detected. Please open this page in a wallet-enabled browser or install MetaMask.");
        return;
      }

      await ethereum.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      setWalletAddress(signerAddress);
      toast.success("Wallet address detected");
    } catch (error: any) {
      console.error("Wallet detection error:", error);
      if (error?.code === 4001) {
        toast.error("Wallet connection request was rejected");
      } else {
        toast.error(error?.message || "Failed to detect wallet address");
      }
    } finally {
      setIsDetectingWallet(false);
    }
  };

  const handleConnect = async () => {
    if (!isValidAddress(walletAddress)) {
      toast.error("Please enter a valid Ethereum address (0x...)");
      return;
    }
    if (!user) return;

    try {
      setStep("signing");

      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 1500));
        setStep("verifying");
        await verifyAndConnect({
          walletAddress: walletAddress.toLowerCase(),
          signature: "0xdemo_signature_" + Date.now(),
          message: {
            platform: "polymarket",
            account: walletAddress.toLowerCase(),
            timestamp: Math.floor(Date.now() / 1000).toString(),
            nonce: crypto.randomUUID().slice(0, 8),
          },
          platform: "polymarket",
        });
        toast.success("Wallet connected and verified successfully!");
        onConnected?.();
        onOpenChange(false);
      } else {
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
          toast.error("No wallet detected. Please open this page in a wallet-enabled browser or install MetaMask.");
          setStep("detect");
          return;
        }
        await ethereum.request({ method: "eth_requestAccounts" });
        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();

        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          toast.error(
            `Connected wallet (${signerAddress.slice(0, 6)}...${signerAddress.slice(-6)}) does not match the entered address.`
          );
          setStep("detect");
          return;
        }

        const message = buildSignMessage("polymarket", user.id);
        const signature = await signer.signTypedData(EIP712_DOMAIN, EIP712_TYPES, {
          ...message,
          timestamp: BigInt(message.timestamp),
        });

        setStep("verifying");
        await verifyAndConnect({
          walletAddress: walletAddress.toLowerCase(),
          signature,
          message,
          platform: "polymarket",
        });

        toast.success("Wallet connected and verified successfully!");
        onConnected?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      if (error?.code === 4001) {
        toast.error("Signature request was rejected");
      } else {
        toast.error(error?.message || "Failed to connect wallet");
      }
      setStep("detect");
    }
  };

  const addressDetected = isValidAddress(walletAddress);
  const isProcessingConnection = step === "signing" || step === "verifying";
  const primaryConnectLabel = !addressDetected
    ? "Connect Wallet"
    : step === "signing"
      ? "Signing..."
      : step === "verifying"
        ? "Verifying..."
        : "Sign & Connect";
  const handlePrimaryConnectAction = addressDetected ? handleConnect : handleDetectWallet;

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        {addressDetected && (
          <>
            <label className="text-sm font-medium">Polymarket Wallet Address</label>
            <Input
              placeholder="0x..."
              value={walletAddress}
              className="font-mono h-12"
              readOnly
              disabled={isProcessingConnection || isDetectingWallet}
            />
          </>
        )}
        <p className="text-xs text-muted-foreground">
          {addressDetected
            ? "Address detected from your wallet. This cannot be edited."
            : "Connect the wallet you use on Polymarket. We'll detect the address automatically."}
        </p>
      </div>

      {step === "signing" && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Waiting for wallet signature...</p>
            <p className="text-xs text-muted-foreground">
              Please confirm in your wallet
            </p>
          </div>
        </div>
      )}

      {step === "verifying" && (
        <div className="bg-trading-green/10 border border-trading-green/20 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-trading-green" />
          <div>
            <p className="text-sm font-medium">Verifying on-chain...</p>
            <p className="text-xs text-muted-foreground">
              Confirming wallet ownership and linking your account
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const ctaButton = (
    <Button
      onClick={handlePrimaryConnectAction}
      disabled={isVerifying || isDetectingWallet || isProcessingConnection}
      className="btn-primary h-12 w-full"
    >
      {isDetectingWallet || isProcessingConnection ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isDetectingWallet ? "Connecting..." : primaryConnectLabel}
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          {primaryConnectLabel}
        </>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Connect Polymarket"
      >
        {formContent}
        <MobileDrawerActions>{ctaButton}</MobileDrawerActions>
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Polymarket</DialogTitle>
          <DialogDescription>
            Link your wallet to claim your free hedge airdrop
          </DialogDescription>
        </DialogHeader>
        {formContent}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <div className="flex-1">{ctaButton}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
