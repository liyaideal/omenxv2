INSERT INTO public.tasks (id, name, description, icon, type, trigger_condition, reward_points, max_completions, sort_order, is_active)
VALUES (
  gen_random_uuid(),
  'Join Our Community',
  'Join our Discord community to connect with other traders and get support',
  'message-circle',
  'social',
  '{"action": "join_discord"}'::jsonb,
  50,
  1,
  5,
  true
);