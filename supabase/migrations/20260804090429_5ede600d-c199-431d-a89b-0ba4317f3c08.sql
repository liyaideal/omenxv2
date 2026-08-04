UPDATE public.events
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'editorial', jsonb_build_object(
    'pick', true,
    'rank', 1,
    'note', 'Talks restarted this week and the year-end deadline is hard. Cleanest single read on the whole file right now.',
    'updated_at', to_char(now() - interval '1 hour', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  )
)
WHERE id = 'us-iran-nuclear-deal-2026';

UPDATE public.events
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'editorial', jsonb_build_object(
    'pick', true,
    'rank', 2,
    'note', 'September is the first meeting the desk genuinely disagrees on. Pricing has walked nine cents in a week.',
    'updated_at', to_char(now() - interval '1 hour', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  )
)
WHERE id = 'fed-cut-sep';

UPDATE public.events
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'editorial', jsonb_build_object(
    'pick', true,
    'rank', 3,
    'note', 'Every delay rumour moves this book. Slippage is the base case, so the price is the whole story here.',
    'updated_at', to_char(now() - interval '3 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
  )
)
WHERE id = 'gta6-ships-2026';