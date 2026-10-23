/**
 * Card tab — buy USDC on Base with MoonPay (CPO mock 2026-10-23, 1:1).
 *
 * States: form (quote / loading / out-of-range) → MoonPay overlay → tracking
 * (waiting_payment · pending · sending) → completed | failed.
 *
 * Mounted by: src/pages/Deposit.tsx (mobile full-screen) and
 * src/components/deposit/DepositDialog.tsx (desktop). The region decision
 * (show the tab at all) lives in the parents via `useCardRegion`.
 *
 * MoonPay's checkout itself is their hosted widget (overlay); we only prefill
 * amount / currency / Base address / email / payment method and theme=dark.
 * Without VITE_MOONPAY_API_KEY a demo overlay stands in (see lib/moonpay.ts).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDeposit } from '@/hooks/useDeposit';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ACCOUNT_LABEL } from '@/hooks/useAccountPreference';
import { useFiatOrders, useFiatOrderTracker, isOpenOrder } from '@/hooks/useFiatOrders';
import {
  FIAT_CURRENCIES,
  MOONPAY_DEMO,
  MOONPAY_ENV,
  USDC_BASE_CODE,
  defaultFiatFor,
  defaultPaymentMethod,
  failureCopy,
  formatFiat,
  getBuyQuote,
  getRegion,
  loadMoonPaySdk,
  type BuyQuote,
  type FiatOrder,
  type MoonPayRegion,
  type PaymentMethod,
  type Platform,
} from '@/lib/moonpay';
import { PayWithPicker } from './PayWithPicker';

/** Brand lynx illustrations (public/assets, 60% opacity baked in — never add CSS opacity). */
const LYNX = {
  celebrate: (m: boolean) => `/assets/${m ? 'mobile' : 'desktop'}/empty-celebrate.png`,
  noBoost: (m: boolean) => `/assets/${m ? 'mobile' : 'desktop'}/empty-no-boost.png`,
};

/* ------------------------------------------------------------------ */
/* Region hook (parents decide whether to render the tab)               */
/* ------------------------------------------------------------------ */

export const useCardRegion = (fixture?: MoonPayRegion) => {
  const [region, setRegion] = useState<MoonPayRegion | null>(fixture ?? null);
  useEffect(() => {
    if (fixture) return;
    let alive = true;
    getRegion().then((r) => { if (alive) setRegion(r); });
    return () => { alive = false; };
  }, [fixture]);
  return region; // null while loading → parents keep today's two tabs until known
};

/* ------------------------------------------------------------------ */

export type CardFixtureState = 'form' | 'quoting' | 'below-min' | 'overlay' | 'tracking' | 'waiting' | 'completed' | 'failed';

export interface BuyWithCardFixture {
  state: CardFixtureState;
  region?: MoonPayRegion;
  fiatCode?: string;
  amount?: number;
  quote?: BuyQuote;
  feeOpen?: boolean;
  order?: FiatOrder;
  platform?: Platform;
  /** Open the Pay-with picker with these quotes (style-guide only). */
  pickerOpen?: boolean;
  pickerQuotes?: Partial<Record<PaymentMethod, BuyQuote>>;
}

interface BuyWithCardProps {
  account: 'spot' | 'futures';
  /** Deep link: open directly on this order's tracking state. */
  initialOrderId?: string | null;
  /** Deep link from a Wallet ledger row (transactions.id) — resolved to its order. */
  initialTransactionId?: string | null;
  /** Desktop dialog closes itself on Done. */
  onDone?: () => void;
  /** Style-guide only. */
  fixture?: BuyWithCardFixture;
}

const DEMO_FIXTURE_ADDRESS = '0x7A3f9C2e5B1d4E6f8A0b2C4d6E8f0A2b4C6d8E0f';
const CURRENT_ORDER_KEY = 'omenx:card-order:current';

export const BuyWithCard = ({ account, initialOrderId = null, initialTransactionId = null, onDone, fixture }: BuyWithCardProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, email } = useUserProfile();
  const { getCurrentAddress } = useDeposit('USDC', { enabled: !fixture });
  const { createOrder, demoAdvance, cancelOrder, fetchOrderByTransaction } = useFiatOrders();

  const region = useCardRegion(fixture?.region ?? (fixture ? { country: 'US', isBuyAllowed: true, fallback: false } : undefined));
  const country = region?.country ?? null;

  // ---- form state ----
  const [fiatCode, setFiatCode] = useState<string>(fixture?.fiatCode ?? 'USD');
  const [userPickedFiat, setUserPickedFiat] = useState(false);
  const [amountStr, setAmountStr] = useState<string>(fixture?.amount !== undefined ? String(fixture.amount) : '100');
  const [method, setMethod] = useState<PaymentMethod>('credit_debit_card');
  const [quote, setQuote] = useState<BuyQuote | null>(fixture?.quote ?? null);
  const [quoting, setQuoting] = useState(fixture?.state === 'quoting');
  const [feeOpen, setFeeOpen] = useState(fixture?.feeOpen ?? false);
  const [starting, setStarting] = useState(false);

  // ---- flow state ----
  // The open order survives a remount (profile / language refresh re-keys the app).
  const [orderId, setOrderIdState] = useState<string | null>(() => {
    if (fixture) return fixture.order?.id ?? null;
    if (initialOrderId) return initialOrderId;
    try { return window.sessionStorage.getItem(CURRENT_ORDER_KEY); } catch { return null; }
  });
  const setOrderId = useCallback((id: string | null) => {
    setOrderIdState(id);
    try {
      if (id) window.sessionStorage.setItem(CURRENT_ORDER_KEY, id);
      else window.sessionStorage.removeItem(CURRENT_ORDER_KEY);
    } catch { /* ignore */ }
  }, []);
  const [demoOverlay, setDemoOverlay] = useState(fixture?.state === 'overlay');
  const order = useFiatOrderTracker(fixture ? null : orderId, fixture?.order);

  useEffect(() => {
    if (fixture || !initialTransactionId || orderId) return;
    let alive = true;
    fetchOrderByTransaction(initialTransactionId).then((o) => { if (alive && o) setOrderId(o.id); });
    return () => { alive = false; };
  }, [initialTransactionId, orderId, fixture, fetchOrderByTransaction]);

  const currency = FIAT_CURRENCIES[fiatCode] ?? FIAT_CURRENCIES.USD;
  const amount = Number(amountStr.replace(/[^0-9.]/g, '')) || 0;
  const belowMin = amount > 0 && amount < currency.minBuyAmount;
  const aboveMax = amount > currency.maxBuyAmount;
  const invalid = belowMin || aboveMax;

  // Default currency + method follow the region once known (rule 4 sub-item); user override sticks.
  useEffect(() => {
    if (fixture || !region || userPickedFiat) return;
    const f = defaultFiatFor(region.country);
    setFiatCode(f);
    setAmountStr(String(FIAT_CURRENCIES[f].chips[1]));
    setMethod(defaultPaymentMethod(region.country, f, fixture?.platform));
  }, [region, fixture, userPickedFiat]);

  // Live quote, 500ms debounce.
  const quoteCtrl = useRef<AbortController | null>(null);
  useEffect(() => {
    if (fixture) return;
    quoteCtrl.current?.abort();
    if (amount <= 0 || invalid) { setQuote(null); setQuoting(false); return; }
    const ctrl = new AbortController();
    quoteCtrl.current = ctrl;
    setQuoting(true);
    const t = window.setTimeout(() => {
      getBuyQuote(fiatCode, amount, method, ctrl.signal)
        .then((q) => { if (!ctrl.signal.aborted) { setQuote(q); setQuoting(false); } })
        .catch((e) => { if (e?.name !== 'AbortError') { setQuote(null); setQuoting(false); } });
    }, 500);
    return () => { window.clearTimeout(t); ctrl.abort(); };
  }, [fiatCode, amount, method, invalid, fixture]);

  const walletAddress = fixture ? DEMO_FIXTURE_ADDRESS : getCurrentAddress();

  const handleBuy = useCallback(async () => {
    if (!quote || starting) return;
    if (!walletAddress) { toast.error('Your deposit address is still loading. Try again in a moment.'); return; }
    setStarting(true);
    try {
      const { order: created, sign, allowedIpAddress } = await createOrder({ quote, account, walletAddress });
      setOrderId(created.id);
      if (MOONPAY_DEMO || !sign) {
        setDemoOverlay(true);
        return;
      }
      const sdk = await loadMoonPaySdk();
      const widget = sdk.init({
        flow: 'buy',
        environment: MOONPAY_ENV,
        variant: 'overlay',
        params: {
          apiKey: import.meta.env.VITE_MOONPAY_API_KEY,
          currencyCode: USDC_BASE_CODE,
          walletAddress,
          baseCurrencyCode: quote.fiatCode.toLowerCase(),
          baseCurrencyAmount: String(Math.round(quote.fiatAmount)),
          paymentMethod: quote.paymentMethod,
          email: email ?? undefined,
          externalCustomerId: user?.id,
          externalTransactionId: created.id,
          theme: 'dark',
          language: 'en',
          allowedIpAddress,
        },
        handlers: {
          onTransactionCompleted: async () => { /* tracker picks it up via webhook → fiat_orders */ },
          onCloseOverlay: async () => { /* stay on tracking; status decides the copy */ },
        },
      });
      const signature = await sign(widget.generateUrlForSigning());
      widget.updateSignature(signature);
      widget.show();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start checkout');
      setOrderId(null);
    } finally {
      setStarting(false);
    }
  }, [quote, starting, walletAddress, createOrder, account, email, user?.id]);

  const reset = () => { setOrderId(null); setDemoOverlay(false); setAmountStr(String(currency.chips[1])); };

  // ---------------- render ----------------
  const fixtureState = fixture?.state;
  const showTracking = fixtureState
    ? ['tracking', 'waiting', 'completed', 'failed'].includes(fixtureState)
    : !!orderId && !demoOverlay;

  if (showTracking) {
    if (!order) {
      return (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      );
    }
    if (order.status === 'completed') {
      return (
        <ResultView
          variant="success"
          isMobile={isMobile}
          title="Deposit complete"
          amount={order.quoteAmount}
          body={`Credited to your ${ACCOUNT_LABEL[order.account]}. Ready to trade.`}
          primary={{ label: 'Start trading', onClick: () => { setOrderId(null); onDone?.(); navigate('/'); } }}
          secondary={{ label: 'Done', onClick: () => { setOrderId(null); onDone ? onDone() : reset(); } }}
        />
      );
    }
    if (order.status === 'failed') {
      return (
        <ResultView
          variant="fail"
          isMobile={isMobile}
          title={order.failureReason === 'cancelled' ? 'Order cancelled' : 'Payment didn’t go through'}
          body="Nothing was charged. You can try again with a different card."
          reason={order.failureReason === 'cancelled' ? undefined : failureCopy(order.failureReason)}
          primary={{ label: 'Try again', onClick: reset }}
          secondary={{ label: 'Contact support', href: 'mailto:customerservice@omenx.com?subject=Card deposit' }}
        />
      );
    }
    return (
      <TrackingView
        order={order}
        isMobile={isMobile}
        onBack={() => { setOrderId(null); onDone ? onDone() : reset(); }}
        onResume={() => setDemoOverlay(true)}
        onCancel={async () => { await cancelOrder(order.id); }}
      />
    );
  }

  return (
    <>
      <div className={cn('flex flex-col gap-5', isMobile ? (fixture ? 'px-4 py-5' : 'px-4 pt-5 pb-32') : 'p-5')}>
        {/* You pay */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">You pay</label>
            <span className="text-xs text-muted-foreground font-mono">
              {formatFiat(currency.minBuyAmount, fiatCode, true)} – {formatFiat(currency.maxBuyAmount, fiatCode, true)}
            </span>
          </div>
          <div
            className={cn(
              'flex items-center gap-2 h-16 rounded-xl border bg-muted/25 pl-2 pr-3.5',
              invalid ? 'border-destructive' : 'border-input',
            )}
          >
            <Select
              value={fiatCode}
              onValueChange={(v) => { setFiatCode(v); setUserPickedFiat(true); setAmountStr(String(FIAT_CURRENCIES[v].chips[1])); }}
            >
              <SelectTrigger className="w-auto h-10 gap-1.5 rounded-lg bg-muted border-0 px-2.5 text-[13px] font-semibold focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FIAT_CURRENCIES).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="mr-1.5">{c.flag}</span>{c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              id="card-amount"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder={String(currency.chips[1])}
              className="flex-1 min-w-0 bg-transparent text-right font-mono text-[32px] font-semibold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          {belowMin && (
            <p className="text-xs text-destructive -mt-1">Minimum is {formatFiat(currency.minBuyAmount, fiatCode, true)} for card payments.</p>
          )}
          {aboveMax && (
            <p className="text-xs text-destructive -mt-1">Maximum is {formatFiat(currency.maxBuyAmount, fiatCode, true)} per purchase.</p>
          )}
          <div className="grid grid-cols-4 gap-2">
            {currency.chips.map((v) => {
              const on = amount === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmountStr(String(v))}
                  className={cn(
                    'h-9 rounded-full border font-mono text-[13px] font-medium transition-colors',
                    on ? 'border-primary text-primary bg-primary/[0.08]' : 'border-border text-muted-foreground bg-muted/30 hover:border-input',
                  )}
                >
                  {formatFiat(v, fiatCode, true)}
                </button>
              );
            })}
          </div>
        </div>

        {/* You get */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[13px] text-muted-foreground">
            <span>You get</span>
            <span className="flex items-center gap-1.5 text-xs">
              <img src="/chain-logos/base.svg" alt="" className="w-3.5 h-3.5 rounded-full" />
              USDC on Base
            </span>
          </div>
          {quoting || (fixtureState === 'quoting') ? (
            <div className="h-7 w-[150px] rounded-md bg-muted animate-pulse" />
          ) : quote ? (
            <div className="font-mono text-[28px] font-semibold tabular-nums flex items-baseline gap-2">
              ≈ {quote.quoteAmount.toFixed(2)}
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <img src="/token-logos/usdc.svg" alt="" className="w-[18px] h-[18px]" />USDC
              </span>
            </div>
          ) : (
            <div className="font-mono text-[28px] font-semibold text-muted-foreground">—</div>
          )}
          <button
            type="button"
            onClick={() => setFeeOpen((v) => !v)}
            className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 mt-1 border-t border-border/60"
          >
            <span className="inline-flex items-center gap-1">Fee details {feeOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</span>
            <span>
              {quoting ? 'Updating…' : quote ? <>Total <b className="font-mono font-medium text-foreground">{formatFiat(quote.totalFee, fiatCode)}</b></> : ''}
            </span>
          </button>
          {feeOpen && quote && (
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground pt-2">
              <div className="flex justify-between"><span>MoonPay fee</span><span className="font-mono text-foreground">{formatFiat(quote.moonpayFee, fiatCode)}</span></div>
              <div className="flex justify-between"><span>Network fee (Base)</span><span className="font-mono text-foreground">{formatFiat(quote.networkFee, fiatCode)}</span></div>
              <div className="flex justify-between"><span>Rate</span><span className="font-mono text-foreground">1 USDC = {formatFiat(quote.rate, fiatCode)}</span></div>
            </div>
          )}
        </div>

        {/* Pay with */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Pay with</label>
          <PayWithPicker
            country={country}
            fiatCode={fiatCode}
            fiatAmount={amount}
            value={method}
            onChange={setMethod}
            platform={fixture?.platform}
            fixtureOpen={fixture?.pickerOpen}
            fixtureQuotes={fixture?.pickerQuotes}
          />
        </div>

        {!isMobile && (
          <CtaBlock
            isMobile={false}
            label={quoting ? 'Getting quote…' : quote ? `Buy ${quote.quoteAmount.toFixed(2)} USDC` : 'Buy USDC'}
            disabled={!quote || quoting || invalid || starting}
            loading={starting}
            onClick={handleBuy}
          />
        )}
      </div>

      {isMobile && (
        <div
          className={cn(
            'z-30 bg-gradient-to-b from-background/0 via-background to-background px-4 pt-3',
            fixture ? 'sticky bottom-0 mt-auto' : 'fixed left-0 right-0',
          )}
          style={fixture ? { paddingBottom: 16 } : { bottom: 'var(--bottom-nav-h, 76px)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
        >
          <CtaBlock
            isMobile
            label={quoting ? 'Getting quote…' : quote ? `Buy ${quote.quoteAmount.toFixed(2)} USDC` : 'Buy USDC'}
            disabled={!quote || quoting || invalid || starting}
            loading={starting}
            onClick={handleBuy}
          />
        </div>
      )}

      {demoOverlay && orderId && (
        <DemoCheckoutOverlay
          amountLabel={quote ? `${formatFiat(quote.fiatAmount, quote.fiatCode)} → ≈ ${quote.quoteAmount.toFixed(2)} USDC` : ''}
          onPay={async () => { setDemoOverlay(false); await demoAdvance(orderId, 'completed'); }}
          onDecline={async () => { setDemoOverlay(false); await demoAdvance(orderId, 'failed'); }}
          onClose={() => setDemoOverlay(false)}
        />
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Sub-views                                                            */
/* ------------------------------------------------------------------ */

const CtaBlock = ({ isMobile, label, disabled, loading, onClick }: { isMobile: boolean; label: string; disabled: boolean; loading: boolean; onClick: () => void }) => (
  <div className="flex flex-col gap-2.5">
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'btn-trading-green w-full flex items-center justify-center gap-2 text-sm',
        isMobile ? 'h-12 rounded-xl py-0' : 'h-10 rounded-lg py-0',
        disabled && 'opacity-50 shadow-none cursor-not-allowed hover:opacity-50 hover:scale-100',
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
    <p className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground text-center flex-wrap">
      <span className="inline-flex items-center gap-1 font-semibold">
        <span className="w-3 h-3 rounded-full border-2 border-muted-foreground inline-block" aria-hidden />Powered by MoonPay
      </span>
      <span className="opacity-50">·</span><span>160+ countries</span>
      <span className="opacity-50">·</span><span>Secure checkout</span>
    </p>
  </div>
);

const STEPS: Array<{ key: 'paid' | 'confirmed' | 'sending' | 'credited'; label: string; waitingLabel?: string; eta: string }> = [
  { key: 'paid', label: 'Payment received', waitingLabel: 'Waiting for payment', eta: 'Finish checkout to continue' },
  { key: 'confirmed', label: 'Order confirmed by MoonPay', eta: 'Usually under a minute' },
  { key: 'sending', label: 'Sending USDC to Base', eta: 'Usually 1–3 minutes' },
  { key: 'credited', label: 'Credited to your account', eta: '' },
];

const stepIndex = (s: FiatOrder['status']) => (s === 'waiting_payment' ? 0 : s === 'pending' ? 1 : s === 'sending' ? 2 : 3);

const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '');

const TrackingView = ({ order, isMobile, onBack, onResume, onCancel }: { order: FiatOrder; isMobile: boolean; onBack: () => void; onResume: () => void; onCancel: () => void }) => {
  const current = stepIndex(order.status);
  const waiting = order.status === 'waiting_payment';
  const times = [order.paidAt, order.confirmedAt, order.confirmedAt, order.completedAt];
  const methodLabel = order.cardBrand && order.cardLast4 ? `${order.cardBrand} •• ${order.cardLast4}` : waiting ? 'Card' : order.cardBrand ?? 'Card';
  return (
    <div className={cn('flex flex-col gap-4', isMobile ? 'px-4 pt-6 pb-4' : 'p-5')}>
      <div className="rounded-xl border border-border bg-muted/25 p-4 flex flex-col gap-3.5">
        <div className="flex items-center justify-between font-mono text-base font-semibold tabular-nums">
          <span>
            {formatFiat(order.fiatAmount, order.fiatCode)}
            <small className="block font-sans text-[11px] font-normal text-muted-foreground mt-0.5">{methodLabel}</small>
          </span>
          <span className="text-sm text-muted-foreground">→</span>
          <span className="text-right">
            ≈ {order.quoteAmount.toFixed(2)} USDC
            <small className="block font-sans text-[11px] font-normal text-muted-foreground mt-0.5">{ACCOUNT_LABEL[order.account]}</small>
          </span>
        </div>
        <ol className="flex flex-col">
          {STEPS.map((s, i) => {
            const done = i < current;
            const now = i === current;
            return (
              <li key={s.key} className={cn('relative flex items-start gap-3 pb-[18px] last:pb-0')}>
                {i < STEPS.length - 1 && (
                  <span className={cn('absolute left-[11px] top-6 bottom-0 w-0.5', done ? 'bg-trading-green/40' : 'bg-border')} />
                )}
                <span
                  className={cn(
                    'relative z-[1] w-6 h-6 rounded-full border-2 bg-background flex items-center justify-center shrink-0',
                    done && 'border-transparent bg-trading-green/20 text-trading-green',
                    now && 'border-primary',
                    !done && !now && 'border-border',
                  )}
                >
                  {done && <Check className="w-3 h-3" />}
                  {now && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </span>
                <span className={cn('text-sm pt-[3px]', done ? 'text-foreground' : now ? 'text-primary font-medium' : 'text-muted-foreground')}>
                  {now && s.waitingLabel && waiting ? s.waitingLabel : s.label}
                  <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">
                    {done ? fmtTime(times[i]) : now ? s.eta : ''}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
        {order.providerTxId && (
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Order ID</span><span className="font-mono">{order.providerTxId}</span>
          </div>
        )}
      </div>
      {!waiting && <p className="text-xs text-muted-foreground text-center m-0">You can close this page. We’ll notify you when it lands.</p>}
      <div className="flex flex-col gap-2.5">
        {waiting ? (
          <>
            <button type="button" onClick={onResume} className={cn('btn-trading-green w-full text-sm', isMobile ? 'h-12 rounded-xl py-0' : 'h-10 rounded-lg py-0')}>Resume checkout</button>
            <Button variant="outline" onClick={onCancel} className={cn('w-full', isMobile ? 'h-12 rounded-xl' : 'h-10 rounded-lg')}>Cancel order</Button>
          </>
        ) : (
          <Button variant="outline" onClick={onBack} className={cn('w-full', isMobile ? 'h-12 rounded-xl' : 'h-10 rounded-lg')}>Back to deposit</Button>
        )}
      </div>
    </div>
  );
};

const ResultView = ({
  variant, isMobile, title, amount, body, reason, primary, secondary,
}: {
  variant: 'success' | 'fail';
  isMobile: boolean;
  title: string;
  amount?: number;
  body: string;
  reason?: string;
  primary: { label: string; onClick: () => void };
  secondary: { label: string; onClick?: () => void; href?: string };
}) => (
  <div className={cn('flex flex-col gap-5', isMobile ? 'px-4 py-5' : 'p-5')}>
    <div className="flex flex-col items-center text-center gap-2 pt-7 pb-3">
      <img
        src={variant === 'success' ? LYNX.celebrate(isMobile) : LYNX.noBoost(isMobile)}
        alt=""
        aria-hidden
        className={cn('object-contain mb-1.5 pointer-events-none select-none', variant === 'success' ? 'w-[130px] h-[130px]' : 'w-[150px] h-auto')}
      />
      <h3 className="text-xl font-semibold m-0">{title}</h3>
      {amount !== undefined && (
        <div className="font-mono text-[32px] font-bold text-trading-green tabular-nums">+{amount.toFixed(2)} <small className="text-base">USDC</small></div>
      )}
      <p className="text-[13px] text-muted-foreground max-w-[32ch] m-0">{body}</p>
      {reason && (
        <div className="mt-1.5 w-full rounded-[10px] border border-trading-red/30 bg-trading-red-bg px-3 py-2.5 text-xs text-left">
          <b className="font-semibold">Reason</b> · {reason}
        </div>
      )}
    </div>
    <div className={cn('flex gap-2.5', isMobile ? 'flex-col' : 'flex-row-reverse')}>
      <button type="button" onClick={primary.onClick} className={cn('btn-trading-green text-sm', isMobile ? 'w-full h-12 rounded-xl py-0' : 'flex-1 h-10 rounded-lg py-0')}>{primary.label}</button>
      {secondary.href ? (
        <a href={secondary.href} className={cn('inline-flex items-center justify-center rounded-lg border border-input text-sm font-medium hover:bg-muted/40', isMobile ? 'w-full h-12 rounded-xl' : 'flex-1 h-10')}>{secondary.label}</a>
      ) : (
        <Button variant="outline" onClick={secondary.onClick} className={cn(isMobile ? 'w-full h-12 rounded-xl' : 'flex-1 h-10 rounded-lg')}>{secondary.label}</Button>
      )}
    </div>
  </div>
);

/** DEMO_ENGINE — stands in for MoonPay's hosted overlay until keys are live. */
const DemoCheckoutOverlay = ({ amountLabel, onPay, onDecline, onClose }: { amountLabel: string; onPay: () => void; onDecline: () => void; onClose: () => void }) => (
  <div className="fixed inset-0 z-[80] bg-background/70 flex items-end sm:items-center justify-center" onClick={onClose}>
    <div
      className="w-full sm:w-[380px] h-[78vh] sm:h-[520px] bg-[#0b0f17] border border-border rounded-t-[20px] sm:rounded-2xl flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground px-6 text-center"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-foreground inline-block" aria-hidden />MoonPay checkout
      </span>
      <span className="font-mono text-foreground">{amountLabel}</span>
      <span>Demo stand-in. The live site shows MoonPay’s hosted checkout here (card entry + 3D Secure).</span>
      <div className="flex flex-col gap-2 w-full pt-4">
        <button type="button" onClick={onPay} className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Pay now (demo)</button>
        <button type="button" onClick={onDecline} className="h-11 rounded-xl border border-input text-foreground font-medium text-sm">Simulate a declined card</button>
        <button type="button" onClick={onClose} className="h-9 text-muted-foreground text-xs">Close without paying</button>
      </div>
    </div>
  </div>
);

/** Small helper for parents: "1 card order in progress" pill content. */
export const useOpenCardOrders = (enabled: boolean) => {
  const { fetchOpenOrders } = useFiatOrders();
  const [orders, setOrders] = useState<FiatOrder[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetchOpenOrders().then((o) => { if (alive) setOrders(o.filter((x) => isOpenOrder(x.status))); });
    return () => { alive = false; };
  }, [enabled, fetchOpenOrders]);
  return useMemo(() => orders, [orders]);
};
