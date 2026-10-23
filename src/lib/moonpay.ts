/**
 * MoonPay on-ramp — client helpers (Card tab, 2026-10-23).
 *
 * Everything here is publishable-key safe: region lookup, currency list,
 * live buy quotes and the Web SDK loader. URL signing never happens in the
 * browser — see supabase/functions/moonpay-sign-url.
 *
 * Demo engine: when `VITE_MOONPAY_API_KEY` is absent (Lovable preview before
 * KYB), every network call is replaced by a deterministic local stand-in so
 * the full UI (quote → overlay → tracking → success / failed) can be clicked
 * through. The live platform must set the key and deploy the two Edge
 * Functions; nothing else changes. See docs/delivery/fiat-moonpay-spec-v1.md §3.
 */

export const MOONPAY_API_KEY: string | undefined = import.meta.env.VITE_MOONPAY_API_KEY;
export const MOONPAY_DEMO = !MOONPAY_API_KEY;
export const MOONPAY_ENV: 'sandbox' | 'production' =
  MOONPAY_API_KEY?.startsWith('pk_live_') ? 'production' : 'sandbox';

/** MoonPay currency code for USDC on Base (confirm in Dashboard › Enabled assets). */
export const USDC_BASE_CODE = 'usdc_base';

const API = 'https://api.moonpay.com';
const SDK_SRC = 'https://static.moonpay.com/web-sdk/v1/moonpay-web-sdk.min.js';

/* ------------------------------------------------------------------ */
/* Payment methods                                                      */
/* ------------------------------------------------------------------ */

export type PaymentMethod =
  | 'credit_debit_card'
  | 'apple_pay'
  | 'google_pay'
  | 'sepa_bank_transfer'
  | 'gbp_bank_transfer'
  | 'pix_instant_payment'
  | 'paypal';

export interface PaymentMethodMeta {
  id: PaymentMethod;
  label: string;
  /** Second line in the picker — speed / rails. */
  hint: string;
  instant: boolean;
}

export const PAYMENT_METHODS: Record<PaymentMethod, PaymentMethodMeta> = {
  credit_debit_card: { id: 'credit_debit_card', label: 'Credit / Debit card', hint: 'Visa · Mastercard · Instant', instant: true },
  apple_pay: { id: 'apple_pay', label: 'Apple Pay', hint: 'Instant', instant: true },
  google_pay: { id: 'google_pay', label: 'Google Pay', hint: 'Instant · Android', instant: true },
  sepa_bank_transfer: { id: 'sepa_bank_transfer', label: 'Bank transfer', hint: 'SEPA · 1–3 business days', instant: false },
  gbp_bank_transfer: { id: 'gbp_bank_transfer', label: 'Bank transfer', hint: 'Faster Payments · 1 business day', instant: false },
  pix_instant_payment: { id: 'pix_instant_payment', label: 'PIX', hint: 'Instant · Brazil', instant: true },
  paypal: { id: 'paypal', label: 'PayPal', hint: 'Instant', instant: true },
};

const EU_SEPA = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','CH','MC','SM','VA','AD',
]);
const PAYPAL_REGIONS = new Set(['US', 'GB', ...Array.from(EU_SEPA)]);
PAYPAL_REGIONS.delete('HR'); PAYPAL_REGIONS.delete('HU'); PAYPAL_REGIONS.delete('IS');

export type Platform = 'ios' | 'android' | 'desktop';

export const detectPlatform = (): Platform => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
};

/**
 * Methods offered for a country + fiat currency, in picker order.
 * `available === false` rows are shown greyed with `reason` (never hidden).
 */
export const paymentMethodsFor = (
  country: string | null,
  fiat: string,
  platform: Platform = detectPlatform(),
): Array<{ meta: PaymentMethodMeta; available: boolean; reason?: string }> => {
  const cc = (country ?? '').toUpperCase();
  const f = fiat.toUpperCase();
  const rows: Array<{ meta: PaymentMethodMeta; available: boolean; reason?: string }> = [
    { meta: PAYMENT_METHODS.credit_debit_card, available: true },
  ];
  if (platform !== 'android') rows.push({ meta: PAYMENT_METHODS.apple_pay, available: true });
  if (platform !== 'ios') rows.push({ meta: PAYMENT_METHODS.google_pay, available: platform === 'android' || platform === 'desktop' });
  if (f === 'EUR') rows.push({ meta: PAYMENT_METHODS.sepa_bank_transfer, available: EU_SEPA.has(cc) || cc === '', reason: 'SEPA accounts only' });
  if (f === 'GBP') rows.push({ meta: PAYMENT_METHODS.gbp_bank_transfer, available: cc === 'GB' || cc === '', reason: 'UK bank accounts only' });
  if (f === 'BRL') rows.push({ meta: PAYMENT_METHODS.pix_instant_payment, available: cc === 'BR' || cc === '', reason: 'Brazil only' });
  rows.push({
    meta: PAYMENT_METHODS.paypal,
    available: PAYPAL_REGIONS.has(cc),
    reason: 'Not available in your region',
  });
  return rows;
};

export const defaultPaymentMethod = (country: string | null, fiat: string, platform = detectPlatform()): PaymentMethod => {
  const rows = paymentMethodsFor(country, fiat, platform);
  if (platform === 'ios' && rows.some((r) => r.meta.id === 'apple_pay' && r.available)) return 'apple_pay';
  return 'credit_debit_card';
};

/* ------------------------------------------------------------------ */
/* Fiat currencies + quick-amount chips                                 */
/* ------------------------------------------------------------------ */

export interface FiatCurrency {
  code: string;          // 'USD'
  name: string;
  flag: string;
  symbol: string;
  minBuyAmount: number;
  maxBuyAmount: number;
  /** Quick chips, whole numbers in the currency's own scale. */
  chips: [number, number, number, number];
  decimals: 0 | 2;
}

/** Supported fiat set we expose in the picker (MoonPay supports more; these cover our markets). */
export const FIAT_CURRENCIES: Record<string, FiatCurrency> = {
  USD: { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$', minBuyAmount: 30, maxBuyAmount: 12000, chips: [50, 100, 250, 500], decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€', minBuyAmount: 30, maxBuyAmount: 10000, chips: [50, 100, 250, 500], decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£', minBuyAmount: 25, maxBuyAmount: 9000, chips: [50, 100, 250, 500], decimals: 2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$', minBuyAmount: 40, maxBuyAmount: 15000, chips: [50, 100, 300, 500], decimals: 2 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', symbol: 'HK$', minBuyAmount: 250, maxBuyAmount: 90000, chips: [500, 1000, 3000, 5000], decimals: 0 },
  AUD: { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$', minBuyAmount: 45, maxBuyAmount: 18000, chips: [50, 100, 300, 500], decimals: 2 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$', minBuyAmount: 40, maxBuyAmount: 16000, chips: [50, 100, 300, 500], decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥', minBuyAmount: 5000, maxBuyAmount: 1800000, chips: [5000, 10000, 30000, 50000], decimals: 0 },
  KRW: { code: 'KRW', name: 'Korean Won', flag: '🇰🇷', symbol: '₩', minBuyAmount: 40000, maxBuyAmount: 16000000, chips: [50000, 100000, 300000, 500000], decimals: 0 },
  TWD: { code: 'TWD', name: 'New Taiwan Dollar', flag: '🇹🇼', symbol: 'NT$', minBuyAmount: 1000, maxBuyAmount: 380000, chips: [1500, 3000, 8000, 15000], decimals: 0 },
  BRL: { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', symbol: 'R$', minBuyAmount: 150, maxBuyAmount: 60000, chips: [250, 500, 1000, 2500], decimals: 2 },
  TRY: { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷', symbol: '₺', minBuyAmount: 1000, maxBuyAmount: 400000, chips: [1500, 3000, 8000, 15000], decimals: 0 },
  AED: { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', symbol: 'د.إ', minBuyAmount: 110, maxBuyAmount: 44000, chips: [200, 400, 1000, 2000], decimals: 2 },
  VND: { code: 'VND', name: 'Vietnamese Dong', flag: '🇻🇳', symbol: '₫', minBuyAmount: 750000, maxBuyAmount: 300000000, chips: [1000000, 2500000, 5000000, 10000000], decimals: 0 },
  THB: { code: 'THB', name: 'Thai Baht', flag: '🇹🇭', symbol: '฿', minBuyAmount: 1000, maxBuyAmount: 400000, chips: [1500, 3000, 8000, 15000], decimals: 0 },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩', symbol: 'Rp', minBuyAmount: 500000, maxBuyAmount: 190000000, chips: [500000, 1000000, 3000000, 5000000], decimals: 0 },
  PHP: { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭', symbol: '₱', minBuyAmount: 1700, maxBuyAmount: 680000, chips: [2500, 5000, 15000, 25000], decimals: 0 },
  NGN: { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬', symbol: '₦', minBuyAmount: 45000, maxBuyAmount: 18000000, chips: [50000, 100000, 300000, 500000], decimals: 0 },
};

/** Approximate USD per 1 unit of fiat — demo quotes only (live uses the quote API). */
const DEMO_USD_RATE: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, SGD: 0.74, HKD: 0.128, AUD: 0.65, CAD: 0.73, JPY: 0.0067, KRW: 0.00073, TWD: 0.031,
  BRL: 0.19, TRY: 0.03, AED: 0.272, VND: 0.00004, THB: 0.028, IDR: 0.000063, PHP: 0.0175, NGN: 0.00065,
};

const COUNTRY_FIAT: Record<string, string> = {
  US: 'USD', GB: 'GBP', SG: 'SGD', HK: 'HKD', AU: 'AUD', CA: 'CAD', JP: 'JPY', KR: 'KRW', TW: 'TWD', BR: 'BRL',
  TR: 'TRY', AE: 'AED', VN: 'VND', TH: 'THB', ID: 'IDR', PH: 'PHP', NG: 'NGN',
};

export const defaultFiatFor = (country: string | null): string => {
  const cc = (country ?? '').toUpperCase();
  if (COUNTRY_FIAT[cc]) return COUNTRY_FIAT[cc];
  if (EU_SEPA.has(cc) && !['CH', 'NO', 'IS', 'LI', 'DK', 'SE', 'PL', 'CZ', 'HU', 'RO', 'BG'].includes(cc)) return 'EUR';
  return 'USD';
};

/** `$4.82`; with `whole` → `$100` / `$12,000` (chips, min/max). */
export const formatFiat = (amount: number, code: string, whole = false): string => {
  const cur = FIAT_CURRENCIES[code] ?? FIAT_CURRENCIES.USD;
  const digits = whole ? 0 : cur.decimals;
  const n = amount.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${cur.symbol}${n}`;
};

/* ------------------------------------------------------------------ */
/* Region                                                               */
/* ------------------------------------------------------------------ */

export interface MoonPayRegion {
  country: string | null; // ISO alpha-2
  isBuyAllowed: boolean;
  /** true when the lookup failed and we fell back to "allowed". */
  fallback: boolean;
}

const REGION_KEY = 'omenx:moonpay:region:v1';

/**
 * One IP lookup per session. On any failure we treat the region as supported
 * and let MoonPay's own widget do the blocking (rule 3, CPO 2026-10-23).
 */
export const getRegion = async (): Promise<MoonPayRegion> => {
  if (typeof window !== 'undefined') {
    try {
      const cached = window.sessionStorage.getItem(REGION_KEY);
      if (cached) return JSON.parse(cached) as MoonPayRegion;
    } catch { /* ignore */ }
  }
  let region: MoonPayRegion = { country: null, isBuyAllowed: true, fallback: true };
  if (!MOONPAY_DEMO) {
    try {
      const res = await fetch(`${API}/v4/ip_address?apiKey=${MOONPAY_API_KEY}`);
      if (res.ok) {
        const j = (await res.json()) as { alpha2?: string; isBuyAllowed?: boolean; isAllowed?: boolean };
        region = {
          country: j.alpha2 ?? null,
          isBuyAllowed: j.isBuyAllowed ?? j.isAllowed ?? true,
          fallback: false,
        };
      }
    } catch { /* keep fallback */ }
  } else {
    // Demo: guess from the browser locale so the default currency still feels local.
    const loc = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
    const cc = loc.split('-')[1]?.toUpperCase() ?? null;
    region = { country: cc, isBuyAllowed: true, fallback: false };
  }
  try { window.sessionStorage.setItem(REGION_KEY, JSON.stringify(region)); } catch { /* ignore */ }
  return region;
};

/* ------------------------------------------------------------------ */
/* Quotes                                                               */
/* ------------------------------------------------------------------ */

export interface BuyQuote {
  fiatCode: string;
  fiatAmount: number;
  paymentMethod: PaymentMethod;
  /** USDC the user receives. */
  quoteAmount: number;
  moonpayFee: number;
  networkFee: number;
  totalFee: number;
  /** 1 USDC in fiat. */
  rate: number;
}

const demoQuote = (fiatCode: string, fiatAmount: number, paymentMethod: PaymentMethod): BuyQuote => {
  const usdRate = DEMO_USD_RATE[fiatCode] ?? 1;
  const rate = 1 / usdRate; // fiat per USDC
  const bankish = paymentMethod === 'sepa_bank_transfer' || paymentMethod === 'gbp_bank_transfer' || paymentMethod === 'pix_instant_payment';
  const pct = bankish ? 0.01 : 0.045;
  const minFee = (bankish ? 1.3 : 4.5) * rate;
  const moonpayFee = Math.max(minFee, fiatAmount * pct);
  const networkFee = 0.32 * rate;
  const totalFee = moonpayFee + networkFee;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const quoteAmount = r2(Math.max(0, (fiatAmount - totalFee) * usdRate));
  return { fiatCode, fiatAmount, paymentMethod, quoteAmount, moonpayFee: r2(moonpayFee), networkFee: r2(networkFee), totalFee: r2(totalFee), rate };
};

export const getBuyQuote = async (
  fiatCode: string,
  fiatAmount: number,
  paymentMethod: PaymentMethod,
  signal?: AbortSignal,
): Promise<BuyQuote> => {
  if (MOONPAY_DEMO) {
    await new Promise((r) => setTimeout(r, 350));
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError');
    return demoQuote(fiatCode, fiatAmount, paymentMethod);
  }
  const url =
    `${API}/v3/currencies/${USDC_BASE_CODE}/buy_quote?apiKey=${MOONPAY_API_KEY}` +
    `&baseCurrencyCode=${fiatCode.toLowerCase()}&baseCurrencyAmount=${fiatAmount}` +
    `&paymentMethod=${paymentMethod}&areFeesIncluded=true`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`quote ${res.status}`);
  const j = (await res.json()) as {
    quoteCurrencyAmount: number; feeAmount: number; extraFeeAmount?: number; networkFeeAmount: number; quoteCurrencyPrice: number;
  };
  const moonpayFee = (j.feeAmount ?? 0) + (j.extraFeeAmount ?? 0);
  return {
    fiatCode,
    fiatAmount,
    paymentMethod,
    quoteAmount: j.quoteCurrencyAmount,
    moonpayFee,
    networkFee: j.networkFeeAmount ?? 0,
    totalFee: moonpayFee + (j.networkFeeAmount ?? 0),
    rate: j.quoteCurrencyPrice,
  };
};

/* ------------------------------------------------------------------ */
/* Web SDK (script tag — no npm dependency; autopush never installs)    */
/* ------------------------------------------------------------------ */

export interface MoonPaySdkHandle {
  show: () => void;
  close: () => void;
  generateUrlForSigning: () => string;
  updateSignature: (sig: string) => void;
}

interface MoonPaySdkInit {
  flow: 'buy';
  environment: 'sandbox' | 'production';
  variant: 'overlay' | 'embedded' | 'newTab' | 'newWindow';
  params: Record<string, string | undefined>;
  handlers?: {
    onTransactionCompleted?: (p: unknown) => Promise<void> | void;
    onCloseOverlay?: () => Promise<void> | void;
  };
}

declare global {
  interface Window {
    MoonPayWebSdk?: { init: (cfg: MoonPaySdkInit) => MoonPaySdkHandle };
  }
}

let sdkPromise: Promise<NonNullable<Window['MoonPayWebSdk']>> | null = null;

export const loadMoonPaySdk = () => {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.MoonPayWebSdk) return resolve(window.MoonPayWebSdk);
    const s = document.createElement('script');
    s.src = SDK_SRC;
    s.async = true;
    s.onload = () => (window.MoonPayWebSdk ? resolve(window.MoonPayWebSdk) : reject(new Error('MoonPay SDK missing')));
    s.onerror = () => reject(new Error('MoonPay SDK failed to load'));
    document.head.appendChild(s);
  });
  return sdkPromise;
};

/* ------------------------------------------------------------------ */
/* Orders (shared shape with fiat_orders table)                         */
/* ------------------------------------------------------------------ */

export type FiatOrderStatus = 'waiting_payment' | 'pending' | 'sending' | 'completed' | 'failed';

export interface FiatOrder {
  id: string;
  status: FiatOrderStatus;
  fiatCode: string;
  fiatAmount: number;
  quoteAmount: number;
  totalFee: number;
  paymentMethod: PaymentMethod;
  cardBrand: string | null;
  cardLast4: string | null;
  failureReason: string | null;
  account: 'spot' | 'futures';
  providerTxId: string | null;
  transactionId: string | null;
  createdAt: string;
  paidAt: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
}

/** Human wording for MoonPay failure codes — never show raw codes (rule 12). */
export const failureCopy = (reason: string | null): string => {
  const r = (reason ?? '').toLowerCase();
  if (r.includes('kyc') || r.includes('identity') || r.includes('verification'))
    return 'MoonPay couldn’t verify your identity. You can retry with a clearer ID photo, or deposit USDC instead.';
  if (r.includes('3ds') || r.includes('authentication') || r.includes('3d_secure'))
    return 'Your bank’s security check (3D Secure) didn’t go through. Try again and approve the request in your banking app.';
  if (r.includes('limit')) return 'This amount is over your card’s limit for crypto purchases. Try a smaller amount.';
  return 'Your bank declined the payment. Some banks block crypto purchases; a debit card usually works.';
};
