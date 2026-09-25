-- Demo roller for alex_carter's recurring task (executed on Lovable Cloud 2026-09-26 via query_database).
-- The 2026-09-25 seed anchored the daily_trade calendar to fixed dates, so one day later "today" was
-- already a missed day and the streak was gone (演示数据即产品面：会腐烂的数据要么接滚动引擎). This
-- function rewrites alex's daily_trade grants + matching wallet rows relative to current_date every
-- night (pg_cron 00:02 UTC): 12 credited days in the last 14, misses at D-11 (in_progress $18) and
-- D-6 (not started), today in progress at $32 → 🔥 5-day streak. spot_balance is untouched (12 credits
-- before and after). Demo-only: hard-coded to the alex user + Starter Rewards entry.
CREATE OR REPLACE FUNCTION public.roll_demo_campaign_daily()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  u uuid := '968a2b3a-3913-4acb-948b-c78cc828a125';
  e uuid := '690c42ff-a87d-4201-937f-311c8c4432d5';
  d0 date := current_date;
  vals int[] := ARRAY[58,72,51,18,90,64,55,120,0,77,53,61,88,50,32]; -- D-14 … D0
  i int; d date; v int; st text;
BEGIN
  DELETE FROM campaign_grants WHERE user_id = u AND entry_id = e AND task_key LIKE 'daily_trade@%';
  DELETE FROM transactions WHERE user_id = u AND type = 'bonus' AND description LIKE 'Campaign reward · Trade every day · %';
  FOR i IN 1..15 LOOP
    d := d0 - (15 - i); v := vals[i];
    st := CASE WHEN i = 15 THEN 'in_progress' WHEN v >= 50 THEN 'claimed' WHEN v = 0 THEN 'not_started' ELSE 'in_progress' END;
    INSERT INTO campaign_grants (user_id, entry_id, task_key, progress, status, created_at, updated_at)
    VALUES (u, e, 'daily_trade@' || d,
      CASE WHEN st = 'claimed'
        THEN jsonb_build_object('value', v, 'current', v, 'target', 50, 'credited_usdc', 1, 'credited_at', (d || 'T15:00:00+00:00'))
        ELSE jsonb_build_object('value', v, 'current', v, 'target', 50) END,
      st, (d || ' 09:00:00+00')::timestamptz, (d || ' 15:00:00+00')::timestamptz);
    IF st = 'claimed' THEN
      INSERT INTO transactions (user_id, type, amount, account, description, status, created_at)
      VALUES (u, 'bonus', 1, 'spot', 'Campaign reward · Trade every day · ' || d, 'completed', (d || ' 15:00:00+00')::timestamptz);
    END IF;
  END LOOP;
END $$;

SELECT cron.schedule('roll-demo-campaign-daily', '2 0 * * *', $$SELECT public.roll_demo_campaign_daily()$$);
SELECT public.roll_demo_campaign_daily();
