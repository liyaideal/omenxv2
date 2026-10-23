/**
 * Monochrome payment-brand marks for the Card tab (CPO 2026-10-23: 单色白标).
 *
 * Files live in public/brand-logos/ (official marks: Visa / Mastercard /
 * Apple Pay / Google Pay / PayPal / PIX from simple-icons CC0 set, MoonPay
 * wordmark from moonpay.com). Rendered as a CSS mask filled with
 * `currentColor`, so the tile colour is the surrounding text colour — never
 * recoloured per brand, never stretched (brand-guideline safe).
 */
import { cn } from '@/lib/utils';

export type BrandMarkName = 'visa' | 'mastercard' | 'apple-pay' | 'google-pay' | 'paypal' | 'pix' | 'moonpay-wordmark';

const RATIO: Record<BrandMarkName, string> = {
  visa: '1 / 1',
  mastercard: '1 / 1',
  'apple-pay': '1 / 1',
  'google-pay': '1 / 1',
  paypal: '1 / 1',
  pix: '1 / 1',
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
