// sim-daily-seed — DEMO-STATE daily rollover for the Pro spot US-stock line.
//
// Scheduled 21:05 UTC (~17:05 ET, after US cash close). Skips Sat/Sun.
// (US holidays are NOT observed here — DEMO simplification. Production
// runs on the exchange calendar.)
//
// Steps:
//   1) Invoke sim-settle-spot to settle any expired events.
//   2) Seed the next trading day's 10 US-stock daily up/down events
//      (AAPL / NVDA / TSLA / MSFT / AMZN / META / GOOGL / AMD / COIN / HOOD)
//      with:
//        - id: us-{symbol}-updown-{yyyymmdd}
//        - side_labels {yes:"Up", no:"Not Up"}
//        - event_subtype='US_STOCK_DAILY_UPDOWN_SPOT'
//        - product_lines={'spot'}
//        - lifecycle_status='EXTENDED_TRADING'  (T-1 close → open pre-market)
//        - freeze_time = close − 5min (20:15Z − 5min = 19:55Z at 16:00 ET)
//          NOTE: uses 20:00 ET close = 00:00Z (next day). Simplified fixed
//          16:00 ET close → 20:00Z. Early-close days handled by production
//          settlement service, not this seeder.
//        - expected_settlement_time = close + 15min
//        - base_price = previous event's settlement mark (fallback: seed price)
//        - Yes initial 0.45–0.58 (deterministic hash from event_id)
//      Also inserts two event_options (Up / Not Up) and one price_history seed.
//
// Idempotent: ON CONFLICT DO NOTHING for events / options / price rows.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYMBOLS: Array<{ symbol: string; name: string; seed: number; icon: string }> = [
  { symbol: "AAPL", name: "Apple", seed: 231.10, icon: "🍎" },
  { symbol: "NVDA", name: "NVIDIA", seed: 182.45, icon: "🟢" },
  { symbol: "TSLA", name: "Tesla", seed: 268.30, icon: "🚗" },
  { symbol: "MSFT", name: "Microsoft", seed: 445.20, icon: "🪟" },
  { symbol: "AMZN", name: "Amazon", seed: 218.75, icon: "📦" },
  { symbol: "META", name: "Meta", seed: 615.40, icon: "📱" },
  { symbol: "GOOGL", name: "Alphabet", seed: 195.80, icon: "🔎" },
  { symbol: "AMD", name: "AMD", seed: 148.60, icon: "🔴" },
  { symbol: "COIN", name: "Coinbase", seed: 302.15, icon: "🪙" },
  { symbol: "HOOD", name: "Robinhood", seed: 42.30, icon: "🏹" },
];

/** Deterministic 32-bit hash → [0,1). Used to seed Yes initial in a
 *  reproducible way per event_id (no Math.random for values that persist). */
function hash01(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function yyyymmdd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Next weekday (Mon–Fri) after the given UTC date. */
function nextTradingDay(from: Date): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Weekend skip (DEMO: ignores US holidays).
  const today = new Date();
  const dow = today.getUTCDay();
  if (dow === 6 || dow === 0) {
    return new Response(JSON.stringify({ success: true, skipped: "weekend" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const result: {
    settled?: unknown;
    seededDate?: string;
    seededEvents: string[];
    errors: Array<{ step: string; error: string }>;
  } = { seededEvents: [], errors: [] };

  // 1) Settle first.
  try {
    const url = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/sim-settle-spot`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
      },
      body: "{}",
    });
    result.settled = await r.json();
  } catch (e) {
    result.errors.push({ step: "sim-settle-spot", error: String(e) });
  }

  // 2) Seed next trading day's events.
  const target = nextTradingDay(today);
  const dateStr = yyyymmdd(target);
  result.seededDate = dateStr;

  // Cash-close = 20:00Z (16:00 ET, simplified fixed).
  const close = new Date(Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate(),
    20, 0, 0,
  ));
  const freeze = new Date(close.getTime() - 5 * 60_000);
  const settlement = new Date(close.getTime() + 15 * 60_000);
  // Trading window starts at T-1 cash close (previous day 20:00Z).
  const openStart = new Date(close.getTime() - 24 * 3600_000);

  const humanDate = target.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", year: "numeric",
    timeZone: "UTC",
  });

  for (const s of SYMBOLS) {
    const eventId = `us-${s.symbol.toLowerCase()}-updown-${dateStr}`;

    // base_price chain: read the mark of the previous event's WINNING option
    // at settlement (final_price ∈ {0,1} is the discrete outcome; we use the
    // event's stored base_price + a deterministic ±1.2% drift keyed by the
    // winning side, so the chain rolls forward instead of freezing).
    let basePrice = s.seed;
    try {
      const { data: prev } = await supabase
        .from("events")
        .select("id, base_price, winning_option_id")
        .like("id", `us-${s.symbol.toLowerCase()}-updown-%`)
        .eq("lifecycle_status", "SETTLED")
        .order("expected_settlement_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prev?.base_price) {
        const prevBase = Number(prev.base_price);
        // If winning option label ends with the yes label ("Up") → drift up.
        let dir = 0;
        if (prev.winning_option_id) {
          const { data: winOpt } = await supabase
            .from("event_options")
            .select("label")
            .eq("id", prev.winning_option_id)
            .maybeSingle();
          if (winOpt?.label === "Up") dir = 1;
          else if (winOpt?.label === "Not Up") dir = -1;
        }
        const drift = 0.012 * (dir || (hash01(prev.id ?? "") > 0.5 ? 1 : -1));
        basePrice = Number((prevBase * (1 + drift)).toFixed(2));
      }
    } catch (_) { /* fallback keeps seed */ }

    const yes = 0.45 + hash01(eventId) * 0.13;
    const no = 1 - yes;

    const eventRow = {
      id: eventId,
      name: `${s.name} (${s.symbol}) — will close higher today?`,
      icon: s.icon,
      category: "stocks",
      description: `Daily up/down market for ${s.name} (${s.symbol}) on ${humanDate}. Yes settles $1 if today's official close is above the prior close ($${basePrice.toFixed(2)}).`,
      rules:
        `Trading date: ${humanDate}.\n` +
        `Prior close reference: $${basePrice.toFixed(2)}.\n` +
        "Settles YES if the official close is strictly greater than the prior close.\n" +
        "Settles NO otherwise.\n" +
        "All open orders are automatically cancelled and refunded at settlement (~15 minutes after the cash close).",
      start_date: openStart.toISOString(),
      end_date: close.toISOString(),
      volume: "0",
      is_resolved: false,
      side_labels: { yes: "Up", no: "Not Up" },
      product_lines: ["spot"],
      event_subtype: "US_STOCK_DAILY_UPDOWN_SPOT",
      lifecycle_status: "EXTENDED_TRADING",
      base_price: basePrice,
      freeze_time: freeze.toISOString(),
      expected_settlement_time: settlement.toISOString(),
      price_label: `$${basePrice.toFixed(2)}`,
    };

    const { error: upErr } = await supabase
      .from("events")
      .upsert(eventRow, { onConflict: "id", ignoreDuplicates: true });
    if (upErr) {
      result.errors.push({ step: `seed:${eventId}`, error: upErr.message });
      continue;
    }

    const upId = `${eventId}-up`;
    const notId = `${eventId}-not`;
    await supabase.from("event_options").upsert(
      [
        { id: upId, event_id: eventId, label: "Up", price: yes },
        { id: notId, event_id: eventId, label: "Not Up", price: no },
      ],
      { onConflict: "id", ignoreDuplicates: true },
    );

    // Idempotent price_history seed: only insert if no row exists yet for
    // this option (repeat runs must not stack duplicate seed rows).
    const { count: existingHistory } = await supabase
      .from("price_history")
      .select("id", { count: "exact", head: true })
      .eq("option_id", upId);
    if ((existingHistory ?? 0) === 0) {
      await supabase.from("price_history").insert({
        option_id: upId,
        price: yes,
        volume: 0,
      }).select().maybeSingle().then(() => undefined, () => undefined);
    }

    result.seededEvents.push(eventId);
  }


  return new Response(JSON.stringify({ success: true, ...result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
