import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Network configuration for each token
const NETWORK_CONFIG: Record<string, string> = {
  USDT: "BNB Smart Chain (BEP20)",
  USDC: "BNB Smart Chain (BEP20)",
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  BNB: "BNB Smart Chain (BEP20)",
  MATIC: "Polygon",
  ARB: "Arbitrum One",
  OP: "Optimism",
  AVAX: "Avalanche C-Chain",
  TRX: "Tron (TRC20)",
};

// Generate a deterministic-looking address based on token type
// In production, this would call a custody service API
function generateMockAddress(token: string, userId: string): string {
  const timestamp = Date.now().toString(16);
  const userHash = userId.replace(/-/g, '').slice(0, 8);
  
  // Different address formats based on token/network
  if (token === 'BTC') {
    // Bitcoin address format (starts with bc1 for native segwit)
    return `bc1q${userHash}${timestamp}${Math.random().toString(16).slice(2, 18)}`;
  } else if (token === 'SOL') {
    // Solana address format (base58, ~44 chars)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = '';
    for (let i = 0; i < 44; i++) {
      addr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return addr;
  } else if (token === 'TRX') {
    // Tron address format (starts with T)
    return `T${userHash}${timestamp}${Math.random().toString(16).slice(2, 26)}`.slice(0, 34);
  } else {
    // EVM-compatible address (0x...)
    return `0x${userHash}${timestamp}${Math.random().toString(16).slice(2, 26)}`.slice(0, 42);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { token } = await req.json();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const network = NETWORK_CONFIG[token];
    if (!network) {
      return new Response(
        JSON.stringify({ error: "Unsupported token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate existing addresses for this token
    await supabase
      .from("deposit_addresses")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("token", token)
      .eq("is_active", true);

    // Generate new address
    // In production, this would call a custody service like Fireblocks, BitGo, etc.
    const newAddress = generateMockAddress(token, user.id);

    // Insert new address
    const { data: addressData, error: insertError } = await supabase
      .from("deposit_addresses")
      .insert({
        user_id: user.id,
        token,
        network,
        address: newAddress,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting address:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate address" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        address: addressData.address,
        network: addressData.network,
        token: addressData.token,
      }),
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
