import { useState, useEffect } from 'react';
import { ArrowDown, Loader2, Check, X, ExternalLink, RotateCcw, AlertCircle, ChevronDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWallets } from '@/hooks/useWallets';
import { MonoText } from '@/components/typography';
import { SettingsButton, SettingsPanel } from '@/components/deposit/CrossChainSettings';
import { WithdrawAddressSelect } from './WithdrawAddressSelect';
import { WithdrawAddressSelectDialog } from './WithdrawAddressSelectDialog';

const DEST_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', icon: '/chain-logos/ethereum.svg', chainId: 1 },
  { id: 'arbitrum', name: 'Arbitrum', icon: '/chain-logos/arbitrum.svg', chainId: 42161 },
  { id: 'bnb', name: 'BNB Chain', icon: '/chain-logos/bnb.svg', chainId: 56 },
  { id: 'polygon', name: 'Polygon', icon: '/chain-logos/polygon.svg', chainId: 137 },
];

const DEST_TOKENS: Record<string, { symbol: string; name: string }[]> = {
  ethereum: [{ symbol: 'USDC', name: 'USD Coin' }, { symbol: 'USDT', name: 'Tether' }, { symbol: 'ETH', name: 'Ethereum' }],
  arbitrum: [{ symbol: 'USDC', name: 'USD Coin' }, { symbol: 'USDT', name: 'Tether' }, { symbol: 'ETH', name: 'Ethereum' }],
  bnb: [{ symbol: 'USDC', name: 'USD Coin' }, { symbol: 'USDT', name: 'Tether' }, { symbol: 'BNB', name: 'BNB' }],
  polygon: [{ symbol: 'USDC', name: 'USD Coin' }, { symbol: 'USDT', name: 'Tether' }, { symbol: 'MATIC', name: 'Polygon' }],
};

type Step = 'swap' | 'review' | 'processing' | 'result';

export const CrossChainWithdraw = () => {
  const isMobile = useIsMobile();
  const { balance } = useUserProfile();
  const { wallets } = useWallets();
  const [step, setStep] = useState<Step>('swap');
  const [toChain, setToChain] = useState('ethereum');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddressSelect, setShowAddressSelect] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [txResult, setTxResult] = useState<'success' | 'failed'>('success');
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(-1);

  // Auto-select primary wallet
  useEffect(() => {
    const primaryWallet = wallets.find(w => w.isPrimary);
    if (primaryWallet && !selectedAddress) {
      setSelectedAddress(primaryWallet.fullAddress);
    }
  }, [wallets, selectedAddress]);

  const selectedWallet = wallets.find(w => w.fullAddress === selectedAddress);
  const selectedChain = DEST_CHAINS.find(c => c.id === toChain);
  const parsedAmount = parseFloat(amount) || 0;
  const isStable = ['USDC', 'USDT'].includes(toToken);
  const mockRate = isStable ? 1 : toToken === 'ETH' ? 1 / 3500 : toToken === 'BNB' ? 1 / 600 : toToken === 'MATIC' ? 1 / 0.8 : 1;
  const estimatedReceive = parsedAmount * mockRate;
  const gasFee = 0.5;

  const canProceed = parsedAmount > 0 && parsedAmount <= balance && !!selectedAddress;

  const handleReview = () => setStep('review');

  const handleConfirm = () => {
    setStep('processing');
    setProcessingStage(0);
    setTimeout(() => setProcessingStage(1), 2000);
    setTimeout(() => setProcessingStage(2), 5000);
    setTimeout(() => { setTxResult('success'); setStep('result'); }, 7000);
  };

  const handleRetry = () => {
    setStep('swap');
    setAmount('');
    setProcessingStage(0);
  };

  // ── Main Swap Card ──
  if (step === 'swap') {
    return (
      <div className={cn("space-y-4", isMobile ? "px-4 py-5" : "p-5")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Swap</h3>
          <div className="flex items-center gap-2">
            <SettingsButton onClick={() => setShowSettings(!showSettings)} />
          </div>
        </div>

        {/* Settings Panel */}
        <SettingsPanel
          open={showSettings}
          onClose={() => setShowSettings(false)}
          slippage={slippage}
          onSlippageChange={setSlippage}
        />

        {/* From (OmenX Wallet — USDC Base) */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">From</span>
            <button
              onClick={() => setAmount(balance.toString())}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Bal: <span className="font-mono">{balance.toFixed(2)}</span>
              <span className="ml-1 text-primary font-medium">MAX</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 h-12 text-2xl font-mono bg-transparent border-none shadow-none focus-visible:ring-0 p-0"
            />
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border/50">
              <img src="/chain-logos/base.svg" alt="Base" className="w-5 h-5" />
              <span className="font-medium text-sm">USDC</span>
              <span className="text-xs text-muted-foreground">Base</span>
            </div>
          </div>
          {parsedAmount > balance && (
            <p className="text-xs text-trading-red flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Insufficient balance
            </p>
          )}
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center shadow-sm">
            <ArrowDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* To */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">To</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-2xl font-mono font-semibold">
              {parsedAmount > 0 ? estimatedReceive.toFixed(isStable ? 2 : 6) : '0.00'}
            </span>
            <Select value={`${toChain}-${toToken}`} onValueChange={(v) => {
              const [chain, token] = v.split('-');
              setToChain(chain);
              setToToken(token);
            }}>
              <SelectTrigger className="w-auto min-w-[140px] h-10 rounded-full bg-card border-border/50 gap-2">
                <div className="flex items-center gap-2">
                  {selectedChain && <img src={selectedChain.icon} alt="" className="w-5 h-5" />}
                  <span className="font-medium">{toToken}</span>
                  <span className="text-xs text-muted-foreground">{selectedChain?.name}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {DEST_CHAINS.map(chain =>
                  (DEST_TOKENS[chain.id] || []).map(token => (
                    <SelectItem key={`${chain.id}-${token.symbol}`} value={`${chain.id}-${token.symbol}`}>
                      <div className="flex items-center gap-2">
                        <img src={chain.icon} alt="" className="w-4 h-4" />
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground">{chain.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Receive address inside To card */}
          <button
            onClick={() => setShowAddressSelect(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-card/50 border border-border/30 hover:bg-card transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Receive to:</span>
              {selectedWallet ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-trading-green" />
                  <img src={selectedWallet.icon} alt="" className="w-4 h-4" />
                  <MonoText className="text-xs">{selectedWallet.address}</MonoText>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Select address</span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Inline Quote */}
        {parsedAmount > 0 && (
          <div className="space-y-2 px-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rate</span>
              <span className="font-mono">1 USDC = {(1 / mockRate).toFixed(isStable ? 2 : 4)} {toToken}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bridge Fee</span>
              <span className="font-mono text-trading-green">Free</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Est. Gas</span>
              <span className="font-mono">~${gasFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slippage</span>
              <span className="font-mono">{slippage === -1 ? '~0.5% ~ Suggested' : `${slippage}%`}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Est. Time</span>
              <span className="font-mono">~2 min</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={handleReview}
          disabled={!canProceed}
          className={cn("w-full bg-primary hover:bg-primary-hover font-semibold", isMobile ? "h-12 rounded-xl" : "h-10 rounded-lg")}
        >
          {!selectedAddress
            ? 'Select Address'
            : parsedAmount <= 0
              ? 'Enter Amount'
              : parsedAmount > balance
                ? 'Insufficient Balance'
                : 'Review Bridge'}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          Powered by <span className="font-semibold">SOCKET</span>
        </p>

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
      </div>
    );
  }

  // ── Review ──
  if (step === 'review') {
    return (
      <div className={cn("space-y-5", isMobile ? "px-4 py-5" : "p-5")}>
        <div className="text-center"><h3 className="text-lg font-semibold">Confirm Bridge Withdrawal</h3></div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/chain-logos/base.svg" alt="Base" className="w-5 h-5" />
              <span className="text-sm">USDC on Base</span>
            </div>
            <span className="font-mono font-semibold">{parsedAmount}</span>
          </div>
          <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-muted-foreground" /></div>
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedChain && <img src={selectedChain.icon} alt="" className="w-5 h-5" />}
              <span className="text-sm">{toToken} on {selectedChain?.name}</span>
            </div>
            <span className="font-mono font-semibold text-trading-green">~{estimatedReceive.toFixed(isStable ? 2 : 6)}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/30 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Min. Receive</span><span className="font-mono">{(estimatedReceive * (1 - (slippage === -1 ? 0.5 : slippage) / 100)).toFixed(isStable ? 2 : 6)} {toToken}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Exchange Rate</span><span className="font-mono">1 USDC = {(1 / mockRate).toFixed(isStable ? 2 : 4)} {toToken}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bridge Fee</span><span className="font-mono text-trading-green">Free</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Est. Gas</span><span className="font-mono">~${gasFee.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Swap Slippage</span><span className="font-mono">{slippage === -1 ? '0.5% ~ Suggested' : `${slippage}%`}</span></div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground">Receive to</p>
          {selectedWallet ? (
            <div className="flex items-center gap-2 mt-1">
              <img src={selectedWallet.icon} alt="" className="w-4 h-4" />
              <span className="text-sm font-medium">{selectedWallet.label}</span>
              <MonoText className="text-xs text-muted-foreground">{selectedWallet.address}</MonoText>
            </div>
          ) : (
            <code className="text-xs text-foreground break-all">{selectedAddress}</code>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('swap')} className="flex-1">Back</Button>
          <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary-hover">Confirm & Bridge</Button>
        </div>
      </div>
    );
  }

  // ── Processing ──
  if (step === 'processing') {
    const stages = [
      { label: 'OmenX withdrawal approved', done: processingStage >= 1 },
      { label: 'Cross-chain bridging', done: processingStage >= 2 },
      { label: `${selectedChain?.name || 'Destination'} confirmation`, done: processingStage >= 3 },
    ];
    const progress = processingStage === 0 ? 15 : processingStage === 1 ? 50 : processingStage === 2 ? 85 : 100;

    return (
      <div className={cn("flex flex-col items-center py-10 space-y-8", isMobile ? "px-4" : "px-5")}>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Withdrawal in Progress</h3>
          <p className="text-sm text-muted-foreground">{parsedAmount} USDC → ~{estimatedReceive.toFixed(isStable ? 2 : 6)} {toToken}</p>
        </div>
        <div className="w-full max-w-sm space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-right text-muted-foreground">{progress}%</p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          {stages.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {s.done ? (
                <div className="w-6 h-6 rounded-full bg-trading-green/20 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-trading-green" /></div>
              ) : i === processingStage ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted/50 border border-border/30" />
              )}
              <span className={cn("text-sm", s.done ? "text-foreground" : i === processingStage ? "text-primary font-medium" : "text-muted-foreground")}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Result ──
  const displayAddress = selectedWallet?.address || `${selectedAddress.slice(0, 6)}...${selectedAddress.slice(-6)}`;

  return (
    <div className={cn("flex flex-col items-center py-10 space-y-6", isMobile ? "px-4" : "px-5")}>
      {txResult === 'success' ? (
        <>
          <div className="w-20 h-20 rounded-full bg-trading-green/20 flex items-center justify-center"><Check className="w-10 h-10 text-trading-green" /></div>
          <div className="text-center space-y-1">
            <h3 className="text-xl font-semibold">Withdrawal Successful</h3>
            <p className="text-3xl font-mono font-bold text-trading-green">{estimatedReceive.toFixed(isStable ? 2 : 6)} <span className="text-lg">{toToken}</span></p>
            <p className="text-sm text-muted-foreground">Sent to {displayAddress}</p>
          </div>
          <div className="w-full max-w-sm p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tx Hash</span>
              <div className="flex items-center gap-1"><code className="text-muted-foreground">0x9c4d...f3a1</code><ExternalLink className="w-3 h-3 text-muted-foreground" /></div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-trading-red/20 flex items-center justify-center"><X className="w-10 h-10 text-trading-red" /></div>
          <div className="text-center space-y-1">
            <h3 className="text-xl font-semibold">Withdrawal Failed</h3>
            <p className="text-sm text-muted-foreground">Please try again</p>
          </div>
        </>
      )}
      <Button onClick={handleRetry} variant={txResult === 'success' ? 'secondary' : 'default'} className={cn("w-full max-w-sm", isMobile ? "h-12 rounded-xl" : "h-10 rounded-lg")}>
        {txResult === 'success' ? 'Done' : <><RotateCcw className="w-4 h-4 mr-2" />Try Again</>}
      </Button>
    </div>
  );
};
