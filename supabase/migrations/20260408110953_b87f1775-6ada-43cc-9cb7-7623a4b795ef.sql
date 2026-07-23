ALTER TABLE public.tasks DROP CONSTRAINT tasks_type_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_type_check CHECK (type = ANY (ARRAY['onboarding', 'referral', 'social', 'retention', 'h2e']));