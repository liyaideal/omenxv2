/**
 * Fiat (MoonPay) orders — create, track, and the Lovable demo engine.
 *
 * Live platform: `moonpay-sign-url` creates the order + ledger row with the
 * service role and returns the URL signature; `moonpay-webhook` advances
 * `fiat_orders.status` and the linked `transactions` row. The browser only
 * reads (polling every 4s while the order is open).
 *
 * Demo engine (no VITE_MOONPAY_API_KEY): the browser inserts the order and
 * the ledger row itself, then walks the status machine on timers and credits
 * the account balance on completion. Marked `DEMO_ENGINE` below — the live
 * platform deletes that branch, nothing else.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  MOONPAY_DEMO,
  type BuyQuote,
  type FiatOrder,
  type FiatOrderStatus,
  type PaymentMethod,
} from '@/lib/moonpay';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from('fiat_orders');

interface OrderRow {
  id: string;
  status: FiatOrderStatus;
  fiat_code: string;
  fiat_amount: number | string;
  quote_amount: number | string;
  total_fee: number | string;
  payment_method: PaymentMethod;
  card_brand: string | null;
  card_last4: string | null;
  failure_reason: string | null;
  account: 'spot' | 'futures';
  provider_tx_id: string | null;
  transaction_id: string | null;
  created_at: string;
  paid_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
}

const toOrder = (r: OrderRow): FiatOrder => ({
  id: r.id,
  status: r.status,
  fiatCode: r.fiat_code,
  fiatAmount: Number(r.fiat_amount),
  quoteAmount: Number(r.quote_amount),
  totalFee: Number(r.total_fee),
  paymentMethod: r.payment_method,
  cardBrand: r.card_brand,
  cardLast4: r.card_last4,
  failureReason: r.failure_reason,
  account: r.account,
  providerTxId: r.provider_tx_id,
  transactionId: r.transaction_id,
  createdAt: r.created_at,
  paidAt: r.paid_at,
  confirmedAt: r.confirmed_at,
  completedAt: r.completed_at,
});

export const isOpenOrder = (s: FiatOrderStatus) => s === 'waiting_payment' || s === 'pending' || s === 'sending';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  credit_debit_card: 'Card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  sepa_bank_transfer: 'Bank transfer',
  gbp_bank_transfer: 'Bank transfer',
  pix_instant_payment: 'PIX',
  paypal: 'PayPal',
};

/** Ledger description shown in Wallet rows: "Card purchase · Visa •• 4242". */
export const fiatLedgerDescription = (o: Pick<FiatOrder, 'paymentMethod' | 'cardBrand' | 'cardLast4'>) => {
  const tail = o.cardBrand && o.cardLast4 ? `${o.cardBrand} •• ${o.cardLast4}` : METHOD_LABEL[o.paymentMethod];
  return `Card purchase · ${tail}`;
};

export interface CreateOrderInput {
  quote: BuyQuote;
  account: 'spot' | 'futures';
  walletAddress: string;
}

export interface CreateOrderResult {
  order: FiatOrder;
  /** Live only: HMAC of the user's IP for MoonPay IP matching — goes into SDK params. */
  allowedIpAddress?: string;
  /** Live only: returned by moonpay-sign-url after the SDK URL is signed. */
  sign?: (urlForSignature: string) => Promise<string>;
}

export const useFiatOrders = () => {
  const { user, addBalance, addSpotBalance } = useUserProfile();
  const queryClient = useQueryClient();

  const invalidateLedger = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['wallet-fund-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [queryClient]);

  const fetchOrder = useCallback(async (id: string): Promise<FiatOrder | null> => {
    const { data, error } = await db().select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return toOrder(data as OrderRow);
  }, []);

  const fetchOrderByTransaction = useCallback(async (transactionId: string): Promise<FiatOrder | null> => {
    const { data, error } = await db().select('*').eq('transaction_id', transactionId).maybeSingle();
    if (error || !data) return null;
    return toOrder(data as OrderRow);
  }, []);

  const fetchOpenOrders = useCallback(async (): Promise<FiatOrder[]> => {
    if (!user) return [];
    const { data } = await db()
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['waiting_payment', 'pending', 'sending'])
      .order('created_at', { ascending: false });
    return ((data ?? []) as OrderRow[]).map(toOrder);
  }, [user]);

  const createOrder = useCallback(async (input: CreateOrderInput): Promise<CreateOrderResult> => {
    if (!user) throw new Error('Not signed in');
    const { quote, account, walletAddress } = input;

    if (!MOONPAY_DEMO) {
      const { data, error } = await supabase.functions.invoke('moonpay-sign-url', {
        body: {
          action: 'create',
          fiatCode: quote.fiatCode,
          fiatAmount: quote.fiatAmount,
          quoteAmount: quote.quoteAmount,
          totalFee: quote.totalFee,
          paymentMethod: quote.paymentMethod,
          account,
          walletAddress,
        },
      });
      if (error) throw new Error(error.message);
      const order = toOrder(data.order as OrderRow);
      const sign = async (urlForSignature: string) => {
        const { data: s, error: e } = await supabase.functions.invoke('moonpay-sign-url', {
          body: { action: 'sign', orderId: order.id, urlForSignature },
        });
        if (e) throw new Error(e.message);
        return s.signature as string;
      };
      return { order, allowedIpAddress: data.allowedIpAddress as string | undefined, sign };
    }

    // DEMO_ENGINE — browser-side order + ledger row.
    const { data: ledger, error: ledgerErr } = await supabase.functions.invoke('record-transaction', {
      body: {
        type: 'fiat_buy',
        amount: quote.quoteAmount,
        description: fiatLedgerDescription({ paymentMethod: quote.paymentMethod, cardBrand: null, cardLast4: null }),
        status: 'pending',
        network: 'Base',
        account,
      },
    });
    const transactionId: string | null = ledgerErr ? null : (ledger?.transaction?.id ?? ledger?.id ?? null);

    const { data, error } = await db()
      .insert({
        user_id: user.id,
        provider: 'moonpay',
        status: 'waiting_payment',
        fiat_code: quote.fiatCode,
        fiat_amount: quote.fiatAmount,
        quote_amount: quote.quoteAmount,
        total_fee: quote.totalFee,
        payment_method: quote.paymentMethod,
        account,
        wallet_address: walletAddress,
        transaction_id: transactionId,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    invalidateLedger();
    return { order: toOrder(data as OrderRow) };
  }, [user, invalidateLedger]);

  /** DEMO_ENGINE — called when the demo overlay "pays". Walks the machine on timers. */
  const demoAdvance = useCallback(async (orderId: string, outcome: 'completed' | 'failed') => {
    const patch = async (p: Partial<OrderRow> & Record<string, unknown>) => {
      await db().update(p).eq('id', orderId);
    };
    const { data } = await db().select('*').eq('id', orderId).maybeSingle();
    const row = data as OrderRow | null;
    if (!row) return;
    const now = () => new Date().toISOString();
    const brand = row.payment_method === 'apple_pay' ? 'Apple Pay' : row.payment_method === 'google_pay' ? 'Google Pay' : 'Visa';
    const last4 = row.payment_method === 'credit_debit_card' ? '4242' : null;

    const syncLedger = async (status: 'pending' | 'processing' | 'completed' | 'failed') => {
      if (!row.transaction_id) return;
      await supabase
        .from('transactions')
        .update({ status, description: fiatLedgerDescription({ paymentMethod: row.payment_method, cardBrand: brand, cardLast4: last4 }) })
        .eq('id', row.transaction_id);
      invalidateLedger();
    };

    if (outcome === 'failed') {
      await patch({ status: 'failed', failure_reason: 'card_declined', card_brand: brand, card_last4: last4 });
      await syncLedger('failed');
      return;
    }
    await patch({ status: 'pending', paid_at: now(), card_brand: brand, card_last4: last4, provider_tx_id: `demo_${orderId.slice(0, 8)}` });
    await syncLedger('processing');
    await new Promise((r) => setTimeout(r, 1800));
    await patch({ status: 'sending', confirmed_at: now() });
    await new Promise((r) => setTimeout(r, 2600));
    await patch({ status: 'completed', completed_at: now() });
    await syncLedger('completed');
    if (row.account === 'spot') await addSpotBalance(Number(row.quote_amount));
    else await addBalance(Number(row.quote_amount));
  }, [addBalance, addSpotBalance, invalidateLedger]);

  const cancelOrder = useCallback(async (orderId: string) => {
    await db().update({ status: 'failed', failure_reason: 'cancelled' }).eq('id', orderId);
    const { data } = await db().select('transaction_id').eq('id', orderId).maybeSingle();
    const txId = (data as { transaction_id?: string } | null)?.transaction_id;
    if (txId) await supabase.from('transactions').update({ status: 'failed' }).eq('id', txId);
    invalidateLedger();
  }, [invalidateLedger]);

  return { createOrder, fetchOrder, fetchOrderByTransaction, fetchOpenOrders, demoAdvance, cancelOrder, invalidateLedger };
};

/** Poll one order every 4s while it is open. `fixture` freezes it for the style guide. */
export const useFiatOrderTracker = (orderId: string | null, fixture?: FiatOrder) => {
  const { fetchOrder, invalidateLedger } = useFiatOrders();
  const [order, setOrder] = useState<FiatOrder | null>(fixture ?? null);
  const lastStatus = useRef<FiatOrderStatus | null>(fixture?.status ?? null);

  useEffect(() => {
    if (fixture) { setOrder(fixture); return; }
    if (!orderId) { setOrder(null); return; }
    let alive = true;
    let timer: number | undefined;
    const tick = async () => {
      const o = await fetchOrder(orderId);
      if (!alive) return;
      if (o) {
        setOrder(o);
        if (lastStatus.current !== o.status) {
          lastStatus.current = o.status;
          if (o.status === 'completed' || o.status === 'failed') invalidateLedger();
        }
        if (isOpenOrder(o.status)) timer = window.setTimeout(tick, 4000);
      } else {
        timer = window.setTimeout(tick, 4000);
      }
    };
    void tick();
    return () => { alive = false; if (timer) window.clearTimeout(timer); };
  }, [orderId, fixture, fetchOrder, invalidateLedger]);

  return order;
};
