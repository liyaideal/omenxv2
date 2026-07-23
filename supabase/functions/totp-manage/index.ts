import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Manages TOTP secret in the server-only user_security table.
// Actions: 'enable' (requires secret), 'disable'.

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
    const action = body?.action;
    const admin = createClient(supabaseUrl, serviceKey);

    if (action === "enable") {
      const secret = body?.secret;
      if (typeof secret !== "string" || secret.length < 16 || secret.length > 256) {
        return new Response(JSON.stringify({ error: "Invalid secret" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: upErr } = await admin
        .from("user_security")
        .upsert({ user_id: user.id, totp_secret: secret }, { onConflict: "user_id" });
      if (upErr) throw upErr;

      const { error: profErr } = await admin
        .from("profiles")
        .update({ totp_enabled: true })
        .eq("user_id", user.id);
      if (profErr) throw profErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disable") {
      const { error: delErr } = await admin
        .from("user_security")
        .delete()
        .eq("user_id", user.id);
      if (delErr) throw delErr;

      const { error: profErr } = await admin
        .from("profiles")
        .update({ totp_enabled: false })
        .eq("user_id", user.id);
      if (profErr) throw profErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
