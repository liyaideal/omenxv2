import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default custody addresses (fallback for users without generated addresses)
const DEFAULT_CUSTODY_ADDRESSES: Record<string, string> = {
  USDT: "0x742d35Cc6634C0532925a3b844Bc9e7595f5aB31",
  USDC: "0x742d35Cc6634C0532925a3b844Bc9e7595f5aB31",
  BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ETH: "0x742d35Cc6634C0532925a3b844Bc9e7595f5aB31",
  SOL: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  BNB: "0x742d35Cc6634C0532925a3b844Bc9e7595f5aB31",
  MATIC: "0x742d35Cc6634C0532925a3b844Bc9e7595f5aB31",
  ARB: "0x742d35Cc6634C0532925a3b844Bc9e7595f5aB31",
  OP: "0x742d35Cc6634C0532925a3b844Bc9e7595f5aB31",
  AVAX: "0x742d35Cc6634C0532925a3b844Bc9e7595f5aB31",
  TRX: "TN2Y7RmKMXbC8qkZ2XK8PxJqK8NTJ6Vfhn",
};

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

    // Get token from request body or query params
    let token: string | null = null;
    
    // Try query params first (for GET requests)
    const url = new URL(req.url);
    token = url.searchParams.get("token");
    
    // If not in query params, try request body (for POST requests)
    if (!token && req.method === "POST") {
      try {
        const body = await req.json();
        token = body.token;
      } catch {
        // Body might be empty or invalid JSON
      }
    }
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active address for this token
    const { data: addressData, error: fetchError } = await supabase
      .from("deposit_addresses")
      .select("*")
      .eq("user_id", user.id)
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching address:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch address" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no user-specific address, return default custody address
    if (!addressData) {
      const defaultAddress = DEFAULT_CUSTODY_ADDRESSES[token];
      if (!defaultAddress) {
        return new Response(
          JSON.stringify({ error: "Unsupported token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          address: defaultAddress,
          token,
          isDefault: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        address: addressData.address,
        network: addressData.network,
        token: addressData.token,
        isDefault: false,
        createdAt: addressData.created_at,
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
