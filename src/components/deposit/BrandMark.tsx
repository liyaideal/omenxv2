/**
 * Payment-brand marks for the Card tab (CPO 2026-10-23: 彩色官方标 — 单色白标被否，"看着像没上线").
 *
 * Two renderers:
 * - `BrandTile`: full-colour card-style tile (780×500 rounded rect, official
 *   colours) rendered as a plain <img>. Visa / Mastercard / PayPal from the
 *   aaronfagan payment-icons set (Apache-2.0, flat-rounded); Apple Pay (official
 *   wordmark, white on black), Google Pay (official "G Pay" mark) and PIX
 *   (official teal mark) composed into the same tile. Every tile is the same
 *   size, so the colours stay tidy next to each other.
 * - `BrandMark`: CSS mask filled with `currentColor`, for marks that must take
 *   the surrounding text colour (the MoonPay wordmark in the trust row).
 *
 * Files live in public/brand-logos/. Never recoloured per brand, never stretched.
 */
import { cn } from '@/lib/utils';

export type BrandTileName = 'visa' | 'mastercard' | 'apple-pay' | 'google-pay' | 'paypal' | 'pix';
export type BrandMarkName = 'moonpay-wordmark';

const TILE_LABEL: Record<BrandTileName, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  'apple-pay': 'Apple Pay',
  'google-pay': 'Google Pay',
  paypal: 'PayPal',
  pix: 'PIX',
};

/** Colour tile, 780:500. Size it by width (`w-9` ≈ 36×23). The hairline ring keeps the black Apple Pay tile visible on dark surfaces. */
export const BrandTile = ({ name, className }: { name: BrandTileName; className?: string }) => (
  <img
    src={`/brand-logos/${name}.svg`}
    alt={TILE_LABEL[name]}
    draggable={false}
    className={cn('block shrink-0 aspect-[780/500] rounded-[3px] ring-1 ring-white/10 select-none', className)}
  />
);

const RATIO: Record<BrandMarkName, string> = {
  'moonpay-wordmark': '100 / 20',
};

export const BrandMark = ({ name, className, title }: { name: BrandMarkName; className?: string; title?: string }) => {
  const url = `url(/brand-logos/${name}.svg)`;
  return (
    <span
      role="img"
      aria-label={title ?? name}
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        aspectRatio: RATIO[name],
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
};
