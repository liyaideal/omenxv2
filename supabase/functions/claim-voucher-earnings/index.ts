import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Keep in sync with src/lib/voucherTiers.ts
type Unlock =
  | { kind: 'none' }
  | { kind: 'deposit'; amount: number }
  | { kind: 'volume'; amount: number }
interface Tier { id: 0 | 1 | 2 | 3 | 4; maxClaim: number; unlock: Unlock }
const TIERS: Tier[] = [
  { id: 0, maxClaim: 2,  unlock: { kind: 'none' } },
  { id: 1, maxClaim: 5,  unlock: { kind: 'deposit', amount: 10 } },
  { id: 2, maxClaim: 10, unlock: { kind: 'volume',  amount: 1_000 } },
  { id: 3, maxClaim: 20, unlock: { kind: 'volume',  amount: 10_000 } },
  { id: 4, maxClaim: 50, unlock: { kind: 'volume',  amount: 50_000 } },
]
function meets(u: Unlock, deposit: number, volume: number): boolean {
  if (u.kind === 'none') return true
  if (u.kind === 'deposit') return deposit >= u.amount
  return volume >= u.amount
}
function tierFor(deposit: number, volume: number): Tier | null {
  let current: Tier | null = null
  for (const t of TIERS) if (meets(t.unlock, deposit, volume)) current = t
  return current
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Internal server error')
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: pool } = await admin
      .from('voucher_earnings')
      .select('id, pending_amount, lifetime_credited')
      .eq('user_id', user.id)
      .maybeSingle()

    const pending = Number(pool?.pending_amount ?? 0)
    const lifetimeCredited = Number(pool?.lifetime_credited ?? 0)
    if (!pool || pending <= 0) {
      return json({ error: 'No voucher earnings to claim', pending: 0 }, 400)
    }

    const [{ data: trades, error: tErr }, { data: deposits, error: dErr }] = await Promise.all([
      admin.from('trades').select('amount').eq('user_id', user.id).eq('status', 'Filled'),
      admin.from('transactions').select('amount').eq('user_id', user.id).eq('type', 'deposit').eq('status', 'completed'),
    ])
    if (tErr) return json({ error: tErr.message }, 500)
    if (dErr) return json({ error: dErr.message }, 500)

    const volume = (trades ?? []).reduce(
      (sum, row) => sum + Number((row as { amount: number | string }).amount ?? 0),
      0,
    )
    const depositTotal = (deposits ?? []).reduce(
      (sum, row) => sum + Number((row as { amount: number | string }).amount ?? 0),
      0,
    )

    const tier = tierFor(depositTotal, volume)
    if (!tier) {
      return json({ error: 'No tier unlocked', pending, volume, depositTotal }, 403)
    }

    const cap = tier.maxClaim
    const headroom = Math.max(0, cap - lifetimeCredited)
    const claimAmount = Math.min(pending, headroom)
    if (claimAmount <= 0) {
      return json(
        {
          error: 'Current tier cap already claimed — reach the next tier to claim more',
          pending,
          volume,
          depositTotal,
          tier: tier.id,
          tierCap: tier.maxClaim,
          lifetimeCredited,
        },
        403,
      )
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle()

    const newBalance = Number(profile?.balance ?? 0) + claimAmount

    const { error: upErr } = await admin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('user_id', user.id)
    if (upErr) return json({ error: upErr.message }, 500)

    const nowIso = new Date().toISOString()
    await admin
      .from('voucher_earnings')
      .update({
        pending_amount: Number((pending - claimAmount).toFixed(2)),
        lifetime_credited: Number((lifetimeCredited + claimAmount).toFixed(2)),
        last_settled_at: nowIso,
      })
      .eq('id', pool.id)

    await admin.from('voucher_earnings_ledger').insert({
      user_id: user.id,
      type: 'claim',
      amount: -claimAmount,
      description: `Claimed voucher earnings (tier ${tier.id})`,
    })

    return json({
      success: true,
      claimed: claimAmount,
      newBalance,
      volume,
      depositTotal,
      tier: tier.id,
      tierCap: tier.maxClaim,
    })
  } catch (e) {
    console.error('claim-voucher-earnings error', e)
    return json({ error: errMsg(e) }, 500)
  }
})
