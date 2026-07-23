import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Random walk price simulation with mean reversion
function simulatePriceChange(currentPrice: number, volatility: number = 0.02): number {
  const randomChange = (Math.random() - 0.5) * 2 * volatility;
  const meanReversionStrength = 0.01;
  const meanReversion = (0.5 - currentPrice) * meanReversionStrength;
  let newPrice = currentPrice + randomChange + meanReversion;
  newPrice = Math.max(0.01, Math.min(0.99, newPrice));
  return Math.round(newPrice * 100) / 100;
}

function adjustBinaryPrices(yesPrice: number): { yes: number; no: number } {
  const yes = Math.round(yesPrice * 100) / 100;
  const no = Math.round((1 - yes) * 100) / 100;
  return { yes, no };
}

function normalizeMultiOptionPrices(prices: number[]): number[] {
  const sum = prices.reduce((a, b) => a + b, 0);
  return prices.map(p => Math.round((p / sum) * 100) / 100);
}

interface OptionRow {
  id: string;
  event_id: string;
  label: string;
  price: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting batched price update job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Single SELECT: get all options for active events via join filter
    const { data: activeEvents, error: eventsError } = await supabase
      .from("events")
      .select("id")
      .eq("is_resolved", false);

    if (eventsError) throw eventsError;
    if (!activeEvents || activeEvents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active events" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const activeEventIds = activeEvents.map(e => e.id);

    const { data: allOptions, error: optionsError } = await supabase
      .from("event_options")
      .select("id, event_id, label, price")
      .in("event_id", activeEventIds);

    if (optionsError) throw optionsError;
    if (!allOptions || allOptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No options found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Group by event and compute new prices in memory
    const optionsByEvent = new Map<string, OptionRow[]>();
    for (const opt of allOptions as OptionRow[]) {
      const arr = optionsByEvent.get(opt.event_id) ?? [];
      arr.push(opt);
      optionsByEvent.set(opt.event_id, arr);
    }

    const now = new Date().toISOString();
    const upsertRows: Array<{
      id: string;
      event_id: string;
      label: string;
      price: number;
      updated_at: string;
    }> = [];
    const historyRows: Array<{
      event_id: string;
      option_id: string;
      price: number;
      recorded_at: string;
    }> = [];

    for (const [eventId, options] of optionsByEvent.entries()) {
      const isBinary =
        options.length === 2 &&
        options.some(o => o.label.toLowerCase() === "yes") &&
        options.some(o => o.label.toLowerCase() === "no");

      let newPrices: { id: string; price: number }[] = [];

      if (isBinary) {
        const yesOption = options.find(o => o.label.toLowerCase() === "yes")!;
        const noOption = options.find(o => o.label.toLowerCase() === "no")!;
        const newYesPrice = simulatePriceChange(Number(yesOption.price), 0.03);
        const { yes, no } = adjustBinaryPrices(newYesPrice);
        newPrices = [
          { id: yesOption.id, price: yes },
          { id: noOption.id, price: no },
        ];
      } else {
        const simulated = options.map(o => simulatePriceChange(Number(o.price), 0.02));
        const normalized = normalizeMultiOptionPrices(simulated);
        newPrices = options.map((o, i) => ({ id: o.id, price: normalized[i] }));
      }

      for (const { id, price } of newPrices) {
        const original = options.find(o => o.id === id)!;
        upsertRows.push({
          id,
          event_id: eventId,
          label: original.label,
          price,
          updated_at: now,
        });
        historyRows.push({
          event_id: eventId,
          option_id: id,
          price,
          recorded_at: now,
        });
      }
    }

    // 3. Single UPSERT for all event_options
    const { error: upsertError } = await supabase
      .from("event_options")
      .upsert(upsertRows, { onConflict: "id" });

    if (upsertError) {
      console.error("Bulk upsert error:", upsertError);
      throw upsertError;
    }

    // 4. Single bulk INSERT for price_history
    const { error: historyError } = await supabase
      .from("price_history")
      .insert(historyRows);

    if (historyError) {
      console.error("Bulk history insert error:", historyError);
      throw historyError;
    }

    // 5. Refresh funding rates for options whose next_funding_at has passed
    const { data: dueOpts } = await supabase
      .from("event_options")
      .select("id")
      .in("event_id", activeEventIds)
      .or(`next_funding_at.is.null,next_funding_at.lte.${now}`);

    if (dueOpts && dueOpts.length > 0) {
      const nextAt = new Date(Date.now() + 3600_000).toISOString();
      const fundingRows = dueOpts.map((o: { id: string }) => ({
        id: o.id,
        funding_rate: Math.round(((Math.random() - 0.5) * 0.0004) * 1e6) / 1e6,
        next_funding_at: nextAt,
      }));
      // Use upsert preserving other columns via id conflict
      await supabase.from("event_options").upsert(fundingRows, { onConflict: "id" });
    }

    console.log(
      `Batched update complete. Events: ${optionsByEvent.size}, Options updated: ${upsertRows.length}, History rows: ${historyRows.length}, Funding refreshed: ${dueOpts?.length ?? 0}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: optionsByEvent.size,
        updatedOptions: upsertRows.length,
        historyRecordsInserted: historyRows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in update-prices function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
