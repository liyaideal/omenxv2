// sim-transfer — atomic transfer between the futures and spot accounts.
// DEMO-STATE: this Edge Function is authoritative for the two-side ledger write
// (one debit + one credit + two `transactions` rows), but `profiles.balance`
// and `profiles.spot_balance` are still client-writable in the current demo
// (RLS not yet converged). Production target: converge all balance writes to
// server-side EFs and reject direct client updates.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  direction: z.enum(["to_spot", "to_futures"]),
  amount: z.number().positive().max(1_000_000),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { direction, amount } = parsed.data;

    const admin = createClient(supabaseUrl, serviceKey);

    // Read current balances
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("balance, spot_balance")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileErr || !profile) return json({ error: "Profile not found" }, 404);

    const currentFutures = Number(profile.balance ?? 0);
    const currentSpot = Number(profile.spot_balance ?? 0);

    const fromKey = direction === "to_spot" ? "futures" : "spot";
    const fromBalance = fromKey === "futures" ? currentFutures : currentSpot;
    if (fromBalance < amount) {
      return json({
        error: `Insufficient ${fromKey} balance`,
        available: fromBalance,
        requested: amount,
      }, 400);
    }

    const nextFutures = direction === "to_spot" ? currentFutures - amount : currentFutures + amount;
    const nextSpot = direction === "to_spot" ? currentSpot + amount : currentSpot - amount;

    const { error: updateErr } = await admin
      .from("profiles")
      .update({ balance: nextFutures, spot_balance: nextSpot })
      .eq("user_id", user.id);
    if (updateErr) return json({ error: updateErr.message }, 500);

    // Ledger: two rows, one per account leg.
    const now = new Date().toISOString();
    const txType = direction === "to_spot" ? "transfer_to_spot" : "transfer_to_futures";
    const description = direction === "to_spot"
      ? `Transfer to spot account`
      : `Transfer to futures account`;

    const { error: txErr } = await admin.from("transactions").insert([
      {
        user_id: user.id,
        type: txType,
        amount: -amount,
        status: "completed",
        description,
        account: fromKey,
        created_at: now,
      },
      {
        user_id: user.id,
        type: txType,
        amount: amount,
        status: "completed",
        description,
        account: direction === "to_spot" ? "spot" : "futures",
        created_at: now,
      },
    ]);
    if (txErr) {
      // Best-effort rollback
      await admin
        .from("profiles")
        .update({ balance: currentFutures, spot_balance: currentSpot })
        .eq("user_id", user.id);
      return json({ error: txErr.message }, 500);
    }

    return json({
      direction,
      amount,
      balance: nextFutures,
      spot_balance: nextSpot,
    }, 200);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
