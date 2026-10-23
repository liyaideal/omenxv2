/**
 * "Pay with" selector for the Card tab (CPO mock 2026-10-23, group 1).
 *
 * Trigger: one 56px row (icon · label + hint · chevron). Opening it is a
 * MobileDrawer on mobile and a Popover on desktop (DESIGN.md Overlays rule).
 * Each option shows the USDC the user would get with that method and its fee,
 * so switching method re-quotes the first screen. Unavailable methods stay
 * visible, greyed, with the reason.
 */
import { useEffect, useState } from 'react';
import { ChevronRight, Check, Landmark } from 'lucide-react';
import { BrandMark, type BrandMarkName } from './BrandMark';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDrawer } from '@/components/ui/mobile-drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  formatFiat,
  getBuyQuote,
  paymentMethodsFor,
  type BuyQuote,
  type PaymentMethod,
  type PaymentMethodMeta,
  type Platform,
} from '@/lib/moonpay';

/** Bank rails keep the lucide Landmark glyph; card / wallet rails use the brand mark. */
const METHOD_MARK: Partial<Record<PaymentMethod, BrandMarkName>> = {
  credit_debit_card: 'visa',
  apple_pay: 'apple-pay',
  google_pay: 'google-pay',
  pix_instant_payment: 'pix',
  paypal: 'paypal',
};

interface PayWithPickerProps {
  country: string | null;
  fiatCode: string;
  fiatAmount: number;
  value: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
  /** Style-guide: force platform / open state. */
  platform?: Platform;
  fixtureOpen?: boolean;
  fixtureQuotes?: Partial<Record<PaymentMethod, BuyQuote>>;
}

export const PayWithPicker = ({
  country,
  fiatCode,
  fiatAmount,
  value,
  onChange,
  platform,
  fixtureOpen,
  fixtureQuotes,
}: PayWithPickerProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(fixtureOpen ?? false);
  const [quotes, setQuotes] = useState<Partial<Record<PaymentMethod, BuyQuote>>>(fixtureQuotes ?? {});
  const rows = paymentMethodsFor(country, fiatCode, platform);
  const selected = rows.find((r) => r.meta.id === value)?.meta ?? rows[0].meta;

  // Quote every available method once the picker opens (cheap, publishable-key calls).
  useEffect(() => {
    if (!open || fixtureQuotes || fiatAmount <= 0) return;
    const ctrl = new AbortController();
    rows
      .filter((r) => r.available)
      .forEach((r) => {
        getBuyQuote(fiatCode, fiatAmount, r.meta.id, ctrl.signal)
          .then((q) => setQuotes((prev) => ({ ...prev, [r.meta.id]: q })))
          .catch(() => { /* row shows without a number */ });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fiatCode, fiatAmount, country]);

  const pick = (m: PaymentMethod) => {
    onChange(m);
    if (fixtureOpen === undefined) setOpen(false);
  };

  const Trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="w-full flex items-center gap-3 h-14 px-3.5 rounded-xl border border-input bg-muted/25 text-left hover:border-border transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <MethodIcon id={selected.id} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{selected.label}</span>
        <span className="block text-[11px] text-muted-foreground mt-px">{selected.hint}</span>
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );

  const List = (
    <div className="flex flex-col gap-1">
      {rows.map(({ meta, available, reason }) => (
        <OptionRow
          key={meta.id}
          meta={meta}
          selected={meta.id === value}
          available={available}
          reason={reason}
          quote={quotes[meta.id]}
          fiatCode={fiatCode}
          onPick={() => available && pick(meta.id)}
        />
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {Trigger}
        <MobileDrawer open={open} onOpenChange={setOpen} title="Pay with" hideCloseButton>
          <div className="pb-4">{List}</div>
        </MobileDrawer>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-[var(--radix-popover-trigger-width)] p-1.5 bg-[#12151A] border-[#1D2026] rounded-xl">
        {List}
      </PopoverContent>
    </Popover>
  );
};

const MethodIcon = ({ id }: { id: PaymentMethod }) => {
  if (id === 'credit_debit_card') {
    // Card rail = the two schemes we take, side by side (Visa · Mastercard).
    return (
      <span className="flex items-center gap-0.5 text-muted-foreground">
        <BrandMark name="visa" className="w-3.5" title="Visa" />
        <BrandMark name="mastercard" className="w-3.5" title="Mastercard" />
      </span>
    );
  }
  const mark = METHOD_MARK[id];
  // Apple Pay / Google Pay marks carry their own rounded frame → draw wider so the lettering reads at 32px.
  if (mark) return <BrandMark name={mark} className={cn('text-muted-foreground', mark === 'apple-pay' || mark === 'google-pay' ? 'w-6' : 'w-4')} />;
  return <Landmark className="w-4 h-4 text-muted-foreground" />;
};

const OptionRow = ({
  meta,
  selected,
  available,
  reason,
  quote,
  fiatCode,
  onPick,
}: {
  meta: PaymentMethodMeta;
  selected: boolean;
  available: boolean;
  reason?: string;
  quote?: BuyQuote;
  fiatCode: string;
  onPick: () => void;
}) => (
  <button
    type="button"
    onClick={onPick}
    disabled={!available}
    className={cn(
      'w-full flex items-center gap-3 h-[60px] px-3 rounded-xl border border-transparent text-left transition-colors',
      selected && 'border-primary bg-primary/[0.06]',
      !selected && available && 'hover:bg-muted/40',
      !available && 'opacity-40 cursor-not-allowed',
    )}
  >
    <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
      <MethodIcon id={meta.id} />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-medium">{meta.label}</span>
      <span className="block text-[11px] text-muted-foreground mt-px">{available ? meta.hint : reason ?? meta.hint}</span>
    </span>
    {available && quote && (
      <span className="text-right shrink-0">
        <span className="block font-mono text-xs font-medium">≈ {quote.quoteAmount.toFixed(2)} USDC</span>
        <span className="block font-mono text-[11px] text-muted-foreground">fee {formatFiat(quote.totalFee, fiatCode)}</span>
      </span>
    )}
    {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
  </button>
);
