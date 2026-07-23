import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const CLAIM_WINDOW_HOURS = 7 * 24

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

    const body = await req.json().catch(() => null) as { voucherId?: string } | null
    if (!body?.voucherId) return json({ error: 'voucherId is required' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: voucher, error: vErr } = await admin
      .from('position_vouchers')
      .select('*')
      .eq('id', body.voucherId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (vErr) return json({ error: vErr.message }, 500)
    if (!voucher) return json({ error: 'Voucher not found' }, 404)

    // Idempotent: already claimed => return current state
    if (voucher.status === 'claimed') {
      return json({ success: true, voucher })
    }
    if (voucher.status !== 'granted') {
      return json({ error: 'Voucher cannot be claimed' }, 409)
    }
    if (new Date(voucher.expires_at).getTime() < Date.now()) {
      return json({ error: 'Voucher grant has expired' }, 409)
    }

    const claimedAt = new Date()
    const newExpiry = new Date(claimedAt.getTime() + CLAIM_WINDOW_HOURS * 3600 * 1000)

    const { data: updated, error: upErr } = await admin
      .from('position_vouchers')
      .update({
        status: 'claimed',
        claimed_at: claimedAt.toISOString(),
        expires_at: newExpiry.toISOString(),
      })
      .eq('id', voucher.id)
      .select('*')
      .maybeSingle()
    if (upErr) return json({ error: upErr.message }, 500)

    return json({ success: true, voucher: updated })
  } catch (e) {
    console.error('claim-position-voucher error', e)
    return json({ error: errMsg(e) }, 500)
  }
})
