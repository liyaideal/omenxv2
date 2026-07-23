import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Probability distribution:
// 10% -> 300-350 points (low tier)
// 80% -> 800-850 points (mid tier)
// 10% -> 1000-1100 points (high tier)
function determineTargetPoints(): { tier: string; targetPoints: number } {
  const random = Math.random()
  
  if (random < 0.10) {
    // 10% chance: low tier (300-350)
    const targetPoints = Math.floor(Math.random() * (350 - 300 + 1)) + 300
    return { tier: 'low', targetPoints }
  } else if (random < 0.90) {
    // 80% chance: mid tier (800-850)
    const targetPoints = Math.floor(Math.random() * (850 - 800 + 1)) + 800
    return { tier: 'mid', targetPoints }
  } else {
    // 10% chance: high tier (1000-1100)
    const targetPoints = Math.floor(Math.random() * (1100 - 1000 + 1)) + 1000
    return { tier: 'high', targetPoints }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // User client to get the authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    // Admin client for operations that bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing treasure claim for user: ${user.id}`)

    // Check if user already claimed treasure
    const { data: existingDrop, error: checkError } = await adminClient
      .from('treasure_drops')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError) {
      console.error('Check error:', checkError)
      throw new Error('Failed to check existing treasure drop')
    }

    if (existingDrop) {
      return new Response(
        JSON.stringify({ 
          error: 'Already claimed',
          alreadyClaimed: true,
          drop: existingDrop
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's current points balance
    const { data: pointsAccount, error: accountError } = await adminClient
      .from('points_accounts')
      .select('balance, lifetime_earned')
      .eq('user_id', user.id)
      .single()

    if (accountError) {
      console.error('Account error:', accountError)
      throw new Error('Failed to get points account')
    }

    // Verify eligibility: lifetime_earned >= 100
    if (pointsAccount.lifetime_earned < 100) {
      return new Response(
        JSON.stringify({ 
          error: 'Not eligible',
          message: 'Lifetime earned points must be at least 100',
          currentLifetimeEarned: pointsAccount.lifetime_earned
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currentBalance = pointsAccount.balance

    // Determine target points based on probability
    const { tier, targetPoints } = determineTargetPoints()
    
    // Calculate points to drop (target - current, minimum 0)
    const pointsToDrop = Math.max(0, targetPoints - currentBalance)

    console.log(`User ${user.id}: current=${currentBalance}, target=${targetPoints}, dropping=${pointsToDrop}, tier=${tier}`)

    // Insert treasure drop record
    const { data: dropRecord, error: dropError } = await adminClient
      .from('treasure_drops')
      .insert({
        user_id: user.id,
        tier,
        target_points: targetPoints,
        points_dropped: pointsToDrop
      })
      .select()
      .single()

    if (dropError) {
      console.error('Drop insert error:', dropError)
      throw new Error('Failed to record treasure drop')
    }

    // Only add points if there's something to add
    if (pointsToDrop > 0) {
      // Update points account
      const newBalance = currentBalance + pointsToDrop
      const { error: updateError } = await adminClient
        .from('points_accounts')
        .update({
          balance: newBalance,
          lifetime_earned: pointsAccount.lifetime_earned + pointsToDrop,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        throw new Error('Failed to update points balance')
      }

      // Add ledger entry
      const { error: ledgerError } = await adminClient
        .from('points_ledger')
        .insert({
          user_id: user.id,
          amount: pointsToDrop,
          balance_after: newBalance,
          type: 'earn',
          source: 'system',
          source_id: dropRecord.id,
          description: `🎁 Treasure Drop! Received ${pointsToDrop} bonus points`,
          metadata: { tier, targetPoints }
        })

      if (ledgerError) {
        console.error('Ledger error:', ledgerError)
        // Non-fatal, continue
      }
    }

    console.log(`Treasure claimed successfully for user ${user.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        pointsDropped: pointsToDrop,
        targetPoints,
        tier,
        newBalance: currentBalance + pointsToDrop
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Treasure claim error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
