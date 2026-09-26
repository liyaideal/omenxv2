-- 2026-09-26 · Referral 分页与活动邀请任务各算各的（Liya 拍板 A）
-- 之前 referrals_campaign_hook() 在好友合格时把该 referral 置 rewarded + metadata.counted_toward，
-- 让每人 $5 券与活动邀请任务只走一条路径。现在两边无关联：好友合格 → Referral 分页照旧 $5 券可领，
-- 同时驱动邀请人所在活动里的 referrals_qualified 任务进度。此函数不再写 referrals 表。
CREATE OR REPLACE FUNCTION public.referrals_campaign_hook() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status <> 'qualified' OR OLD.status = 'qualified' THEN RETURN NEW; END IF;
  PERFORM public.apply_campaign_progress(NEW.referrer_id, NULL, 1, now(), ARRAY['referrals_qualified']);
  RETURN NEW;
END $$;

-- 演示账号 alex_carter：两位曾被标为 counted_toward 的好友恢复为普通合格态（$5 券可领）
SELECT set_config('app.progress_driver','on',true);
UPDATE public.referrals
   SET status = 'qualified', rewarded_at = NULL,
       metadata = metadata - 'counted_toward', updated_at = now()
 WHERE referrer_id = '968a2b3a-3913-4acb-948b-c78cc828a125'
   AND metadata ? 'counted_toward';
SELECT set_config('app.progress_driver','off',true);
