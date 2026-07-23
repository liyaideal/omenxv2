import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, MoreHorizontal, RefreshCw, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LabelText, MonoText } from '@/components/typography';
import { toast } from 'sonner';
import { useDeposit } from '@/hooks/useDeposit';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Base USDC config - hardcoded since we only support this
const BASE_USDC_CONFIG = {
  symbol: 'USDC' as const,
  name: 'USD Coin',
  network: 'Base',
  chainId: 8453,
  contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  decimals: 6,
  confirmationBlocks: 12,
  estimatedTime: '< 2 minutes',
  fee: 0,
};

const WARNING_ACK_KEY = 'omenx:deposit:base-usdc-warning-ack-v2';

const CHECKLIST_ITEMS = [
  {
    id: 'token',
    label: 'I am sending USDC (not USDT, ETH, BNB, or any other token)',
  },
  {
    id: 'network',
    label: 'I am using the Base network (not Ethereum, BSC, Polygon, Arbitrum, or any other chain)',
  },
  {
    id: 'address',
    label: 'I have double-checked the deposit address below before sending',
  },
] as const;

interface WalletDepositProps {
  onDone?: () => void;
  /**
   * Target account for the incoming deposit. Must be forwarded to any
   * `record-transaction` call so the tx row lands with the correct
   * `account` field (dual-account 2b). Selection lives in the parent
   * ("Deposit to" pre-screen); this sub-panel is a demo address display
   * today and doesn't itself credit balance, but the prop is threaded so
   * any future real credit path is account-safe by construction.
   */
  account?: 'spot' | 'futures';
}

export const WalletDeposit = ({ onDone, account: _account }: WalletDepositProps) => {
  const isMobile = useIsMobile();
  const { user } = useUserProfile();
  const [copied, setCopied] = useState(false);

  const {
    getCurrentAddress,
    generateNewAddress,
    isGeneratingAddress,
  } = useDeposit('USDC');

  const warningAckKey = useMemo(() => {
    if (!user?.id) return WARNING_ACK_KEY;
    return `${WARNING_ACK_KEY}:${user.id}`;
  }, [user?.id]);

  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWarningAcknowledged(window.localStorage.getItem(warningAckKey) === 'true');
  }, [warningAckKey]);

  const custodyAddress = getCurrentAddress();

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(custodyAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewAddress = async () => {
    try {
      await generateNewAddress('USDC');
      toast.success('New deposit address generated');
    } catch {
      toast.error('Failed to generate new address');
    }
  };

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const allChecked = CHECKLIST_ITEMS.every((item) => checkedItems[item.id]);

  const toggleItem = (id: string) =>
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAcknowledgeWarning = () => {
    if (!allChecked) return;
    window.localStorage.setItem(warningAckKey, 'true');
    setWarningAcknowledged(true);
  };

  const warningCard = (
    <div className={cn(
      "bg-trading-yellow/10 border border-trading-yellow/30 rounded-xl",
      warningAcknowledged ? "p-3" : "p-5"
    )}>
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-trading-yellow shrink-0 mt-0.5" />
        <div className={cn("text-trading-yellow leading-relaxed flex-1", warningAcknowledged ? "text-xs" : "text-sm space-y-4")}>
          <div>
            <span className="font-semibold">Only send USDC on Base network.</span>
            <br />
            Sending other tokens or using a different network may result in <span className="font-semibold">permanent loss of funds</span>.
          </div>

          {!warningAcknowledged && (
            <>
              <div className="space-y-2.5 pt-1">
                {CHECKLIST_ITEMS.map((item) => (
                  <label
                    key={item.id}
                    htmlFor={`deposit-ack-${item.id}`}
                    className="flex items-start gap-2.5 cursor-pointer select-none text-sm text-foreground"
                  >
                    <Checkbox
                      id={`deposit-ack-${item.id}`}
                      checked={!!checkedItems[item.id]}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-0.5 border-trading-yellow data-[state=checked]:bg-trading-yellow data-[state=checked]:text-background"
                    />
                    <span className="leading-snug">{item.label}</span>
                  </label>
                ))}
              </div>

              <Button
                onClick={handleAcknowledgeWarning}
                disabled={!allChecked}
                className={cn(
                  "w-full bg-trading-yellow text-background hover:bg-trading-yellow/90 disabled:opacity-40",
                  isMobile ? "h-12 rounded-xl" : "h-10 rounded-lg"
                )}
              >
                {allChecked ? 'Show deposit address' : 'Confirm all items above to continue'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-5", isMobile ? "px-4 py-5" : "p-5")}>
      {/* Base-USDC Only Warning */}
      {warningCard}

      {!warningAcknowledged ? null : (
        <>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className={cn("bg-white rounded-2xl", isMobile ? "p-6" : "p-4")}>
          <QRCodeSVG 
            value={custodyAddress} 
            size={isMobile ? 200 : 160}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Address Section */}
      <div className="text-center space-y-2">
        <LabelText size="sm" muted className="block">
          USDC deposit address (Base)
        </LabelText>
        <div className="px-2">
          <MonoText className={cn("leading-relaxed break-all", isMobile ? "text-xs" : "text-sm")}>
            {custodyAddress}
          </MonoText>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleCopyAddress}
          className={cn("flex-1 bg-primary hover:bg-primary-hover", isMobile ? "h-12 rounded-xl" : "h-10 rounded-lg")}
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
              className={cn("border-border/50", isMobile ? "h-12 w-12 rounded-xl" : "h-10 w-10 rounded-lg")}
            >
              <MoreHorizontal className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={handleGenerateNewAddress}
              disabled={isGeneratingAddress}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isGeneratingAddress && "animate-spin")} />
              Generate new address
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info Table */}
      <div className="space-y-3 pt-2">
        <InfoRow label="Network" value="Base" />
        <InfoRow label="Token" value="USDC" />
        <InfoRow label="Fee" value="0 USDC" />
        <InfoRow label="Confirmations" value={BASE_USDC_CONFIG.confirmationBlocks.toString()} />
        <InfoRow label="Processing time" value={BASE_USDC_CONFIG.estimatedTime} underline />
      </div>
        </>
      )}

      {/* Done Button (desktop only) */}
      {onDone && (
        <Button
          onClick={onDone}
          variant="secondary"
          className="w-full h-10 rounded-lg"
        >
          Done
        </Button>
      )}
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: string;
  underline?: boolean;
}

const InfoRow = ({ label, value, underline }: InfoRowProps) => (
  <div className="flex items-center justify-between text-sm">
    <span className={cn(
      "text-muted-foreground",
      underline && "underline underline-offset-2 decoration-dashed"
    )}>
      {label}
    </span>
    <span className="font-medium">{value}</span>
  </div>
);
