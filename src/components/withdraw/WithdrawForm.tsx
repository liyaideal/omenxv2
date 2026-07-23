import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, CheckCircle2, ChevronDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TokenConfig } from '@/types/deposit';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useWallets } from '@/hooks/useWallets';
import { useH2eRewardsSummary } from '@/hooks/useH2eRewardsSummary';
import { LabelText, MonoText } from '@/components/typography';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WithdrawAddressSelect } from './WithdrawAddressSelect';
import { WithdrawStatusTracker } from './WithdrawStatusTracker';
import { WithdrawVerifyDialog } from './WithdrawVerifyDialog';

interface WithdrawFormProps {
  token: TokenConfig;
  onBack: () => void;
}

export const WithdrawForm = ({ token, onBack }: WithdrawFormProps) => {
  const navigate = useNavigate();
  const { wallets } = useWallets();
  const h2e = useH2eRewardsSummary();
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
  } = useWithdraw();

  // Deduct frozen H2E balance from withdrawable amount
  const availableBalance = Math.max(0, rawAvailableBalance - h2e.lockedAmount);

  const [amount, setAmount] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddressSelect, setShowAddressSelect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const fee = getWithdrawFee(token.symbol);
  const minAmount = getWithdrawMinimum(token.symbol);
  const netAmount = calculateNetAmount(token.symbol, amount);

  // Auto-select primary wallet
  useEffect(() => {
    const primaryWallet = wallets.find(w => w.isPrimary);
    if (primaryWallet && !selectedAddress) {
      setSelectedAddress(primaryWallet.fullAddress);
    }
  }, [wallets, selectedAddress]);

  const selectedWallet = wallets.find(w => w.fullAddress === selectedAddress);

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal
    if (!/^\d*\.?\d*$/.test(value)) return;
    setAmount(value);
    const parsed = parseFloat(value);
    if (value && parsed > 0 && parsed < minAmount) {
      setError(`Minimum withdrawal is ${minAmount} ${token.symbol}`);
    } else {
      setError(null);
    }
  };

  const handleSetMax = () => {
    const maxAmount = Math.max(0, availableBalance - fee);
    setAmount(maxAmount.toString());
    setError(null);
  };

  const doSubmit = async () => {
    try {
      await submitWithdrawal({
        token: token.symbol,
        amount,
        toAddress: selectedAddress,
        network: selectedWallet?.network,
      });
      toast.success('Withdrawal request submitted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit withdrawal');
    }
  };

  const handleSubmit = () => {
    const validationError = validateWithdrawal({
      token: token.symbol,
      amount,
      toAddress: selectedAddress,
      network: selectedWallet?.network,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    // Open verification dialog; actual submit fires only after verification passes.
    setVerifyOpen(true);
  };

  // If we have a current withdrawal, show status tracker
  if (currentWithdrawal) {
    return (
      <WithdrawStatusTracker 
        withdrawal={currentWithdrawal} 
        token={token}
        onDone={() => navigate('/wallet')}
      />
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Token Info */}
      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
          {token.icon}
        </div>
        <div>
          <div className="font-semibold">{token.symbol}</div>
          <div className="text-sm text-muted-foreground">{token.network}</div>
        </div>
      </div>

      {/* Withdrawal Address */}
      <div className="space-y-2">
        <LabelText size="sm" muted>Withdrawal Address</LabelText>
        <button
          onClick={() => setShowAddressSelect(true)}
          className="w-full flex items-center justify-between p-4 bg-muted/30 border border-border/50 rounded-xl hover:bg-muted/50 transition-colors"
        >
          {selectedWallet ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center p-2">
                <img src={selectedWallet.icon} alt={selectedWallet.network} className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-medium">{selectedWallet.label}</div>
                <MonoText className="text-sm text-muted-foreground">
                  {selectedWallet.address}
                </MonoText>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Wallet className="w-5 h-5" />
              <span>Select withdrawal address</span>
            </div>
          )}
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <LabelText size="sm" muted>Amount</LabelText>
          <button
            onClick={handleSetMax}
            className="text-xs text-primary font-medium hover:underline"
          >
            MAX
          </button>
        </div>
        <div className="relative">
          <Input
            type="text"
            inputMode="decimal"
            placeholder={`Min ${minAmount}`}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={cn(
              "h-14 text-xl font-mono pr-20 bg-muted/30 border-border/50 rounded-xl",
              error && "border-trading-red focus-visible:ring-trading-red"
            )}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            {token.symbol}
          </div>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-trading-red text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Available: <span className="font-mono">{availableBalance.toFixed(2)}</span> {token.symbol}</span>
          <span>Min <span className="font-mono">{minAmount}</span> {token.symbol}</span>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-3 p-4 bg-muted/20 rounded-xl border border-border/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Network Fee</span>
          <MonoText className="font-medium">{fee} {token.symbol}</MonoText>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Minimum</span>
          <MonoText className="font-medium">{minAmount} {token.symbol}</MonoText>
        </div>
        <div className="h-px bg-border/50" />
        <div className="flex items-center justify-between">
          <span className="font-medium">You'll Receive</span>
          <MonoText className="text-lg font-bold">
            {netAmount.toFixed(token.decimals > 8 ? 4 : 2)} {token.symbol}
          </MonoText>
        </div>
      </div>

      {/* Limits Info */}
      <div className="p-4 bg-muted/20 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Daily Limit</span>
          <MonoText>{limits.dailyLimit.toLocaleString()} {token.symbol}</MonoText>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Remaining Today</span>
          <MonoText className="text-trading-green">{limits.dailyRemaining.toLocaleString()} {token.symbol}</MonoText>
        </div>
      </div>

      {/* Warning */}
      <div className="p-4 bg-trading-yellow/10 border border-trading-yellow/30 rounded-xl">
        <p className="text-sm text-trading-yellow leading-relaxed">
          <span className="font-semibold">Important:</span> Ensure the withdrawal address supports{' '}
          <span className="font-semibold">{token.network}</span>. Sending to an incompatible address 
          may result in permanent loss of funds.
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !amount || !selectedAddress || parseFloat(amount) < minAmount}
        className="w-full h-14 rounded-xl bg-primary hover:bg-primary-hover text-lg font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Withdraw'
        )}
      </Button>

      {/* Address Selection Sheet */}
      <WithdrawAddressSelect
        open={showAddressSelect}
        onClose={() => setShowAddressSelect(false)}
        selectedAddress={selectedAddress}
        onSelectAddress={(address) => {
          setSelectedAddress(address);
          setShowAddressSelect(false);
        }}
      />

      {/* Multi-step withdrawal verification (email OTP / TOTP) */}
      <WithdrawVerifyDialog
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onVerified={doSubmit}
      />
    </div>
  );
};
