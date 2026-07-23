// NOTE (2026-07-21): 'trial' here = Trial Position (voucher-funded demo
// position; Position Voucher / voucher_earnings domain). Unrelated to the
// wallet-level `trial_balance` that was retired in the Trial Bonus sunset.
// Do NOT rename or delete as part of that sunset — the voucher lifecycle
// depends on this endpoint.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Internal server error')

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

type CloseReason = 'USER_CLOSE' | 'MAX_HOLDING' | 'TAIL_CUTOFF' | 'LIQUIDATION' | 'EVENT_RESOLVED'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401)

    const body = (await req.json().catch(() => null)) as
      | { airdropPositionId?: string; reason?: CloseReason }
      | null
    if (!body?.airdropPositionId) {
      return json({ error: 'airdropPositionId is required' }, 400)
    }
    const reason: CloseReason = body.reason ?? 'USER_CLOSE'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    // 1) Load the airdrop position (must belong to the user and be active)
    const { data: pos, error: pErr } = await admin
      .from('airdrop_positions')
      .select('*')
      .eq('id', body.airdropPositionId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) return json({ error: pErr.message }, 500)
    if (!pos) return json({ error: 'Position not found' }, 404)
    if (pos.status !== 'activated') {
      return json({ error: `Position is not active (status=${pos.status})` }, 409)
    }

    // 2) Look up the current mark price (best-effort; fall back to entry price)
    let markPrice = Number(pos.counter_price)
    const { data: voucher } = await admin
      .from('position_vouchers')
      .select('redeemed_option_id, redeemed_side, face_value, redeemable_cap_pct')
      .eq('redeemed_airdrop_position_id', pos.id)
      .maybeSingle()

    if (voucher?.redeemed_option_id) {
      const { data: opt } = await admin
        .from('event_options')
        .select('price')
        .eq('id', voucher.redeemed_option_id)
        .maybeSingle()
      if (opt?.price != null) markPrice = Number(opt.price)
    }

    // 3) Compute PnL using the canonical 5x-leveraged voucher math:
    //    contracts = face_value × leverage / entry_price
    //    long  PnL = (mark − entry) × contracts
    //    short PnL = (entry − mark) × contracts
    const VOUCHER_LEVERAGE = 5
    const entry = Number(pos.counter_price)
    const faceValue = Number(pos.airdrop_value)
    const contracts = faceValue * VOUCHER_LEVERAGE / Math.max(entry, 0.0001)
    const side = String(pos.counter_side)
    const rawPnl = side === 'short' ? (entry - markPrice) * contracts : (markPrice - entry) * contracts

    // 4) Cap profit at redeemable_cap; losses are floored at 0 credit (voucher funds are sandboxed)
    const cap = pos.redeemable_cap != null ? Number(pos.redeemable_cap) : faceValue * 0.5
    const creditedPnl = Math.max(0, Math.min(rawPnl, cap))

    const nowIso = new Date().toISOString()

    // 5) Mark position as settled
    const { error: uErr } = await admin
      .from('airdrop_positions')
      .update({
        status: 'settled',
        settled_pnl: creditedPnl,
        settled_at: nowIso,
        close_reason: reason,
        exit_price: markPrice,
      })
      .eq('id', pos.id)
      .eq('status', 'activated') // optimistic lock
    if (uErr) return json({ error: uErr.message }, 500)

    // 5b) Also flip the matching voucher row to 'settled' so /vouchers reflects state
    const { error: vUpdErr } = await admin
      .from('position_vouchers')
      .update({ status: 'settled' })
      .eq('redeemed_airdrop_position_id', pos.id)
      .eq('user_id', user.id)
    if (vUpdErr) {
      console.error('Failed to mark voucher as settled', vUpdErr)
      return json({ error: `Failed to update voucher: ${vUpdErr.message}` }, 500)
    }

    // 6) Credit voucher_earnings pool (NOT trial_balance / wallet).
    //    Users must hit the 50k USDC trading volume gate and then call
    //    claim-voucher-earnings to move the pool into wallet.balance.
    if (creditedPnl > 0) {
      const { data: pool } = await admin
        .from('voucher_earnings')
        .select('id, pending_amount')
        .eq('user_id', user.id)
        .maybeSingle()

      if (pool) {
        await admin
          .from('voucher_earnings')
          .update({
            pending_amount: Number(pool.pending_amount ?? 0) + creditedPnl,
            last_settled_at: nowIso,
          })
          .eq('id', pool.id)
      } else {
        await admin.from('voucher_earnings').insert({
          user_id: user.id,
          pending_amount: creditedPnl,
          lifetime_credited: 0,
          last_settled_at: nowIso,
        })
      }

      await admin.from('voucher_earnings_ledger').insert({
        user_id: user.id,
        type: 'accrual',
        amount: creditedPnl,
        airdrop_position_id: pos.id,
        description: `Voucher position settled (${reason})`,
      })
    }

    return json({
      success: true,
      airdropPositionId: pos.id,
      exitPrice: markPrice,
      rawPnl,
      creditedPnl,
      cap,
      reason,
    })
  } catch (e) {
    console.error('close-trial-position error', e)
    return json({ error: errMsg(e) }, 500)
  }
})
