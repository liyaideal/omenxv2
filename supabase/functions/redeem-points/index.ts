import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "Internal server error";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Mainnet launch: points redemption is paused. Server-side hard stop.
  // Prior implementation credited profiles.trial_balance on success; that path
  // has been removed as part of the 2026-07-21 Trial Bonus sunset. Points
  // redemption will be redesigned before this endpoint is re-enabled.
  return new Response(
    JSON.stringify({
      error: "Points redemption is paused for mainnet launch. Please check back soon.",
    }),
    {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
