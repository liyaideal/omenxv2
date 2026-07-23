import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_PASSWORD = "OmenxDemo!2026";

const DEMO_USERS = {
  matched: {
    email: "demo.matched@omenx.dev",
    username: "matched_demo",
  },
  welcome: {
    email: "demo.welcome@omenx.dev",
    username: "welcome_demo",
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scenario } = await req.json();
    const config = DEMO_USERS[scenario as keyof typeof DEMO_USERS];
    if (!config) {
      return new Response(JSON.stringify({ error: "Invalid scenario" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Check existing
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email === config.email);

    if (!existing) {
      const { error } = await admin.auth.admin.createUser({
        email: config.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { username: config.username },
      });
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ email: config.email, password: DEMO_PASSWORD }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
