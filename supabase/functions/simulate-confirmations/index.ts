import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting confirmation simulation job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending/processing deposit transactions
    const { data: transactions, error: fetchError } = await supabase
      .from("transactions")
      .select("id, confirmations, required_confirmations, status, network")
      .in("status", ["pending", "processing"])
      .eq("type", "deposit");

    if (fetchError) {
      console.error("Error fetching transactions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${transactions?.length || 0} pending/processing deposits`);

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending transactions to update" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let updatedCount = 0;
    let completedCount = 0;

    for (const tx of transactions) {
      const currentConfirmations = tx.confirmations ?? 0;
      const requiredConfirmations = tx.required_confirmations ?? 15;

      // Simulate confirmation increment (1-3 blocks per cycle based on network)
      let increment = 1;
      if (tx.network?.includes("Solana")) {
        increment = 5; // Solana is faster
      } else if (tx.network?.includes("BSC") || tx.network?.includes("BNB")) {
        increment = 2; // BSC is relatively fast
      } else if (tx.network?.includes("Polygon") || tx.network?.includes("Arbitrum")) {
        increment = 2;
      }

      const newConfirmations = Math.min(currentConfirmations + increment, requiredConfirmations);
      const isComplete = newConfirmations >= requiredConfirmations;

      // Determine new status
      let newStatus = tx.status;
      if (isComplete) {
        newStatus = "completed";
        completedCount++;
      } else if (currentConfirmations === 0 && newConfirmations > 0) {
        newStatus = "processing"; // Move from pending to processing once we have confirmations
      }

      // Update the transaction
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          confirmations: newConfirmations,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tx.id);

      if (updateError) {
        console.error(`Error updating transaction ${tx.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(
          `Updated tx ${tx.id}: ${currentConfirmations} -> ${newConfirmations}/${requiredConfirmations} (${newStatus})`
        );
      }
    }

    console.log(`Confirmation simulation complete. Updated: ${updatedCount}, Completed: ${completedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        updatedTransactions: updatedCount,
        completedTransactions: completedCount,
        totalProcessed: transactions.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in simulate-confirmations function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
