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
  // CPO 2026-11-02: a fresh funded account for James's walkthrough (Alex had used up his daily vouchers)
  james: {
    email: "demo.james@omenx.dev",
    username: "james",
  },
} as const;

/** set once when the account is first created: the identity the app shows (as the chooser shows it — no
    demo / test wording on product surfaces) and the money it starts with (recorded as deposits) */
const FIRST_RUN: Partial<Record<keyof typeof DEMO_USERS, { email: string; avatar: string; spot: number; futures: number }>> = {
  james: {
    email: "james.omenx@gmail.com",
    avatar: "https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=james&backgroundColor=c0aede",
    spot: 10000,
    futures: 10000,
  },
};

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
      const { data: created, error } = await admin.auth.admin.createUser({
        email: config.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { username: config.username },
      });
      if (error) throw error;
      // handle_new_user has just made the profile at $0 / $0: set the shown identity, fund it once (Lite surface) with matching deposit rows
      const funds = FIRST_RUN[scenario as keyof typeof DEMO_USERS];
      const uid = created?.user?.id;
      if (funds && uid) {
        const { error: pErr } = await admin
          .from("profiles")
          .update({ email: funds.email, avatar_url: funds.avatar, spot_balance: funds.spot, balance: funds.futures, preferred_surface: "lite" })
          .eq("user_id", uid);
        if (pErr) throw pErr;
        const { error: tErr } = await admin.from("transactions").insert([
          { user_id: uid, type: "deposit", account: "spot", amount: funds.spot, description: "USDC deposit from Base", network: "Base", status: "completed" },
          { user_id: uid, type: "deposit", account: "futures", amount: funds.futures, description: "USDC deposit from Base", network: "Base", status: "completed" },
        ]);
        if (tErr) throw tErr;
      }
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
