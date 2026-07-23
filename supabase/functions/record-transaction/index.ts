import { createClient } from "npm:@supabase/supabase-js@2";

// Local CORS headers (npm:@supabase/supabase-js@2/cors does not exist as a subpath export)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TYPES = new Set([
  "deposit",
  "withdraw",
  "card_deposit",
  "cross_chain_in",
  "cross_chain_out",
  "fiat_buy",
  "fiat_sell",
  "trade_profit",
  "trade_loss",
  "transfer_to_spot",
  "transfer_to_futures",
]);

const ALLOWED_STATUS = new Set([
  "completed",
  "processing",
  "pending",
  "failed",
  "rejected",
]);

const ALLOWED_ACCOUNTS = new Set(["spot", "futures"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller via JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { type, amount, description, status, network, tx_hash, account } = body ?? {};

    if (typeof type !== "string" || !ALLOWED_TYPES.has(type)) {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (Math.abs(amount) > 1_000_000) {
      return new Response(JSON.stringify({ error: "Amount out of bounds" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const finalStatus = typeof status === "string" && ALLOWED_STATUS.has(status) ? status : "processing";

    const admin = createClient(supabaseUrl, serviceKey);
    const { data, error } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        type,
        amount,
        description: typeof description === "string" ? description.slice(0, 500) : null,
        status: finalStatus,
        network: typeof network === "string" ? network.slice(0, 100) : null,
        tx_hash: typeof tx_hash === "string" ? tx_hash.slice(0, 200) : null,
        account: typeof account === "string" && ALLOWED_ACCOUNTS.has(account) ? account : null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
