// TEMPORARY probe — verifies that Edge Functions pushed to GitHub get deployed by Lovable Cloud.
// Will be removed once the check is done. No auth, no DB access, no side effects.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ ok: true, probe: "gh-sync-2026-09-11", at: new Date().toISOString() }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
