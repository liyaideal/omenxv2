import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEMO_ID = '2faf9a43-1ab7-47b7-919b-978c8c02b5ff'

// Rollback-only: removes the password auth user that must never have existed.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const steps: Record<string, unknown> = {}
  const { data: existing } = await admin.auth.admin.getUserById(DEMO_ID)
  if (existing?.user) {
    const { error } = await admin.auth.admin.deleteUser(DEMO_ID)
    steps.auth = error ? `delete failed: ${error.message}` : 'deleted'
  } else {
    steps.auth = 'absent'
  }
  const after = await admin.auth.admin.getUserById(DEMO_ID)
  steps.remaining = after.data?.user ? 'STILL PRESENT' : 'none'
  return new Response(JSON.stringify(steps), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
