import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Position {
  id: string;
  user_id: string;
  option_id: string | null;
  event_name: string;
  side: string;
  size: number;
  margin: number;
  leverage: number;
  mark_price: number;
  pnl: number;
  funding_accrued: number;
  last_funding_at: string | null;
  created_at: string;
}

interface Option {
  id: string;
  funding_rate: number; // per hour
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional: single-position mode (for close-time top-up)
    let targetPositionId: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.positionId) targetPositionId = String(body.positionId);
      } catch (_) { /* empty body ok */ }
    }

    // 1. Fetch open positions (futures only — spot has no funding by design;
    //    filtering here instead of relying on funding_rate=0 heuristic).
    let query = supabase
      .from("positions")
      .select("id, user_id, option_id, event_name, side, size, margin, leverage, mark_price, pnl, funding_accrued, last_funding_at, created_at")
      .eq("status", "Open")
      .eq("product_line", "futures");
    if (targetPositionId) query = query.eq("id", targetPositionId);

    const { data: positions, error: posErr } = await query;
    if (posErr) throw posErr;
    if (!positions || positions.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch funding rates for involved options
    const optionIds = Array.from(new Set(positions.map(p => p.option_id).filter(Boolean))) as string[];
    const optionRateMap = new Map<string, number>();
    if (optionIds.length > 0) {
      const { data: opts, error: optErr } = await supabase
        .from("event_options")
        .select("id, funding_rate")
        .in("id", optionIds);
      if (optErr) throw optErr;
      for (const o of (opts as Option[]) || []) {
        optionRateMap.set(o.id, Number(o.funding_rate) || 0);
      }
    }

    const now = new Date();
    const ledgerRows: Array<Record<string, unknown>> = [];
    let processed = 0;

    // 3. Per-position accrual
    for (const p of positions as Position[]) {
      const lastAt = new Date(p.last_funding_at ?? p.created_at);
      const hoursElapsed = (now.getTime() - lastAt.getTime()) / 3_600_000;
      if (hoursElapsed <= 0) continue;

      const ratePerHour = p.option_id ? (optionRateMap.get(p.option_id) ?? 0) : 0;
      // Skip zero-rate positions entirely — no ledger noise, no useless updates.
      if (ratePerHour === 0) continue;

      // Notional = size * mark (size already represents contracts; leverage only governs margin).
      const mark = Number(p.mark_price) || 0.5;
      const notional = Number(p.size) * mark;

      // Long pays positive funding, Short receives it.
      const sideSign = String(p.side).toLowerCase() === "long" ? 1 : -1;
      const amount = sideSign * ratePerHour * notional * hoursElapsed;
      // Round to 6 decimals to keep things stable
      const amountR = Math.round(amount * 1e6) / 1e6;

      // After rounding the accrual might collapse to 0 (tiny notional × tiny rate × short interval).
      // Skip those too — we'll catch them next cycle once enough has accrued.
      if (amountR === 0) continue;

      const newAccrued = Number(p.funding_accrued) + amountR;
      const newPnl = Number(p.pnl) - amountR; // Net PnL = price PnL - funding

      const { error: upErr } = await supabase
        .from("positions")
        .update({
          funding_accrued: newAccrued,
          last_funding_at: now.toISOString(),
          pnl: newPnl,
        })
        .eq("id", p.id);
      if (upErr) {
        console.error("position update failed", p.id, upErr);
        continue;
      }

      ledgerRows.push({
        user_id: p.user_id,
        position_id: p.id,
        option_id: p.option_id,
        event_name: p.event_name,
        applied_rate: ratePerHour,
        notional,
        amount: amountR,
        accrual_start: lastAt.toISOString(),
        accrual_end: now.toISOString(),
      });
      processed++;
    }

    if (ledgerRows.length > 0) {
      const { error: ledErr } = await supabase
        .from("position_funding_ledger")
        .insert(ledgerRows);
      if (ledErr) console.error("ledger insert failed", ledErr);
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("accrue-funding error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
