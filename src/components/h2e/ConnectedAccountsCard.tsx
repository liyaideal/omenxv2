import { useState } from "react";
import { Info } from "lucide-react";
import { Plus, Loader2, X, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useUserProfile } from "@/hooks/useUserProfile";
import { buildSignMessage, EIP712_DOMAIN, EIP712_TYPES } from "@/lib/eip712";
import { toast } from "sonner";
import { STATUS_STYLES } from "@/lib/statusStyles";
import { BrowserProvider } from "ethers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MobileDrawer,
  MobileDrawerSection,
  MobileDrawerActions,
} from "@/components/ui/mobile-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AuthSheet } from "@/components/auth/AuthSheet";

const PLATFORMS = [
  {
    id: "polymarket",
    name: "Polymarket",
    logo: "/platform-logos/polymarket.png",
    description: "Connect your Polymarket wallet to receive counter-position airdrops",
    status: "available" as const,
  },
  {
    id: "kalshi",
    name: "Kalshi",
    logo: "/platform-logos/kalshi.png",
    description: "Kalshi integration coming soon",
    status: "coming_soon" as const,
  },
];

export const ConnectedAccountsCard = () => {
  const isMobile = useIsMobile();
  const { user } = useUserProfile();
  const {
    activeAccounts,
    isLoading,
    verifyAndConnect,
    isVerifying,
    disconnect,
    isDisconnecting,
    isDemoMode,
  } = useConnectedAccounts();

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [connectionStep, setConnectionStep] = useState<"detect" | "signing" | "verifying">("detect");
  const [isDetectingWallet, setIsDetectingWallet] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const resetDialog = () => {
    setWalletAddress("");
    setSelectedPlatform(null);
    setConnectionStep("detect");
    setIsDetectingWallet(false);
  };

  const handleOpenConnect = (platformId: string) => {
    // Signed-out guests never reach the connect modal — they get the same auth
    // surface as SignInPromptCard's "Log In" button on this page.
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSelectedPlatform(platformId);
    setConnectDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) resetDialog();
    setConnectDialogOpen(open);
  };

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);

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
      if (error.code === 4001) {
        toast.error("Wallet connection request was rejected");
      } else {
        toast.error(error.message || "Failed to detect wallet address");
      }
    } finally {
      setIsDetectingWallet(false);
    }
  };

  const handleConnectWallet = async () => {
    if (!isValidAddress(walletAddress)) {
      toast.error("Please enter a valid Ethereum address (0x...)");
      return;
    }
    if (!user || !selectedPlatform) return;

    try {
      // Step 1: Signing
      setConnectionStep("signing");

      if (isDemoMode) {
        // Demo: simulate wallet signature delay
        await new Promise((r) => setTimeout(r, 1500));

        // Step 2: Verifying
        setConnectionStep("verifying");

        const demoMessage = {
          platform: selectedPlatform,
          account: walletAddress.toLowerCase(),
          timestamp: Math.floor(Date.now() / 1000).toString(),
          nonce: crypto.randomUUID().slice(0, 8),
        };

        await verifyAndConnect({
          walletAddress: walletAddress.toLowerCase(),
          signature: "0xdemo_signature_" + Date.now(),
          message: demoMessage,
          platform: selectedPlatform,
        });

        toast.success("Wallet connected and verified successfully!");
        handleCloseDialog(false);
      } else {
        // Production: real Web3 flow
        const ethereum = (window as any).ethereum;
        if (!ethereum) {
          toast.error("No Web3 wallet detected. Please install MetaMask or use WalletConnect.");
          setConnectionStep("detect");
          return;
        }

        await ethereum.request({ method: "eth_requestAccounts" });

        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();

        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          toast.error(
            `Connected wallet (${signerAddress.slice(0, 6)}...${signerAddress.slice(-6)}) does not match the entered address. Please switch to the correct wallet.`
          );
          setConnectionStep("detect");
          return;
        }

        const message = buildSignMessage(selectedPlatform, user.id);
        const signature = await signer.signTypedData(
          EIP712_DOMAIN,
          EIP712_TYPES,
          {
            ...message,
            timestamp: BigInt(message.timestamp),
          }
        );

        setConnectionStep("verifying");

        await verifyAndConnect({
          walletAddress: walletAddress.toLowerCase(),
          signature,
          message,
          platform: selectedPlatform,
        });

        toast.success("Wallet connected and verified successfully!");
        handleCloseDialog(false);
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      if (error.code === 4001) {
        toast.error("Signature request was rejected");
      } else {
        toast.error(error.message || "Failed to connect wallet");
      }
      setConnectionStep("detect");
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await disconnect(accountId);
      toast.success("Account disconnected");
    } catch {
      toast.error("Failed to disconnect account");
    }
  };

  // Find active account for each platform
  const getAccountForPlatform = (platformId: string) =>
    activeAccounts.find((a) => a.platform === platformId);

  const addressDetected = isValidAddress(walletAddress);
  const isProcessingConnection = connectionStep === "signing" || connectionStep === "verifying";
  const primaryConnectLabel = !addressDetected
    ? "Connect Wallet"
    : connectionStep === "signing"
      ? "Signing..."
      : connectionStep === "verifying"
        ? "Verifying..."
        : "Sign & Connect";
  const handlePrimaryConnectAction = addressDetected ? handleConnectWallet : handleDetectWallet;

  const connectFormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        {addressDetected && (
          <>
            <label className="text-sm font-medium">
              {PLATFORMS.find((p) => p.id === selectedPlatform)?.name} Wallet Address
            </label>
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
            : `Connect the wallet you use on ${PLATFORMS.find((p) => p.id === selectedPlatform)?.name}. We'll detect the address automatically.`}
        </p>
      </div>

      {connectionStep === "signing" && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Waiting for wallet signature...</p>
            <p className="text-xs text-muted-foreground">
              Please confirm the signature request in your wallet
            </p>
          </div>
        </div>
      )}

      {connectionStep === "verifying" && (
        <div className="bg-trading-green/10 border border-trading-green/20 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-trading-green" />
          <div>
            <p className="text-sm font-medium">Verifying on-chain...</p>
            <p className="text-xs text-muted-foreground">
              Confirming wallet ownership and linking account
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Mobile: use MobileDrawer; Desktop: use Dialog
  const renderConnectModal = () => {
    if (isMobile) {
      return (
        <MobileDrawer
          open={connectDialogOpen}
          onOpenChange={handleCloseDialog}
          title={`Connect ${PLATFORMS.find((p) => p.id === selectedPlatform)?.name || ""}`}
        >
          {connectFormContent}
          <MobileDrawerActions>
            <Button
              onClick={handlePrimaryConnectAction}
              disabled={isVerifying || isDetectingWallet || isProcessingConnection}
              className="w-full btn-primary h-12"
            >
              {isDetectingWallet || isProcessingConnection ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isDetectingWallet ? "Connecting..." : primaryConnectLabel}</>
              ) : (
                <><Wallet className="w-4 h-4 mr-2" /> {primaryConnectLabel}</>
              )}
            </Button>
          </MobileDrawerActions>
        </MobileDrawer>
      );
    }

    return (
      <Dialog open={connectDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Connect {PLATFORMS.find((p) => p.id === selectedPlatform)?.name}
            </DialogTitle>
            <DialogDescription>
              Link your external wallet to receive counter-position airdrops
            </DialogDescription>
          </DialogHeader>
          {connectFormContent}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => handleCloseDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePrimaryConnectAction}
              disabled={isVerifying || isDetectingWallet || isProcessingConnection}
              className="flex-1 btn-primary"
            >
              {isDetectingWallet || isProcessingConnection ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isDetectingWallet ? "Connecting..." : primaryConnectLabel}</>
              ) : (
                <><Wallet className="w-4 h-4 mr-2" /> {primaryConnectLabel}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <div className="rounded-[16px] border border-[#1D2026] bg-[#131519] p-4 md:p-[18px]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">CONNECTED ACCOUNTS</div>
            <p className="mt-1 text-[12px] text-[#9AA1AC]">
              Link external prediction market wallets to receive hedge airdrops
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {PLATFORMS.map((platform) => {
            const account = getAccountForPlatform(platform.id);
            const isComingSoon = platform.status === "coming_soon";

            return (
              <div
                key={platform.id}
                className="rounded-[12px] border border-[#1D2026] bg-[#0F1114] p-[13px_14px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                    <img src={platform.logo} alt={platform.name} className="w-full h-full object-contain rounded-sm" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{platform.name}</span>
                      {isComingSoon && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Coming Soon
                        </Badge>
                      )}
                      {account && (
                        <Badge className={`${STATUS_STYLES.success.badge} text-[10px] px-1.5 py-0`}>
                          Connected
                        </Badge>
                      )}
                    </div>
                    <div className="shrink-0">
                      {account ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(account.id)}
                          disabled={isDisconnecting}
                          className="text-destructive hover:text-destructive h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      ) : !isComingSoon ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenConnect(platform.id)}
                          className="rounded-[10px] bg-white text-[#0A0B0D] font-display font-bold text-[12.5px] px-3.5 h-8 hover:bg-[#E6E9EE]"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Connect
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
                {/* Description / account details below */}
                <div className="mt-2 pl-[52px]">
                  {account ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {account.displayAddress}
                      </p>
                      {account.scanStatus === "scanning" ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Scanning positions...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Positions: <span className="text-foreground font-medium">{account.positionsDetected}</span></span>
                          <button
                            type="button"
                            onClick={() =>
                              document
                                .getElementById("airdropped-positions")
                                ?.scrollIntoView({ behavior: "smooth", block: "start" })
                            }
                            className="hover:underline"
                          >
                            Airdrops: <span className="text-trading-green font-medium">{account.airdropsReceived}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {platform.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Eligibility explainer */}
        <div className="mt-4 rounded-[12px] border border-[#1D2026] bg-[#0F1115] px-4 py-3.5">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
            <Info className="w-3.5 h-3.5 text-[#33D6FF]" /> Which positions qualify for airdrops?
          </div>
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Qualifies</div>
              <div className="grid grid-cols-[52px_1fr] items-baseline gap-x-2.5 gap-y-1 text-[11px] text-[#9AA1AC]">
                <span className="font-display text-[12px] font-semibold text-[#F2F3F5]">&ge; $20</span><span>position notional on Polymarket</span>
                <span className="font-display text-[12px] font-semibold text-[#F2F3F5]">&ge; 1 day</span><span>position held</span>
                <span className="font-display text-[12px] font-semibold text-[#F2F3F5]">&ge; 24h</span><span>until the matching OmenX event resolves</span>
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">Limits</div>
              <div className="grid grid-cols-[52px_1fr] items-baseline gap-x-2.5 gap-y-1 text-[11px] text-[#9AA1AC]">
                <span className="font-display text-[12px] font-semibold text-[#F2F3F5]">3</span><span>active airdrops at a time</span>
                <span className="font-display text-[12px] font-semibold text-[#F2F3F5]">72h</span><span>to activate, or the airdrop expires</span>
                <span className="font-display text-[12px] font-semibold text-[#F2F3F5]">$100</span><span>lifetime earnings per account</span>
              </div>
            </div>
          </div>
          <div className="mt-3 border-t border-[#1D2026] pt-2.5 text-[12px] text-[#C9CED6]">
            Each qualifying position receives a <span className="font-display font-semibold text-[#33D6FF]">$10 hedge</span> on the counter side.
          </div>
        </div>
      </div>

      {renderConnectModal()}

      {isMobile ? (
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      ) : (
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      )}
    </>
  );
};
