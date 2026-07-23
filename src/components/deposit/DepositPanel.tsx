import { useState } from 'react';
import { Copy, Check, AlertTriangle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MobileDrawer,
  MobileDrawerList,
  MobileDrawerListItem,
} from '@/components/ui/mobile-drawer';
import { useDeposit } from '@/hooks/useDeposit';
import { useIsMobile } from '@/hooks/use-mobile';
import { PriceText, AddressText, LabelText, MonoText } from '@/components/typography';
import { toast } from 'sonner';
import { SupportedToken } from '@/types/deposit';

interface DepositPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DepositPanel = ({ open, onOpenChange }: DepositPanelProps) => {
  const isMobile = useIsMobile();
  const {
    supportedTokens,
    getCustodyAddress,
    selectedToken,
    setSelectedToken,
    getTokenConfig,
    pendingClaims,
    isLoadingClaims,
    isClaiming,
    claimDeposit,
    formatTimeAgo,
    confirmationBlocks,
  } = useDeposit();

  const [copied, setCopied] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const tokenConfig = getTokenConfig(selectedToken);
  const custodyAddress = getCustodyAddress(selectedToken);
  const estimatedTime = confirmationBlocks * 3; // ~3 seconds per BSC block

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(custodyAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimDeposit = async (depositId: string) => {
    setClaimingId(depositId);
    try {
      // TODO: Implement actual EIP-712 signature request
      // For now, simulate the claim process
      const mockSignature = '0x...mock_signature';
      await claimDeposit({ depositId, signature: mockSignature });
      toast.success('Deposit claimed successfully');
    } catch (error) {
      toast.error('Failed to claim deposit');
    } finally {
      setClaimingId(null);
    }
  };

  // Filter only stablecoins for the panel (USDT/USDC)
  const stablecoins = supportedTokens.filter(t => ['USDT', 'USDC'].includes(t.symbol));

  const content = (
    <div className="space-y-6">
      {/* Network Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-trading-green animate-pulse" />
        <span>Network: {tokenConfig?.network || 'BSC (BNB Smart Chain)'}</span>
      </div>

      {/* Token Selection */}
      <div className="space-y-2">
        <LabelText size="sm" muted>Select Token</LabelText>
        <div className="flex gap-2">
          {stablecoins.map((token) => (
            <button
              key={token.symbol}
              onClick={() => setSelectedToken(token.symbol)}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                selectedToken === token.symbol
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 hover:border-border bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">
                  {token.icon}
                </span>
                <span className={`font-semibold ${
                  selectedToken === token.symbol ? 'text-primary' : ''
                }`}>
                  {token.symbol}
                </span>
                {selectedToken === token.symbol && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Deposit Address with QR */}
      <div className="space-y-3">
        <LabelText size="sm" muted>Deposit Address (BSC)</LabelText>
        
        {/* QR Code */}
        <div className="flex justify-center p-6 bg-white rounded-xl">
          <QRCodeSVG 
            value={custodyAddress} 
            size={160}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Address Display */}
        <div 
          onClick={handleCopyAddress}
          className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50 cursor-pointer hover:bg-muted/70 transition-colors"
        >
          <MonoText className="text-sm truncate flex-1 mr-2">
            {custodyAddress}
          </MonoText>
          <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            {copied ? (
              <Check className="w-5 h-5 text-trading-green" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Important Notices */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 p-3 bg-trading-yellow/10 border border-trading-yellow/30 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-trading-yellow shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-medium text-trading-yellow">Minimum: </span>
            <span className="text-muted-foreground">
              {tokenConfig?.minAmount} {selectedToken} for auto-credit
            </span>
          </div>
        </div>
        
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Estimated: </span>
            ~{estimatedTime} seconds ({confirmationBlocks} block confirmations)
          </div>
        </div>
      </div>

      {/* Pending Claims Section */}
      {pendingClaims.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-trading-yellow" />
            <LabelText size="sm" weight="semibold">
              Pending Deposits ({pendingClaims.length})
            </LabelText>
          </div>
          <p className="text-xs text-muted-foreground">
            These deposits are below the minimum threshold and require manual claiming.
          </p>
          
          <div className="space-y-2">
            {pendingClaims.map((deposit) => (
              <div 
                key={deposit.id}
                className="flex items-center justify-between p-3 bg-trading-yellow/5 border border-trading-yellow/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-trading-yellow/20 flex items-center justify-center">
                    <span className="text-lg">
                      {deposit.token === 'USDT' ? '💵' : '💲'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <PriceText 
                        value={deposit.amount} 
                        decimals={2}
                        className="font-semibold"
                      />
                      <span className="text-sm text-muted-foreground">
                        {deposit.token}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(deposit.createdAt)}
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleClaimDeposit(deposit.id)}
                  disabled={isClaiming}
                  className="bg-trading-yellow hover:bg-trading-yellow/90 text-background"
                >
                  {claimingId === deposit.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Claim'
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View on Explorer Link */}
      <div className="pt-2">
        <a 
          href={`https://bscscan.com/address/${custodyAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on BscScan
        </a>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <MobileDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Deposit"
        description="Send tokens to the address below"
      >
        {content}
      </MobileDrawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">⬇️</span>
            Deposit
          </DialogTitle>
          <DialogDescription>
            Send tokens to the address below
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
