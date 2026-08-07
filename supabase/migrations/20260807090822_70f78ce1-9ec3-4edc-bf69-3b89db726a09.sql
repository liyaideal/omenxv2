UPDATE public.campaign_entries
SET branding = jsonb_set(
  branding,
  '{avatar_url}',
  to_jsonb('/__l5e/assets-v1/8095e905-6fff-4308-94be-9a3ee640023e/laowang-avatar.jpg'::text)
)
WHERE branding->>'display_name' = 'Lao Wang';