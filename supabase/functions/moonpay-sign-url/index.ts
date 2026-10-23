// moonpay-sign-url — creates a card order and signs the MoonPay widget URL.
//
// Called twice per checkout by src/hooks/useFiatOrders.ts:
//   1. { action: "create", fiatCode, fiatAmount, quoteAmount, totalFee,
//        paymentMethod, account, walletAddress }
//      → inserts fiat_orders (waiting_payment) + the fiat_buy ledger row (pending),
//        returns { order }.
//   2. { action: "sign", orderId, urlForSignature }
//      → HMAC-SHA256(secret, query string incl. leading "?") base64. Returns { signature }.
//      The IP-matching hash MoonPay requires in production (allowedIpAddress) is
//      returned by "create" and placed in the SDK params by the browser first.
//
// Secrets (Supabase › Edge Function secrets): MOONPAY_SECRET_KEY (sk_live_/sk_test_).
// Never expose the secret to the browser. Docs: dev.moonpay.com › URL signing / IP matching.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ALLOWED_METHODS = new Set([
  "credit_debit_card", "apple_pay", "google_pay", "sepa_bank_transfer", "gbp_bank_transfer", "pix_instant_payment", "paypal",
]);

const hmacBase64 = async (secret: string, message: string) => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
};

const clientIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") ??
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  req.headers.get("x-real-ip") ??
  null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const secret = Deno.env.get("MOONPAY_SECRET_KEY");
    if (!secret) return json({ error: "MOONPAY_SECRET_KEY not configured" }, 500);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();

    if (body.action === "create") {
      const { fiatCode, fiatAmount, quoteAmount, totalFee, paymentMethod, account, walletAddress } = body;
      if (typeof fiatCode !== "string" || !/^[A-Z]{3}$/.test(fiatCode)) return json({ error: "Invalid fiatCode" }, 400);
      if (typeof fiatAmount !== "number" || fiatAmount <= 0) return json({ error: "Invalid fiatAmount" }, 400);
      if (typeof quoteAmount !== "number" || quoteAmount <= 0) return json({ error: "Invalid quoteAmount" }, 400);
      if (!ALLOWED_METHODS.has(paymentMethod)) return json({ error: "Invalid paymentMethod" }, 400);
      if (account !== "spot" && account !== "futures") return json({ error: "Invalid account" }, 400);
      if (typeof walletAddress !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) return json({ error: "Invalid walletAddress" }, 400);

      const { data: ledger, error: ledgerErr } = await admin
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "fiat_buy",
          amount: quoteAmount,
          description: "Card purchase · Card",
          status: "pending",
          network: "Base",
          account,
        })
        .select("id")
        .single();
      if (ledgerErr) throw ledgerErr;

      const { data: order, error: orderErr } = await admin
        .from("fiat_orders")
        .insert({
          user_id: user.id,
          provider: "moonpay",
          status: "waiting_payment",
          fiat_code: fiatCode,
          fiat_amount: fiatAmount,
          quote_amount: quoteAmount,
          total_fee: typeof totalFee === "number" ? totalFee : 0,
          payment_method: paymentMethod,
          account,
          wallet_address: walletAddress,
          transaction_id: ledger.id,
        })
        .select("*")
        .single();
      if (orderErr) throw orderErr;
      // IP matching (required to go live): the browser puts this hash in the SDK
      // params as `allowedIpAddress` BEFORE generating the URL for signing.
      const ip = clientIp(req);
      const allowedIpAddress = ip ? await hmacBase64(secret, ip) : undefined;
      return json({ order, allowedIpAddress });
    }

    if (body.action === "sign") {
      const { orderId, urlForSignature } = body;
      if (typeof orderId !== "string" || typeof urlForSignature !== "string") return json({ error: "Bad request" }, 400);
      const { data: order } = await admin.from("fiat_orders").select("id,user_id,wallet_address").eq("id", orderId).maybeSingle();
      if (!order || order.user_id !== user.id) return json({ error: "Order not found" }, 404);

      // The SDK gives us the full URL; the signature covers the query string including "?".
      const url = new URL(urlForSignature);
      if (order.wallet_address && url.searchParams.get("walletAddress") !== order.wallet_address) {
        return json({ error: "walletAddress mismatch" }, 400);
      }
      const signature = await hmacBase64(secret, url.search);
      return json({ signature });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error)?.message ?? "Internal error" }, 500);
  }
});
