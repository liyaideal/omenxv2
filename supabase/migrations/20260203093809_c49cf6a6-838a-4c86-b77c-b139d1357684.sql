-- =============================================
-- POINTS & INCENTIVE SYSTEM DATABASE SCHEMA
-- =============================================

-- 1. Add trial_balance to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_balance NUMERIC DEFAULT 0;

-- 2. Points system configuration table (configurable parameters)
CREATE TABLE public.points_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.points_config (key, value, description) VALUES
  ('exchange_rate', '{"points_per_cent": 10}', 'Points required per $0.01 trial balance (10:1 ratio)'),
  ('min_redeem_threshold', '{"points": 100}', 'Minimum points required to redeem'),
  ('trial_balance_expiry', '{"type": "never"}', 'Trial balance expiry policy'),
  ('points_expiry', '{"type": "annual", "date": "12-31"}', 'Points expire on December 31st annually');

-- 3. Points accounts table (user balance tracking)
CREATE TABLE public.points_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  frozen INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Points ledger table (transaction history with audit trail)
CREATE TABLE public.points_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'freeze', 'unfreeze', 'expire', 'revoke', 'adjust')),
  source TEXT NOT NULL CHECK (source IN ('task', 'referral', 'redeem', 'admin', 'system', 'social')),
  source_id TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tasks configuration table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  type TEXT NOT NULL CHECK (type IN ('onboarding', 'referral', 'social', 'retention')),
  trigger_condition JSONB NOT NULL,
  reward_points INTEGER NOT NULL,
  max_completions INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default MVP tasks
INSERT INTO public.tasks (name, description, icon, type, trigger_condition, reward_points, sort_order) VALUES
  ('Complete Registration', 'Create your account to get started', '✅', 'onboarding', '{"action": "register"}', 50, 1),
  ('First Event View', 'Browse your first prediction event', '👀', 'onboarding', '{"action": "view_event", "count": 1}', 20, 2),
  ('First Trade', 'Place your first prediction trade', '🎯', 'onboarding', '{"action": "first_trade"}', 100, 3),
  ('Invite a Friend', 'Invite friends and earn when they trade', '👥', 'referral', '{"action": "referral_qualified"}', 200, 4),
  ('Share on X', 'Share our platform on X (Twitter)', '🐦', 'social', '{"action": "share_x"}', 30, 5);

-- 6. User tasks progress table
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'claimed')),
  progress JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  points_awarded INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- 7. Referrals table (supports multi-level)
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referee_id UUID NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded')),
  qualified_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE,
  points_awarded INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. User referral codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  uses_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Budget limits table
CREATE TABLE public.budget_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  category TEXT NOT NULL CHECK (category IN ('points_issue', 'points_redeem', 'trial_issue')),
  limit_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Points redemption history table
CREATE TABLE public.points_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points_spent INTEGER NOT NULL,
  trial_balance_received NUMERIC NOT NULL,
  exchange_rate JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_redemptions ENABLE ROW LEVEL SECURITY;

-- Points config: publicly readable, admin writable
CREATE POLICY "Points config is publicly readable" ON public.points_config FOR SELECT USING (true);
CREATE POLICY "Only admins can modify points config" ON public.points_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Points accounts: users can view their own
CREATE POLICY "Users can view their own points account" ON public.points_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert points accounts" ON public.points_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update points accounts" ON public.points_accounts FOR UPDATE USING (auth.uid() = user_id);

-- Points ledger: users can view their own history
CREATE POLICY "Users can view their own points history" ON public.points_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert points ledger entries" ON public.points_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks: publicly readable
CREATE POLICY "Tasks are publicly readable" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Only admins can manage tasks" ON public.tasks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- User tasks: users can view and manage their own
CREATE POLICY "Users can view their own task progress" ON public.user_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own task progress" ON public.user_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own task progress" ON public.user_tasks FOR UPDATE USING (auth.uid() = user_id);

-- Referrals: users can view their own (as referrer or referee)
CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referee_id);
CREATE POLICY "System can update referrals" ON public.referrals FOR UPDATE USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Referral codes: users can manage their own
CREATE POLICY "Users can view their referral codes" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their referral codes" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their referral codes" ON public.referral_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can lookup referral codes" ON public.referral_codes FOR SELECT USING (true);

-- Budget limits: only admins
CREATE POLICY "Only admins can view budget limits" ON public.budget_limits FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can manage budget limits" ON public.budget_limits FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Points redemptions: users can view their own
CREATE POLICY "Users can view their redemptions" ON public.points_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create redemptions" ON public.points_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE
-- =============================================

CREATE TRIGGER update_points_config_updated_at
BEFORE UPDATE ON public.points_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_points_accounts_updated_at
BEFORE UPDATE ON public.points_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at
BEFORE UPDATE ON public.user_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_codes_updated_at
BEFORE UPDATE ON public.referral_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_limits_updated_at
BEFORE UPDATE ON public.budget_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();