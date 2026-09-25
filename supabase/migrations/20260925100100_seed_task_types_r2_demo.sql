-- Demo seed (record only — executed on Lovable Cloud 2026-09-25 via query_database).
-- Starter Rewards (entry 690c42ff…) gets four more tasks: daily_trade (recurring),
-- invite_ladder (tiered × referrals_qualified), active_7d (active_days), hold_24h (hold_positions).
-- alex_carter: 12 daily credits (9-11…9-24, misses 9-14 / 9-19), today $32 in progress;
-- two friends counted toward the campaign (invite tier 1 credited); active_7d / hold_24h were
-- credited by the real driver from alex's own trades (30 active days / 19 held positions).
-- Finals Week (ended) gets fw_daily with 3 credited days. profiles.spot_balance += 20 (+5 +15 by the driver).

UPDATE campaign_entries
   SET rules = jsonb_set(rules, '{tasks}', (rules->'tasks') || $j$[
 {"task_key":"daily_trade","type":"recurring","period":"daily","name":"Trade every day","subtitle":"$50 in filled orders each day","metric":"usd_volume","target":50,"scope":{"any_market":true},"reward":{"usdc":1},"max_periods":30,"streak_bonus":{"every":7,"reward":{"usdc":5}},"cta":{"label":"Trade","href":"/events"}},
 {"task_key":"invite_ladder","type":"tiered","name":"Invite friends who trade","subtitle":"Each friend counts once they trade $100","metric":"referrals_qualified","tiers":[{"target":1,"reward":{"usdc":5}},{"target":3,"reward":{"usdc":15}},{"target":10,"reward":{"usdc":50}}],"cta":{"label":"Invite","href":"/rewards?tab=referral"}},
 {"task_key":"active_7d","type":"threshold","name":"Trade on 7 different days","subtitle":"Any market · at least $10 a day","metric":"active_days","min_notional":10,"target":7,"scope":{"any_market":true},"reward":{"usdc":5},"cta":{"label":"Trade","href":"/events"}},
 {"task_key":"hold_24h","type":"threshold","name":"Hold a position for 24 hours","subtitle":"3 positions of $50+ held a full day","metric":"hold_positions","hold":{"min_hours":24,"min_notional":50},"target":3,"scope":{"any_market":true},"reward":{"usdc":15},"cta":{"label":"Trade","href":"/events"}}
]$j$::jsonb),
       reward = coalesce(reward,'{}'::jsonb) || '{"usdc": 525}'::jsonb
 WHERE id='690c42ff-a87d-4201-937f-311c8c4432d5';

SELECT set_config('app.progress_driver','on',true);
INSERT INTO referrals (referrer_id, referee_id, referral_code, level, status, qualified_at, rewarded_at, metadata, created_at) VALUES
('968a2b3a-3913-4acb-948b-c78cc828a125','33333333-3333-4333-8333-333333333333','ALEX24',1,'rewarded','2026-09-20 11:12:00+00','2026-09-20 11:12:00+00',
 '{"demo":true,"masked_email":"j***n@gmail.com","target":100,"volume":132,"counted_toward":{"campaign_id":"19033848-dc98-4a53-b4c5-d9e31b24a51f","campaign_name":"Starter Rewards"}}','2026-09-18 09:00:00+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','44444444-4444-4444-8444-444444444444','ALEX24',1,'rewarded','2026-09-23 16:40:00+00','2026-09-23 16:40:00+00',
 '{"demo":true,"masked_email":"l***e@proton.me","target":100,"volume":205,"counted_toward":{"campaign_id":"19033848-dc98-4a53-b4c5-d9e31b24a51f","campaign_name":"Starter Rewards"}}','2026-09-21 14:30:00+00');

INSERT INTO campaign_grants (user_id, entry_id, task_key, progress, status, created_at, updated_at) VALUES
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','invite_ladder#t1','{"value":2,"current":2,"target":1,"credited_usdc":5,"credited_at":"2026-09-20T11:12:00+00:00"}','claimed','2026-09-20 11:12:00+00','2026-09-23 16:40:00+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','invite_ladder#t2','{"value":2,"current":2,"target":3}','in_progress','2026-09-20 11:12:00+00','2026-09-23 16:40:00+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','invite_ladder#t3','{"value":2,"current":2,"target":10}','in_progress','2026-09-20 11:12:00+00','2026-09-23 16:40:00+00');
INSERT INTO campaign_grants (user_id, entry_id, task_key, progress, status, created_at, updated_at)
SELECT '968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','daily_trade@'||d,
       jsonb_build_object('value',v,'current',v,'target',50,'credited_usdc',1,'credited_at',(d||'T15:00:00+00:00')),
       'claimed', (d||' 09:00:00+00')::timestamptz, (d||' 15:00:00+00')::timestamptz
FROM (VALUES ('2026-09-11',58),('2026-09-12',72),('2026-09-13',51),('2026-09-15',90),('2026-09-16',64),('2026-09-17',55),('2026-09-18',120),('2026-09-20',77),('2026-09-21',53),('2026-09-22',61),('2026-09-23',88),('2026-09-24',50)) AS t(d,v);
INSERT INTO campaign_grants (user_id, entry_id, task_key, progress, status, created_at, updated_at) VALUES
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','daily_trade@2026-09-14','{"value":18,"current":18,"target":50}','in_progress','2026-09-14 09:00:00+00','2026-09-14 20:00:00+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','daily_trade@2026-09-19','{"value":0,"current":0,"target":50}','not_started','2026-09-19 09:00:00+00','2026-09-19 09:00:00+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','daily_trade@2026-09-25','{"value":32,"current":32,"target":50}','in_progress','2026-09-25 03:00:00+00','2026-09-25 06:10:00+00');
INSERT INTO transactions (user_id, type, amount, account, description, status, created_at)
SELECT '968a2b3a-3913-4acb-948b-c78cc828a125','bonus',1,'spot','Campaign reward · Trade every day · '||d,'completed',(d||' 15:00:00+00')::timestamptz
FROM (VALUES ('2026-09-11'),('2026-09-12'),('2026-09-13'),('2026-09-15'),('2026-09-16'),('2026-09-17'),('2026-09-18'),('2026-09-20'),('2026-09-21'),('2026-09-22'),('2026-09-23'),('2026-09-24')) AS t(d);
INSERT INTO transactions (user_id, type, amount, account, description, status, created_at) VALUES
('968a2b3a-3913-4acb-948b-c78cc828a125','bonus',5,'spot','Campaign reward · Invite friends who trade · Tier 1','completed','2026-09-20 11:12:00+00');

UPDATE campaign_entries SET rules = jsonb_set(rules,'{tasks}',(rules->'tasks') || $j$[{"task_key":"fw_daily","type":"recurring","period":"daily","name":"Trade every Finals day","subtitle":"$50 on Finals markets each day","metric":"usd_volume","target":50,"scope":{"categories":["sports"]},"reward":{"usdc":1},"max_periods":7,"streak_bonus":{"every":7,"reward":{"usdc":5}}}]$j$::jsonb),
  reward = coalesce(reward,'{}'::jsonb) || '{"usdc": 414}'::jsonb
 WHERE id='b2222222-2222-4222-8222-bbbbbbbbbbb2';
INSERT INTO campaign_grants (user_id, entry_id, task_key, progress, status, created_at, updated_at)
SELECT '968a2b3a-3913-4acb-948b-c78cc828a125','b2222222-2222-4222-8222-bbbbbbbbbbb2','fw_daily@'||d,
       jsonb_build_object('value',v,'current',v,'target',50,'credited_usdc',1,'credited_at',(d||'T18:00:00+00:00')),'claimed',(d||' 10:00:00+00')::timestamptz,(d||' 18:00:00+00')::timestamptz
FROM (VALUES ('2026-06-19',80),('2026-06-21',66),('2026-06-24',52)) AS t(d,v);
INSERT INTO transactions (user_id, type, amount, account, description, status, created_at)
SELECT '968a2b3a-3913-4acb-948b-c78cc828a125','bonus',1,'spot','Campaign reward · Trade every Finals day · '||d,'completed',(d||' 18:00:00+00')::timestamptz
FROM (VALUES ('2026-06-19'),('2026-06-21'),('2026-06-24')) AS t(d);
UPDATE profiles SET spot_balance = coalesce(spot_balance,0) + 20, updated_at=now() WHERE user_id='968a2b3a-3913-4acb-948b-c78cc828a125';
-- active_7d / hold_24h: driven by alex's real trades
SELECT public.apply_campaign_progress('968a2b3a-3913-4acb-948b-c78cc828a125', NULL, 0, now(), ARRAY['active_days','hold_positions']);
