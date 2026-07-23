import { useState } from 'react';
import { ArrowDown, Loader2, Check, X, AlertCircle, ExternalLink, RotateCcw, Wallet, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDeposit } from '@/hooks/useDeposit';
import { useMockWallet } from '@/hooks/useMockWallet';
import { SettingsButton, SettingsPanel } from './CrossChainSettings';

const SOURCE_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', icon: '/chain-logos/ethereum.svg', chainId: 1 },
  { id: 'arbitrum', name: 'Arbitrum', icon: '/chain-logos/arbitrum.svg', chainId: 42161 },
  { id: 'bnb', name: 'BNB Chain', icon: '/chain-logos/bnb.svg', chainId: 56 },
  { id: 'polygon', name: 'Polygon', icon: '/chain-logos/polygon.svg', chainId: 137 },
];

const SOURCE_TOKENS: Record<string, { symbol: string; name: string }[]> = {
  ethereum: [
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'DAI', name: 'Dai' },
  ],
  arbitrum: [
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'ARB', name: 'Arbitrum' },
  ],
  bnb: [
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'BNB', name: 'BNB' },
    { symbol: 'BUSD', name: 'Binance USD' },
  ],
  polygon: [
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'MATIC', name: 'Polygon' },
  ],
};

type Step = 'swap' | 'review' | 'sign' | 'processing' | 'result';

interface CrossChainDepositProps {
  /** Target account — forward to record-transaction if this ever credits balance. */
  account?: 'spot' | 'futures';
}

export const CrossChainDeposit = ({ account: _account }: CrossChainDepositProps = {}) => {
  const isMobile = useIsMobile();
  const { getCurrentAddress } = useDeposit('USDC');
  const { wallet, connect, disconnect, getBalance } = useMockWallet();
  const [step, setStep] = useState<Step>('swap');
  const [fromChain, setFromChain] = useState('ethereum');
  const [fromToken, setFromToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [processingStage, setProcessingStage] = useState(0);
  const [txResult, setTxResult] = useState<'success' | 'failed'>('success');
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(-1);

  const tokenBalance = getBalance(fromChain, fromToken);
  const receivingAddress = getCurrentAddress();
  const selectedChain = SOURCE_CHAINS.find(c => c.id === fromChain);
  const selectedChainTokens = SOURCE_TOKENS[fromChain] || [];

  const handleChainChange = (chainId: string) => {
    const nextToken = SOURCE_TOKENS[chainId]?.[0]?.symbol || '';
    setFromChain(chainId);
    setFromToken(nextToken);
    setAmount('');
  };

  const handleTokenChange = (token: string) => {
    setFromToken(token);
    setAmount('');
  };

  const parsedAmount = parseFloat(amount) || 0;
  const isStable = ['USDC', 'USDT', 'DAI', 'BUSD'].includes(fromToken);
  const mockRate = isStable ? 1 : fromToken === 'ETH' ? 3500 : fromToken === 'BNB' ? 600 : fromToken === 'ARB' ? 1.2 : fromToken === 'MATIC' ? 0.8 : 1;
  const estimatedReceive = parsedAmount * mockRate;
  const gasFee = isStable ? 0.5 : 2;

  const handleReview = () => setStep('review');

  const handleConfirm = () => {
    setStep('sign');
    setTimeout(() => {
      setStep('processing');
      setProcessingStage(0);
      setTimeout(() => setProcessingStage(1), 2000);
      setTimeout(() => setProcessingStage(2), 5000);
      setTimeout(() => { setTxResult('success'); setStep('result'); }, 7000);
    }, 2000);
  };

  const handleRetry = () => {
    setStep('swap');
    setAmount('');
    setProcessingStage(0);
  };

  const canProceed = wallet.connected && parsedAmount > 0 && parsedAmount <= tokenBalance;

  // ── Main Swap Card ──
  if (step === 'swap') {
    return (
      <div className={cn("space-y-4", isMobile ? "px-4 py-5" : "p-5")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Swap</h3>
          <div className="flex items-center gap-2">
            {wallet.connected && (
              <>
                <SettingsButton onClick={() => setShowSettings(!showSettings)} />
              </>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <SettingsPanel
          open={showSettings}
          onClose={() => setShowSettings(false)}
          slippage={slippage}
          onSlippageChange={setSlippage}
        />

        {/* Wallet Connection Bar */}
        {wallet.connected ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-trading-green animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </span>
            </div>
            <button
              onClick={disconnect}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Power className="w-3 h-3" />
              Disconnect
            </button>
          </div>
        ) : (
          <Button
            onClick={connect}
            disabled={wallet.connecting}
            variant="outline"
            className={cn("w-full gap-2", isMobile ? "h-12 rounded-xl" : "h-10 rounded-lg")}
          >
            {wallet.connecting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            ) : (
              <><Wallet className="w-4 h-4" /> Connect Wallet</>
            )}
          </Button>
        )}

        {/* From */}
        <div className={cn(
          "rounded-xl border p-4 space-y-3",
          wallet.connected ? "border-border/50 bg-muted/20" : "border-border/20 bg-muted/10 opacity-60"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">From</span>
            {wallet.connected && (
              <button
                onClick={() => setAmount(tokenBalance.toString())}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Bal: <span className="font-mono">{tokenBalance.toFixed(tokenBalance < 10 ? 4 : 2)}</span>
                <span className="ml-1 text-primary font-medium">MAX</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={!wallet.connected}
              className="flex-1 h-12 text-2xl font-mono bg-transparent border-none shadow-none focus-visible:ring-0 p-0"
            />
            <div className={cn("flex gap-2", isMobile ? "flex-col items-stretch" : "items-center")}>
              <Select value={fromChain} onValueChange={handleChainChange} disabled={!wallet.connected}>
                <SelectTrigger className={cn("h-10 rounded-full bg-card border-border/50 gap-2", isMobile ? "w-full" : "w-auto min-w-[128px]")}>
                  <div className="flex min-w-0 items-center gap-2">
                    {selectedChain && <img src={selectedChain.icon} alt={selectedChain.name} className="w-5 h-5 shrink-0" />}
                    <span className="truncate text-sm font-medium">{selectedChain?.name}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[260px] overflow-y-auto">
                  {SOURCE_CHAINS.map(chain => (
                    <SelectItem key={chain.id} value={chain.id}>
                      <div className="flex items-center gap-2">
                        <img src={chain.icon} alt={chain.name} className="w-4 h-4" />
                        <span className="font-medium">{chain.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fromToken} onValueChange={handleTokenChange} disabled={!wallet.connected || selectedChainTokens.length === 0}>
                <SelectTrigger className={cn("h-10 rounded-full bg-card border-border/50 gap-2", isMobile ? "w-full" : "w-auto min-w-[96px]")}>
                  <div className="flex min-w-0 items-center gap-2">
                    {selectedChain && <img src={selectedChain.icon} alt="" className="w-5 h-5 shrink-0" />}
                    <span className="truncate text-sm font-medium">{fromToken}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[260px] overflow-y-auto">
                  {selectedChainTokens.map(token => (
                    <SelectItem key={`${fromChain}-${token.symbol}`} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        {selectedChain && <img src={selectedChain.icon} alt="" className="w-4 h-4" />}
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground">{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {wallet.connected && parsedAmount > tokenBalance && (
            <p className="text-xs text-trading-red flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Insufficient {fromToken} balance
            </p>
          )}
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center shadow-sm">
            <ArrowDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* To (locked: Base USDC) */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">To</span>
            <span className="text-xs text-muted-foreground">OmenX Wallet</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-2xl font-mono font-semibold">
              {parsedAmount > 0 ? estimatedReceive.toFixed(2) : '0.00'}
            </span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border/50">
              <img src="/chain-logos/base.svg" alt="Base" className="w-5 h-5" />
              <span className="font-medium text-sm">USDC</span>
              <span className="text-xs text-muted-foreground">Base</span>
            </div>
          </div>
        </div>

        {/* Inline Quote Details — Bungee style */}
        {parsedAmount > 0 && wallet.connected && (
          <div className="space-y-2 px-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rate</span>
              <span className="font-mono">1 {fromToken} = {mockRate.toFixed(2)} USDC</span>
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
        {wallet.connected ? (
          <Button
            onClick={handleReview}
            disabled={!canProceed}
            className={cn("w-full bg-primary hover:bg-primary-hover font-semibold", isMobile ? "h-12 rounded-xl" : "h-10 rounded-lg")}
          >
            {parsedAmount <= 0
              ? 'Enter Amount'
              : parsedAmount > tokenBalance
                ? 'Insufficient Balance'
                : 'Review Bridge'}
          </Button>
        ) : null}

        <p className="text-[10px] text-center text-muted-foreground">
          Powered by <span className="font-semibold">SOCKET</span>
        </p>
      </div>
    );
  }

  // ── Review / Confirm ──
  if (step === 'review') {
    return (
      <div className={cn("space-y-5", isMobile ? "px-4 py-5" : "p-5")}>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">Confirm Bridge</h3>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/20 border border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedChain && <img src={selectedChain.icon} alt="" className="w-5 h-5" />}
              <span className="text-sm">{fromToken} on {selectedChain?.name}</span>
            </div>
            <span className="font-mono font-semibold">{parsedAmount}</span>
          </div>
          <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-muted-foreground" /></div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/chain-logos/base.svg" alt="Base" className="w-5 h-5" />
              <span className="text-sm">USDC on Base</span>
            </div>
            <span className="font-mono font-semibold text-trading-green">~{estimatedReceive.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/30 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Min. USDC</span><span className="font-mono">{(estimatedReceive * (1 - (slippage === -1 ? 0.5 : slippage) / 100)).toFixed(2)} USDC</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Exchange Rate</span><span className="font-mono">1 {fromToken} = {mockRate.toFixed(2)} USDC</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bridge Fee</span><span className="font-mono text-trading-green">Free</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Est. Gas</span><span className="font-mono">~${gasFee.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Swap Slippage</span><span className="font-mono">{slippage === -1 ? '0.5% ~ Suggested' : `${slippage}%`}</span></div>
        </div>

        <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1">
          <div>
            <p className="text-xs text-muted-foreground">From Wallet</p>
            <code className="text-xs text-foreground">{wallet.address.slice(0, 6)}...{wallet.address.slice(-6)}</code>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receiving Address (OmenX)</p>
            <code className="text-xs text-foreground break-all">{receivingAddress}</code>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('swap')} className="flex-1">Back</Button>
          <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary-hover">Confirm & Bridge</Button>
        </div>
      </div>
    );
  }

  // ── Sign ──
  if (step === 'sign') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 space-y-6", isMobile ? "px-4" : "px-5")}>
        <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center"><span className="text-3xl">🦊</span></div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Waiting for Signature</h3>
          <p className="text-sm text-muted-foreground">Confirm the transaction in your wallet</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── Processing ──
  if (step === 'processing') {
    const stages = [
      { label: `${selectedChain?.name || 'Source'} confirmation`, done: processingStage >= 1 },
      { label: 'Cross-chain bridging', done: processingStage >= 2 },
      { label: 'Base chain confirmation', done: processingStage >= 3 },
    ];
    const progress = processingStage === 0 ? 15 : processingStage === 1 ? 50 : processingStage === 2 ? 85 : 100;

    return (
      <div className={cn("flex flex-col items-center py-10 space-y-8", isMobile ? "px-4" : "px-5")}>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Bridging in Progress</h3>
          <p className="text-sm text-muted-foreground">{parsedAmount} {fromToken} → ~{estimatedReceive.toFixed(2)} USDC</p>
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
  return (
    <div className={cn("flex flex-col items-center py-10 space-y-6", isMobile ? "px-4" : "px-5")}>
      {txResult === 'success' ? (
        <>
          <div className="w-20 h-20 rounded-full bg-trading-green/20 flex items-center justify-center"><Check className="w-10 h-10 text-trading-green" /></div>
          <div className="text-center space-y-1">
            <h3 className="text-xl font-semibold">Bridge Successful</h3>
            <p className="text-3xl font-mono font-bold text-trading-green">+{estimatedReceive.toFixed(2)} <span className="text-lg">USDC</span></p>
            <p className="text-sm text-muted-foreground">Credited to your OmenX account</p>
          </div>
          <div className="w-full max-w-sm p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tx Hash</span>
              <div className="flex items-center gap-1"><code className="text-muted-foreground">0x8f3a...e7b2</code><ExternalLink className="w-3 h-3 text-muted-foreground" /></div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-trading-red/20 flex items-center justify-center"><X className="w-10 h-10 text-trading-red" /></div>
          <div className="text-center space-y-1">
            <h3 className="text-xl font-semibold">Bridge Failed</h3>
            <p className="text-sm text-muted-foreground">Transaction could not be completed</p>
          </div>
          <div className="w-full max-w-sm p-3 rounded-lg bg-trading-red/5 border border-trading-red/20">
            <div className="flex items-center gap-2 text-sm text-trading-red">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Insufficient gas on source chain</span>
            </div>
          </div>
        </>
      )}
      <Button onClick={handleRetry} variant={txResult === 'success' ? 'secondary' : 'default'} className={cn("w-full max-w-sm", isMobile ? "h-12 rounded-xl" : "h-10 rounded-lg")}>
        {txResult === 'success' ? 'Done' : <><RotateCcw className="w-4 h-4 mr-2" />Try Again</>}
      </Button>
    </div>
  );
};
