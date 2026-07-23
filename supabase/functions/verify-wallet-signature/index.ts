import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EIP712_DOMAIN = {
  name: "OmenX",
  version: "1",
  chainId: 1, // Ethereum mainnet
};

const EIP712_TYPES = {
  ConnectAccount: [
    { name: "platform", type: "string" },
    { name: "account", type: "string" },
    { name: "timestamp", type: "uint256" },
    { name: "nonce", type: "string" },
  ],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await req.json();
    const { walletAddress, signature, message, platform } = body;

    if (!walletAddress || !signature || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: walletAddress, signature, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return new Response(
        JSON.stringify({ error: "Invalid wallet address format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate message fields
    if (!message.platform || !message.account || !message.timestamp || !message.nonce) {
      return new Response(
        JSON.stringify({ error: "Invalid message structure" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check timestamp is within 10 minutes
    const now = Math.floor(Date.now() / 1000);
    const msgTimestamp = Number(message.timestamp);
    if (Math.abs(now - msgTimestamp) > 600) {
      return new Response(
        JSON.stringify({ error: "Signature expired. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify EIP-712 signature
    const recoveredAddress = ethers.verifyTypedData(
      EIP712_DOMAIN,
      EIP712_TYPES,
      {
        platform: message.platform,
        account: message.account,
        timestamp: BigInt(message.timestamp),
        nonce: message.nonce,
      },
      signature
    );

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Signature verification failed. The signing address does not match." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store verified account using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`;
    const platformName = platform || "polymarket";

    const { data, error: insertError } = await supabaseAdmin
      .from("connected_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: platformName,
          wallet_address: walletAddress.toLowerCase(),
          display_address: shortAddress,
          signature,
          signed_message: message,
          status: "active",
          verified_at: new Date().toISOString(),
          disconnected_at: null,
        },
        { onConflict: "user_id,platform,wallet_address" }
      )
      .select()
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save connected account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, account: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
