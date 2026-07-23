import { useState } from 'react';
import { Copy, Check, MoreHorizontal, AlertTriangle, Loader2, RefreshCw, Eye, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TokenConfig, getCustodyAddress } from '@/types/deposit';
import { LabelText, MonoText } from '@/components/typography';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useDeposit } from '@/hooks/useDeposit';
import { cn } from '@/lib/utils';
import { FullAddressSheet } from './FullAddressSheet';
import { ShareModal } from '@/components/ShareModal';
import { SharePosterContent } from './SharePosterContent';

interface DepositDetailsProps {
  token: TokenConfig;
}

export const DepositDetails = ({ token }: DepositDetailsProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const {
    pendingClaims,
    isClaiming,
    claimDeposit,
    formatTimeAgo,
    getCurrentAddress,
    generateNewAddress,
    isGeneratingAddress,
    isLoadingAddress,
  } = useDeposit(token.symbol);

  const custodyAddress = getCurrentAddress();

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(custodyAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimDeposit = async (depositId: string) => {
    setClaimingId(depositId);
    try {
      const mockSignature = '0x...mock_signature';
      await claimDeposit({ depositId, signature: mockSignature });
      toast.success('Deposit claimed successfully');
    } catch (error) {
      toast.error('Failed to claim deposit');
    } finally {
      setClaimingId(null);
    }
  };

  const handleDone = () => {
    navigate('/wallet');
  };

  const handleGenerateNewAddress = async () => {
    try {
      await generateNewAddress(token.symbol);
      toast.success('New deposit address generated');
    } catch (error) {
      toast.error('Failed to generate new address');
    }
  };

  const handleViewFullAddress = () => {
    setShowFullAddress(true);
  };

  // Filter pending claims for this token
  const tokenPendingClaims = pendingClaims.filter(c => c.token === token.symbol);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* QR Code */}
      <div className="flex justify-center">
        <div className="p-6 bg-white rounded-2xl">
          <QRCodeSVG 
            value={custodyAddress} 
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="text-center space-y-3">
        <LabelText size="sm" muted className="block">
          {token.symbol} deposit address
        </LabelText>
        <div className="px-4">
          <MonoText className="text-base leading-relaxed break-all">
            {custodyAddress}
          </MonoText>
        </div>
      </div>

      {/* Copy Button */}
      <div className="flex gap-2">
        <Button
          onClick={handleCopyAddress}
          className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy address
            </>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl border-border/50"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowShareModal(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share address
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleGenerateNewAddress}
              disabled={isGeneratingAddress}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isGeneratingAddress && "animate-spin")} />
              Generate new address
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewFullAddress}>
              <Eye className="w-4 h-4 mr-2" />
              View full address
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Full Address Sheet */}
      <FullAddressSheet
        open={showFullAddress}
        onOpenChange={setShowFullAddress}
        address={custodyAddress}
        tokenSymbol={token.symbol}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Address"
        subtitle="Share this deposit address with others"
        shareText={`Deposit ${token.symbol} to my OMENX wallet on ${token.network}`}
        shareUrl={`https://omenx.com/deposit?token=${token.symbol}`}
        fileName={`omenx-deposit-${token.symbol.toLowerCase()}`}
      >
        <SharePosterContent 
          address={custodyAddress} 
          token={token}
        />
      </ShareModal>

      {/* Info Table */}
      <div className="space-y-4 pt-4">
        <InfoRow 
          label="Network" 
          value={token.network}
          valueIcon={token.icon}
        />
        <InfoRow 
          label="Fee" 
          value={`${token.fee} ${token.symbol}`}
        />
        <InfoRow 
          label="Minimum deposit" 
          value={`${token.minAmount} ${token.symbol}`}
          underline
        />
        <InfoRow 
          label="Required network confirmations" 
          value={token.confirmationBlocks.toString()}
        />
        <InfoRow 
          label="Processing time" 
          value={token.estimatedTime}
          underline
        />
      </div>

      {/* Warning Notice */}
      <div className="p-4 bg-trading-yellow/10 border border-trading-yellow/30 rounded-xl">
        <p className="text-sm text-trading-yellow leading-relaxed">
          <span className="font-semibold">Important:</span> Only send {token.symbol} on the{' '}
          <span className="font-semibold">{token.network}</span> network. Sending other assets or 
          using a different network may result in permanent loss of funds.
        </p>
      </div>

      {/* Pending Claims Section */}
      {tokenPendingClaims.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-trading-yellow" />
            <LabelText size="sm" weight="semibold">
              Pending Deposits ({tokenPendingClaims.length})
            </LabelText>
          </div>
          <p className="text-xs text-muted-foreground">
            These deposits are below the minimum threshold and require manual claiming.
          </p>
          
          <div className="space-y-2">
            {tokenPendingClaims.map((deposit) => (
              <div 
                key={deposit.id}
                className="flex items-center justify-between p-3 bg-trading-yellow/5 border border-trading-yellow/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-trading-yellow/20 flex items-center justify-center text-lg">
                    {token.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">
                        {deposit.amount.toFixed(2)}
                      </span>
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

      {/* Done Button */}
      <div className="pt-4">
        <Button
          onClick={handleDone}
          variant="secondary"
          className="w-full h-12 rounded-xl"
        >
          Done
        </Button>
      </div>
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  valueIcon?: string;
  underline?: boolean;
}

const InfoRow = ({ label, value, valueIcon, underline }: InfoRowProps) => (
  <div className="flex items-center justify-between">
    <span className={cn(
      "text-sm text-muted-foreground",
      underline && "underline underline-offset-2 decoration-dashed"
    )}>
      {label}
    </span>
    <div className="flex items-center gap-2">
      {valueIcon && (
        <span className="text-base">{valueIcon}</span>
      )}
      <span className="text-sm font-medium">{value}</span>
    </div>
  </div>
);
