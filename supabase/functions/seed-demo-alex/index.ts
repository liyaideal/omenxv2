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

const DEMO_ID = '2faf9a43-1ab7-47b7-919b-978c8c02b5ff'
const DEMO_EMAIL = 'alex.carter@gmail.com'
const DEMO_PASSWORD = 'OmenxDemo2026!'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const steps: Record<string, unknown> = {}

  try {
    const { data: existing } = await admin.auth.admin.getUserById(DEMO_ID)
    if (existing?.user) {
      const { error } = await admin.auth.admin.updateUserById(DEMO_ID, {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { username: 'alex_carter' },
      })
      steps.auth = error ? `update failed: ${error.message}` : 'updated'
    } else {
      const { error } = await admin.auth.admin.createUser({
        id: DEMO_ID,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { username: 'alex_carter' },
      } as Record<string, unknown>)
      steps.auth = error ? `create failed: ${error.message}` : 'created'
    }

    const { data: check } = await admin.auth.admin.getUserById(DEMO_ID)
    if (!check?.user) return json({ error: 'Could not provision demo auth user', steps }, 500)

    await admin.from('profiles').upsert(
      { user_id: DEMO_ID, email: DEMO_EMAIL, username: 'alex_carter' },
      { onConflict: 'user_id' },
    )
    steps.profile = 'aligned'

    const { data: grants } = await admin
      .from('campaign_grants')
      .select('entry_id')
      .eq('user_id', DEMO_ID)
    const entryIds = [...new Set((grants ?? []).map((g) => g.entry_id))]
    for (const entryId of entryIds) {
      const { data: entry } = await admin
        .from('campaign_entries')
        .select('id, campaign_id, kind, link_code')
        .eq('id', entryId)
        .maybeSingle()
      if (!entry) continue
      const { data: part } = await admin
        .from('campaign_participations')
        .select('id')
        .eq('user_id', DEMO_ID)
        .eq('campaign_id', entry.campaign_id)
        .maybeSingle()
      if (part) {
        await admin
          .from('campaign_participations')
          .update({ entry_id: entry.id, locked_at: new Date().toISOString() })
          .eq('id', part.id)
      } else {
        await admin.from('campaign_participations').insert({
          user_id: DEMO_ID,
          campaign_id: entry.campaign_id,
          entry_id: entry.id,
          source: entry.link_code ?? 'seed',
          locked_at: new Date().toISOString(),
        })
      }
    }
    steps.participations = entryIds.length

    let { data: code } = await admin
      .from('referral_codes')
      .select('code')
      .eq('user_id', DEMO_ID)
      .maybeSingle()
    if (!code) {
      const { data: created } = await admin
        .from('referral_codes')
        .insert({ user_id: DEMO_ID, code: 'ALEX26', is_active: true, uses_count: 2 })
        .select('code')
        .maybeSingle()
      code = created
    }

    const day = 86_400_000
    const now = Date.now()
    const demoReferees = [
      {
        referee_id: '11111111-1111-4111-8111-111111111111',
        status: 'pending',
        created_at: new Date(now - 3 * day).toISOString(),
        qualified_at: null,
        metadata: { demo: true, masked_email: 'm***o@gmail.com', volume: 23, target: 100 },
      },
      {
        referee_id: '22222222-2222-4222-8222-222222222222',
        status: 'qualified',
        created_at: new Date(now - 9 * day).toISOString(),
        qualified_at: new Date(now - day).toISOString(),
        metadata: { demo: true, masked_email: 's***a@gmail.com', volume: 140, target: 100 },
      },
    ]

    for (const r of demoReferees) {
      const { data: exists } = await admin
        .from('referrals')
        .select('id')
        .eq('referrer_id', DEMO_ID)
        .eq('referee_id', r.referee_id)
        .maybeSingle()
      const row = {
        referrer_id: DEMO_ID,
        referral_code: code?.code ?? 'ALEX26',
        level: 1,
        ...r,
      }
      if (exists) await admin.from('referrals').update(row).eq('id', exists.id)
      else await admin.from('referrals').insert(row)
    }
    steps.referrals = demoReferees.length

    const { count } = await admin
      .from('campaign_grants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', DEMO_ID)
    steps.grantsVisible = count

    return json({ ok: true, email: DEMO_EMAIL, id: DEMO_ID, steps })
  } catch (e) {
    return json({ error: (e as Error).message, steps }, 500)
  }
})
