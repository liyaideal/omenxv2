// moonpay-webhook — advances fiat_orders + the linked fiat_buy ledger row.
//
// Register in MoonPay Dashboard › Developers › Webhooks with events
// transaction_created / transaction_updated / transaction_failed.
// Requests carry `Moonpay-Signature-V2: t=<unix>,s=<hex hmac>`; we verify
// HMAC-SHA256(MOONPAY_WEBHOOK_KEY, `${t}.${rawBody}`) (dev.moonpay.com › Webhooks › Signature).
// Delivery is at-least-once and unordered → every write here is idempotent and
// never moves an order backwards.
//
// Secrets: MOONPAY_WEBHOOK_KEY. Deploy without a JWT check (MoonPay has no
// Supabase session): supabase/config.toml → [functions.moonpay-webhook] verify_jwt = false.
//
// Status mapping (MoonPay → fiat_orders → transactions):
//   waitingPayment       → waiting_payment → pending
//   pending / waitingAuthorization → pending → processing
//   completed with cryptoTransactionId pending → sending → processing
//   completed            → completed → completed   (+ credit balance)
//   failed               → failed → failed

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, moonpay-signature, moonpay-signature-v2", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const hmacHex = async (secret: string, message: string) => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const verify = async (req: Request, raw: string, secret: string) => {
  const header = req.headers.get("Moonpay-Signature-V2") ?? req.headers.get("moonpay-signature-v2");
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.trim().split("=") as [string, string]));
  if (!parts.t || !parts.s) return false;
  const expected = await hmacHex(secret, `${parts.t}.${raw}`);
  return expected === parts.s;
};

type OrderStatus = "waiting_payment" | "pending" | "sending" | "completed" | "failed";
const RANK: Record<OrderStatus, number> = { waiting_payment: 0, pending: 1, sending: 2, completed: 3, failed: 3 };

const mapStatus = (mp: string, cryptoTxId?: string | null): OrderStatus => {
  switch (mp) {
    case "waitingPayment": return "waiting_payment";
    case "pending":
    case "waitingAuthorization": return "pending";
    case "completed": return cryptoTxId ? "completed" : "sending";
    case "failed": return "failed";
    default: return "pending";
  }
};

const LEDGER: Record<OrderStatus, "pending" | "processing" | "completed" | "failed"> = {
  waiting_payment: "pending", pending: "processing", sending: "processing", completed: "completed", failed: "failed",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const secret = Deno.env.get("MOONPAY_WEBHOOK_KEY");
    if (!secret) return json({ error: "MOONPAY_WEBHOOK_KEY not configured" }, 500);
    const raw = await req.text();
    if (!(await verify(req, raw, secret))) return json({ error: "Bad signature" }, 401);

    const evt = JSON.parse(raw) as {
      type: string;
      data: {
        id: string;
        status: string;
        externalTransactionId?: string | null;
        externalCustomerId?: string | null;
        cryptoTransactionId?: string | null;
        failureReason?: string | null;
        quoteCurrencyAmount?: number | null;
        baseCurrencyAmount?: number | null;
        feeAmount?: number | null;
        networkFeeAmount?: number | null;
        extraFeeAmount?: number | null;
        paymentMethod?: string | null;
        cardType?: string | null;
        card?: { brand?: string | null; lastDigits?: string | null } | null;
        walletAddress?: string | null;
      };
    };
    const d = evt.data;
    if (!d?.externalTransactionId) return json({ ok: true, ignored: "no externalTransactionId" });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: order } = await admin.from("fiat_orders").select("*").eq("id", d.externalTransactionId).maybeSingle();
    if (!order) return json({ ok: true, ignored: "unknown order" });

    const next = mapStatus(d.status, d.cryptoTransactionId);
    const current = order.status as OrderStatus;
    // Idempotent + monotonic: never move backwards, never re-complete.
    if (RANK[next] < RANK[current] || (RANK[current] === 3 && next !== current)) return json({ ok: true, ignored: "stale" });
    if (RANK[current] === 3) return json({ ok: true, ignored: "terminal" });

    const now = new Date().toISOString();
    const brand = d.card?.brand ?? d.cardType ?? null;
    const last4 = d.card?.lastDigits ?? null;
    const patch: Record<string, unknown> = {
      status: next,
      provider_tx_id: d.id,
      card_brand: brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : order.card_brand,
      card_last4: last4 ?? order.card_last4,
      failure_reason: next === "failed" ? (d.failureReason ?? "declined") : null,
    };
    if (typeof d.quoteCurrencyAmount === "number" && d.quoteCurrencyAmount > 0) patch.quote_amount = d.quoteCurrencyAmount;
    const fee = (d.feeAmount ?? 0) + (d.networkFeeAmount ?? 0) + (d.extraFeeAmount ?? 0);
    if (fee > 0) patch.total_fee = fee;
    if (RANK[next] >= 1 && !order.paid_at) patch.paid_at = now;
    if (RANK[next] >= 2 && !order.confirmed_at) patch.confirmed_at = now;
    if (next === "completed") patch.completed_at = now;

    const { error: upErr } = await admin.from("fiat_orders").update(patch).eq("id", order.id).eq("status", current);
    if (upErr) throw upErr;

    if (order.transaction_id) {
      const desc = `Card purchase · ${patch.card_brand && patch.card_last4 ? `${patch.card_brand} •• ${patch.card_last4}` : "Card"}`;
      const ledgerPatch: Record<string, unknown> = { status: LEDGER[next], description: desc };
      if (patch.quote_amount) ledgerPatch.amount = patch.quote_amount;
      await admin.from("transactions").update(ledgerPatch).eq("id", order.transaction_id);
    }

    // Balance credit on completion. NOTE for the live platform: on-chain USDC lands in the
    // user's custody address and the normal deposit detector credits it — remove this block
    // if that path is authoritative, to avoid a double credit. Lovable: this is the credit.
    if (next === "completed") {
      const amount = Number(patch.quote_amount ?? order.quote_amount);
      const col = order.account === "spot" ? "spot_balance" : "balance";
      const { data: prof } = await admin.from("profiles").select(`${col}`).eq("user_id", order.user_id).maybeSingle();
      const cur = Number((prof as Record<string, unknown> | null)?.[col] ?? 0);
      await admin.from("profiles").update({ [col]: cur + amount }).eq("user_id", order.user_id);
    }

    return json({ ok: true, status: next });
  } catch (e) {
    return json({ error: (e as Error)?.message ?? "Internal error" }, 500);
  }
});
