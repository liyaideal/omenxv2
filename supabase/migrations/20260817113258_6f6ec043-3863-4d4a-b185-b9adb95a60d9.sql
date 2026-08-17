UPDATE public.positions
SET user_id = '968a2b3a-3913-4acb-948b-c78cc828a125', updated_at = now()
WHERE user_id = '2faf9a43-1ab7-47b7-919b-978c8c02b5ff'
  AND event_name IN (SELECT name FROM public.events WHERE metadata->>'market_type' IN ('handicap','total'));