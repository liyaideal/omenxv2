import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Internal server error'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { taskId } = await req.json()
    if (!taskId || typeof taskId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'taskId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate user
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get task details
    const { data: task, error: taskError } = await adminClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('is_active', true)
      .single()

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check existing user task
    const { data: existingUserTask } = await adminClient
      .from('user_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .maybeSingle()

    if (existingUserTask?.status === 'claimed') {
      return new Response(
        JSON.stringify({ error: 'Reward already claimed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Server-side task completion verification
    const triggerAction = (task.trigger_condition as Record<string, unknown>)?.action as string
    let isCompleted = false

    switch (triggerAction) {
      case 'register':
        isCompleted = true
        break
      case 'view_event':
        isCompleted = true
        break
      case 'first_trade': {
        const { data: trades } = await adminClient
          .from('trades')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
        isCompleted = (trades?.length || 0) > 0
        break
      }
      case 'referral_qualified': {
        const { data: referrals } = await adminClient
          .from('referrals')
          .select('id')
          .eq('referrer_id', user.id)
          .eq('status', 'qualified')
          .limit(1)
        isCompleted = (referrals?.length || 0) > 0
        break
      }
      case 'share_x':
        isCompleted = existingUserTask?.status === 'completed'
        break
      default:
        isCompleted = existingUserTask?.status === 'completed'
    }

    if (!isCompleted && !existingUserTask) {
      return new Response(
        JSON.stringify({ error: 'Task not completed yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or update user task to claimed
    const now = new Date().toISOString()
    if (!existingUserTask) {
      const { error: createError } = await adminClient
        .from('user_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          status: 'claimed',
          completed_at: now,
          claimed_at: now,
          points_awarded: task.reward_points,
        })
      if (createError) throw createError
    } else {
      const { error: updateError } = await adminClient
        .from('user_tasks')
        .update({
          status: 'claimed',
          claimed_at: now,
          points_awarded: task.reward_points,
        })
        .eq('id', existingUserTask.id)
      if (updateError) throw updateError
    }

    // Get or create points account
    let { data: pointsAccount } = await adminClient
      .from('points_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!pointsAccount) {
      const { data: newAccount, error: createError } = await adminClient
        .from('points_accounts')
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single()
      if (createError) throw createError
      pointsAccount = newAccount
    }

    // Update points balance
    const newBalance = (pointsAccount?.balance || 0) + task.reward_points
    const { error: pointsError } = await adminClient
      .from('points_accounts')
      .update({
        balance: newBalance,
        lifetime_earned: (pointsAccount?.lifetime_earned || 0) + task.reward_points
      })
      .eq('user_id', user.id)

    if (pointsError) throw pointsError

    // Add ledger entry (using admin client to bypass admin-only policy)
    const { error: ledgerError } = await adminClient
      .from('points_ledger')
      .insert({
        user_id: user.id,
        amount: task.reward_points,
        balance_after: newBalance,
        type: 'earn',
        source: 'task',
        source_id: taskId,
        description: `Completed task: ${task.name}`
      })

    if (ledgerError) {
      console.error('Ledger error:', ledgerError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        task: { name: task.name, reward_points: task.reward_points },
        pointsEarned: task.reward_points,
        newBalance,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Claim task error:', error)
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
