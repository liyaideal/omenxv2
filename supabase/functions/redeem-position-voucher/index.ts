import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const body = await req.json().catch(() => null) as
      | { voucherId?: string; eventId?: string; optionId?: string; side?: string }
      | null
    if (!body?.voucherId || !body?.eventId || !body?.optionId || !body?.side) {
      return json({ error: 'voucherId, eventId, optionId and side are required' }, 400)
    }
    if (body.side !== 'long' && body.side !== 'short') {
      return json({ error: 'side must be "long" or "short"' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    // 1) Fetch voucher (RLS safe via admin — we constrain by user_id in the query)
    const { data: voucher, error: vErr } = await admin
      .from('position_vouchers')
      .select('*')
      .eq('id', body.voucherId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (vErr) return json({ error: vErr.message }, 500)
    if (!voucher) return json({ error: 'Voucher not found' }, 404)
    if (voucher.status !== 'claimed' && voucher.status !== 'issued') {
      return json({ error: 'Voucher must be claimed before redeeming' }, 409)
    }
    if (new Date(voucher.expires_at).getTime() < Date.now()) {
      return json({ error: 'Voucher has expired' }, 409)
    }

    // 2) Fetch event + option, validate eligibility
    const { data: event } = await admin
      .from('events')
      .select('id, name, is_resolved, end_date, product_lines')
      .eq('id', body.eventId)
      .maybeSingle()
    if (!event) return json({ error: 'Event not found' }, 404)
    if (event.is_resolved) return json({ error: 'Event already resolved' }, 409)
    // Position vouchers are futures-only.
    if (Array.isArray((event as any).product_lines) && (event as any).product_lines.includes('spot')) {
      return json({ error: 'Position vouchers cannot be redeemed on spot markets' }, 409)
    }

    const minMsToEnd = Number(voucher.min_hours_to_settlement) * 3600 * 1000
    if (!event.end_date || new Date(event.end_date).getTime() - Date.now() < minMsToEnd) {
      return json({ error: `Event closes within ${voucher.min_hours_to_settlement}h` }, 409)
    }

    const { data: option } = await admin
      .from('event_options')
      .select('id, label, price, event_id')
      .eq('id', body.optionId)
      .eq('event_id', body.eventId)
      .maybeSingle()
    if (!option) return json({ error: 'Option not found' }, 404)

    const price = Number(option.price)
    // Allow a small slippage tolerance so live price drift between picker render
    // and submit doesn't reject a redemption the UI deemed eligible.
    const BAND_SLIPPAGE = 0.03
    const bandMin = Number(voucher.entry_price_min) - BAND_SLIPPAGE
    const bandMax = Number(voucher.entry_price_max) + BAND_SLIPPAGE
    if (price < bandMin || price > bandMax) {
      return json(
        {
          error: `Price ${price.toFixed(2)} is outside the voucher band ${voucher.entry_price_min}–${voucher.entry_price_max}`,
        },
        409,
      )
    }

    // 3) Create the airdrop position immediately as active
    const faceValue = Number(voucher.face_value)
    const cap = faceValue * Number(voucher.redeemable_cap_pct)
    const nowIso = new Date().toISOString()

    const expiresAt = new Date(Date.now() + Number(voucher.max_holding_hours) * 3600 * 1000).toISOString()

    const { data: airdrop, error: aErr } = await admin
      .from('airdrop_positions')
      .insert({
        user_id: user.id,
        connected_account_id: null,
        source: 'voucher',
        counter_event_name: event.name,
        counter_option_label: option.label,
        counter_side: body.side,
        counter_price: price,
        airdrop_value: faceValue,
        redeemable_cap: cap,
        status: 'activated',
        activated_at: nowIso,
        expires_at: expiresAt,
      } as any)
      .select('id')
      .single()
    if (aErr || !airdrop) return json({ error: aErr?.message ?? 'Failed to create position' }, 500)

    // 4) Optimistically mark voucher redeemed
    const { data: updated, error: uErr } = await admin
      .from('position_vouchers')
      .update({
        status: 'redeemed',
        redeemed_at: nowIso,
        redeemed_airdrop_position_id: airdrop.id,
        redeemed_event_id: body.eventId,
        redeemed_option_id: body.optionId,
        redeemed_side: body.side,
      })
      .eq('id', voucher.id)
      .in('status', ['claimed', 'issued'])
      .select('id')
      .maybeSingle()

    if (uErr || !updated) {
      // Roll back the airdrop position
      await admin.from('airdrop_positions').delete().eq('id', airdrop.id)
      return json({ error: 'Voucher was already redeemed' }, 409)
    }

    return json({
      success: true,
      airdropPositionId: airdrop.id,
      eventId: body.eventId,
    })
  } catch (e) {
    console.error('redeem-position-voucher error', e)
    return json({ error: errMsg(e) }, 500)
  }
})
