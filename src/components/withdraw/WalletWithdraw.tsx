import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, ChevronDown, Wallet, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useWallets } from '@/hooks/useWallets';
import { useH2eRewardsSummary } from '@/hooks/useH2eRewardsSummary';
import { LabelText, MonoText } from '@/components/typography';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WithdrawAddressSelect } from './WithdrawAddressSelect';
import { WithdrawAddressSelectDialog } from './WithdrawAddressSelectDialog';
import { WithdrawStatusTracker } from './WithdrawStatusTracker';
import { WithdrawVerifyDialog } from './WithdrawVerifyDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { AccountPicker, AccountPickerRows } from '@/components/wallet/AccountPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAccountPreference, ACCOUNT_LABEL } from '@/hooks/useAccountPreference';

interface WalletWithdrawProps {
  onDone?: () => void;
}

export const WalletWithdraw = ({ onDone }: WalletWithdrawProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { wallets } = useWallets();
  const h2e = useH2eRewardsSummary();
  const { account: withdrawAccount, setAccount: setWithdrawAccount } = useAccountPreference('withdraw');
  const effectiveAccount = withdrawAccount ?? 'futures';
  const {
    availableBalance: rawAvailableBalance,
    limits,
    isSubmitting,
    currentWithdrawal,
    submitWithdrawal,
    validateWithdrawal,
    calculateNetAmount,
    getWithdrawFee,
    getWithdrawMinimum,
  } = useWithdraw(effectiveAccount);

  // H2E lock only applies to Futures Account (rewards live there).
  const availableBalance = effectiveAccount === 'futures'
    ? Math.max(0, rawAvailableBalance - h2e.lockedAmount)
    : rawAvailableBalance;

  const [amount, setAmount] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddressSelect, setShowAddressSelect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  const fee = getWithdrawFee('USDC');
  const minAmount = getWithdrawMinimum('USDC');
  const netAmount = calculateNetAmount('USDC', amount);

  useEffect(() => {
    const primaryWallet = wallets.find(w => w.isPrimary);
    if (primaryWallet && !selectedAddress) {
      setSelectedAddress(primaryWallet.fullAddress);
    }
  }, [wallets, selectedAddress]);

  const selectedWallet = wallets.find(w => w.fullAddress === selectedAddress);

  const handleAmountChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setAmount(value);
    const parsed = parseFloat(value);
    if (value && parsed > 0 && parsed < minAmount) {
      setError(`Minimum withdrawal is ${minAmount} USDC`);
    } else {
      setError(null);
    }
  };

  const handleSetMax = () => {
    const maxAmount = Math.max(0, availableBalance - fee);
    setAmount(maxAmount.toString());
    setError(null);
  };

  const handleSubmit = () => {
    const validationError = validateWithdrawal({
      token: 'USDC',
      amount,
      toAddress: selectedAddress,
      network: selectedWallet?.network,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    setVerifyOpen(true);
  };

  const doSubmit = async () => {
    try {
      await submitWithdrawal({
        token: 'USDC',
        amount,
        toAddress: selectedAddress,
        network: selectedWallet?.network,
        account: effectiveAccount,
      });
      toast.success('Withdrawal request submitted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit withdrawal');
    }
  };

  const handleDone = () => {
    if (onDone) onDone();
    else navigate('/wallet');
  };

  // Mock token config for status tracker
  const mockTokenConfig = {
    symbol: 'USDC' as const,
    name: 'USD Coin',
    icon: '💲',
    network: 'Base',
    chainId: 8453,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    minAmount: 10,
    confirmationBlocks: 12,
    estimatedTime: '< 2 minutes',
    fee: 0,
  };

  if (currentWithdrawal) {
    return (
      <div className={cn(isMobile ? "px-4 py-5" : "p-5")}>
        <WithdrawStatusTracker 
          withdrawal={currentWithdrawal} 
          token={mockTokenConfig}
          onDone={handleDone}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", isMobile ? "px-4 py-5" : "p-5")}>
      {/* Base-USDC info */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
        <img src="/chain-logos/base.svg" alt="Base" className="w-10 h-10" />
        <div>
          <div className="font-semibold text-sm">USDC</div>
          <div className="text-xs text-muted-foreground">Base Network</div>
        </div>
      </div>

      {/* From account */}
      <div className="space-y-2">
        <LabelText size="sm" muted>From account</LabelText>
        {isMobile ? (
          <button
            onClick={() => setAccountPickerOpen(true)}
            className="w-full flex items-center justify-between bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors p-4 rounded-xl"
          >
            <div className="text-left">
              <div className="text-sm font-medium">{ACCOUNT_LABEL[effectiveAccount]}</div>
              <div className="text-xs text-muted-foreground font-mono">
                Available: {availableBalance.toFixed(2)} USDC
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : (
          <Popover open={accountPickerOpen} onOpenChange={setAccountPickerOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-full flex items-center justify-between bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors p-3 rounded-lg"
              >
                <div className="text-left">
                  <div className="text-sm font-medium">{ACCOUNT_LABEL[effectiveAccount]}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Available: {availableBalance.toFixed(2)} USDC
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={6} className="w-[--radix-popover-trigger-width] p-2">
              <AccountPickerRows
                selected={effectiveAccount}
                onSelect={(a) => {
                  setWithdrawAccount(a);
                  setAccountPickerOpen(false);
                  setAmount('');
                  setError(null);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Withdrawal Address */}
      <div className="space-y-2">
        <LabelText size="sm" muted>Withdrawal Address</LabelText>
        <button
          onClick={() => setShowAddressSelect(true)}
          className={cn(
            "w-full flex items-center justify-between bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors",
            isMobile ? "p-4 rounded-xl" : "p-3 rounded-lg"
          )}
        >
          {selectedWallet ? (
            <div className="flex items-center gap-2">
              <img src={selectedWallet.icon} alt={selectedWallet.network} className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium text-sm">{selectedWallet.label}</div>
                <MonoText className="text-xs text-muted-foreground">{selectedWallet.address}</MonoText>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Select withdrawal address</span>
            </div>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <LabelText size="sm" muted>Amount</LabelText>
          <button onClick={handleSetMax} className="text-xs text-primary font-medium hover:underline">MAX</button>
        </div>
        <div className="relative">
          <Input
            type="text"
            inputMode="decimal"
            placeholder={`Min ${minAmount}`}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={cn(
              "font-mono pr-16 bg-muted/30 border-border/50 h-12 text-2xl rounded-lg",
              isMobile && "rounded-xl pr-20",
              error && "border-trading-red focus-visible:ring-trading-red"
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">USDC</div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-trading-red text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Available: <span className="font-mono">{availableBalance.toFixed(2)}</span> USDC</span>
          <span>Min <span className="font-mono">{minAmount}</span> USDC</span>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-2 p-3 bg-muted/20 rounded-xl border border-border/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Network Fee</span>
          <MonoText className="font-medium">{fee} USDC</MonoText>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Minimum</span>
          <MonoText className="font-medium">{minAmount} USDC</MonoText>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">You'll Receive</span>
          <MonoText className="text-sm font-bold">{netAmount.toFixed(2)} USDC</MonoText>
        </div>
      </div>

      {/* Warning */}
      <div className="p-3 bg-trading-yellow/10 border border-trading-yellow/30 rounded-xl">
        <p className="text-xs text-trading-yellow leading-relaxed">
          <span className="font-semibold">Important:</span> Only Base network addresses are supported. Sending to an incompatible address may result in permanent loss.
        </p>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !amount || !selectedAddress || parseFloat(amount) < minAmount}
        className={cn("w-full bg-primary hover:bg-primary-hover font-semibold", isMobile ? "h-12 rounded-xl text-sm" : "h-11 rounded-lg")}
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
        ) : (
          'Withdraw'
        )}
      </Button>

      {/* Address Selection */}
      {isMobile ? (
        <WithdrawAddressSelect
          open={showAddressSelect}
          onClose={() => setShowAddressSelect(false)}
          selectedAddress={selectedAddress}
          onSelectAddress={(addr) => { setSelectedAddress(addr); setShowAddressSelect(false); }}
        />
      ) : (
        <WithdrawAddressSelectDialog
          open={showAddressSelect}
          onClose={() => setShowAddressSelect(false)}
          selectedAddress={selectedAddress}
          onSelectAddress={(addr) => { setSelectedAddress(addr); setShowAddressSelect(false); }}
        />
      )}

      {/* Multi-step withdrawal verification (email OTP / TOTP) */}
      <WithdrawVerifyDialog
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onVerified={doSubmit}
      />

      {/* From-account picker (mobile Sheet only; desktop uses inline Popover above) */}
      {isMobile && (
        <AccountPicker
          open={accountPickerOpen}
          onOpenChange={setAccountPickerOpen}
          selected={effectiveAccount}
          onSelect={(a) => {
            setWithdrawAccount(a);
            setAccountPickerOpen(false);
            setAmount('');
            setError(null);
          }}
          title="From account"
        />
      )}
    </div>
  );
};
