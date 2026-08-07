import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const VOUCHER_EXPIRY_DAYS = 30
const REFERRAL_VOUCHER_VALUE = 5

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401)

    const body = (await req.json().catch(() => null)) as { referralId?: string } | null
    if (!body?.referralId) return json({ error: 'referralId is required' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: referral, error: rErr } = await admin
      .from('referrals')
      .select('*')
      .eq('id', body.referralId)
      .eq('referrer_id', user.id)
      .maybeSingle()
    if (rErr) return json({ error: rErr.message }, 500)
    if (!referral) return json({ error: 'Referral not found' }, 404)
    if (referral.status === 'rewarded') return json({ success: true, alreadyClaimed: true })
    if (referral.status !== 'qualified') return json({ error: 'This friend has not qualified yet' }, 409)

    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
    const { data: voucher, error: vErr } = await admin
      .from('position_vouchers')
      .insert({
        user_id: user.id,
        code,
        face_value: REFERRAL_VOUCHER_VALUE,
        status: 'granted',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + VOUCHER_EXPIRY_DAYS * 86_400_000).toISOString(),
      })
      .select()
      .single()
    if (vErr) return json({ error: vErr.message }, 500)

    await admin
      .from('referrals')
      .update({
        status: 'rewarded',
        rewarded_at: new Date().toISOString(),
        metadata: { ...((referral.metadata as Record<string, unknown>) ?? {}), reward_source: 'referral', voucher_code: code },
      })
      .eq('id', referral.id)

    return json({ success: true, voucher })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Internal server error' }, 500)
  }
})
