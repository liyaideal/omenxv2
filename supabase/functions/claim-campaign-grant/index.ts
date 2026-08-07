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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401)

    const body = (await req.json().catch(() => null)) as
      | { entryId?: string; taskKey?: string }
      | null
    if (!body?.entryId || !body?.taskKey) return json({ error: 'entryId and taskKey are required' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: entry, error: eErr } = await admin
      .from('campaign_entries')
      .select('id, campaign_id, rules')
      .eq('id', body.entryId)
      .maybeSingle()
    if (eErr) return json({ error: eErr.message }, 500)
    if (!entry) return json({ error: 'Entry not found' }, 404)

    const rules = (entry.rules ?? {}) as Record<string, unknown>
    const tasks = Array.isArray(rules.tasks) ? (rules.tasks as Array<Record<string, unknown>>) : []
    const task = tasks.find((t) => t.task_key === body.taskKey)
    if (!task) return json({ error: 'Task not found on this entry' }, 404)

    const reward = (task.reward ?? {}) as { voucher?: number; usdc?: number }
    const faceValue = Number(reward.voucher ?? 0)
    if (!faceValue) return json({ error: 'This task has no voucher reward to claim' }, 400)

    const { data: grant, error: gErr } = await admin
      .from('campaign_grants')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_id', entry.id)
      .eq('task_key', body.taskKey)
      .maybeSingle()
    if (gErr) return json({ error: gErr.message }, 500)
    if (!grant) return json({ error: 'Nothing to claim yet' }, 409)
    if (grant.status === 'claimed') return json({ success: true, alreadyClaimed: true })
    if (grant.status !== 'claimable') return json({ error: 'Task is not claimable' }, 409)

    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
    const { data: voucher, error: vErr } = await admin
      .from('position_vouchers')
      .insert({
        user_id: user.id,
        code,
        face_value: faceValue,
        status: 'granted',
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + VOUCHER_EXPIRY_DAYS * 86_400_000).toISOString(),
        source_entry_id: entry.id,
      })
      .select()
      .single()
    if (vErr) return json({ error: vErr.message }, 500)

    await admin.from('campaign_grants').update({ status: 'claimed' }).eq('id', grant.id)

    // First reward locks the attribution for this campaign.
    await admin
      .from('campaign_participations')
      .update({ locked_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('campaign_id', entry.campaign_id)
      .is('locked_at', null)

    return json({ success: true, voucher })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Internal server error' }, 500)
  }
})
