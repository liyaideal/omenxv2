-- Demo seed (record only — already executed on Lovable Cloud 2026-09-23 via query_database).
-- First real tiered task: 7 USDC tiers, 2,000 → 200,000, 400 USDC total, appended to the
-- always-on Starter Rewards campaign (entry 690c42ff-a87d-4201-937f-311c8c4432d5) — Liya:
-- no new campaign. alex_carter (968a2b3a-…): $36,000 traded, tiers 1–4 credited.
-- Finals Week (ended) gets the same ladder scoped to sports: $12,400, tiers 1–3 credited.
-- profiles.spot_balance += 80 to stay equal to the 7 bonus transactions.

UPDATE campaign_entries
   SET rules = jsonb_set(rules, '{tasks}', (rules->'tasks') || $j$[{"task_key":"vl_volume_ladder","type":"tiered","name":"Cumulative trading volume","subtitle":"Every filled order on any market counts · rewards paid in USDC","metric":"usd_volume","scope":{"any_market":true},"cta":{"label":"Trade","href":"/events"},"tiers":[{"target":2000,"reward":{"usdc":4}},{"target":5000,"reward":{"usdc":6}},{"target":10000,"reward":{"usdc":10}},{"target":30000,"reward":{"usdc":40}},{"target":50000,"reward":{"usdc":40}},{"target":100000,"reward":{"usdc":100}},{"target":200000,"reward":{"usdc":200}}]}]$j$::jsonb),
       reward = coalesce(reward,'{}'::jsonb) || '{"usdc": 400}'::jsonb
 WHERE id = '690c42ff-a87d-4201-937f-311c8c4432d5';

-- live ladder grants (t1–t4 credited, t5–t7 in progress) + matching wallet rows
INSERT INTO campaign_grants (user_id, entry_id, task_key, progress, status) VALUES
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','vl_volume_ladder#t1','{"value":36000,"current":36000,"target":2000,"credited_usdc":4,"credited_at":"2026-09-17T14:02:11+00:00"}','claimed'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','vl_volume_ladder#t2','{"value":36000,"current":36000,"target":5000,"credited_usdc":6,"credited_at":"2026-09-18T10:40:57+00:00"}','claimed'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','vl_volume_ladder#t3','{"value":36000,"current":36000,"target":10000,"credited_usdc":10,"credited_at":"2026-09-19T16:21:30+00:00"}','claimed'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','vl_volume_ladder#t4','{"value":36000,"current":36000,"target":30000,"credited_usdc":40,"credited_at":"2026-09-22T08:05:44+00:00"}','claimed'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','vl_volume_ladder#t5','{"value":36000,"current":36000,"target":50000}','in_progress'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','vl_volume_ladder#t6','{"value":36000,"current":36000,"target":100000}','in_progress'),
('968a2b3a-3913-4acb-948b-c78cc828a125','690c42ff-a87d-4201-937f-311c8c4432d5','vl_volume_ladder#t7','{"value":36000,"current":36000,"target":200000}','in_progress');
INSERT INTO transactions (user_id, type, amount, account, description, status, created_at) VALUES
('968a2b3a-3913-4acb-948b-c78cc828a125','bonus',4,'spot','Campaign reward · Cumulative trading volume · Tier 1','completed','2026-09-17 14:02:11+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','bonus',6,'spot','Campaign reward · Cumulative trading volume · Tier 2','completed','2026-09-18 10:40:57+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','bonus',10,'spot','Campaign reward · Cumulative trading volume · Tier 3','completed','2026-09-19 16:21:30+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','bonus',40,'spot','Campaign reward · Cumulative trading volume · Tier 4','completed','2026-09-22 08:05:44+00');

-- ended campaign (Finals Week) — same ladder scoped to sports, 3 of 7 credited before it ended
UPDATE campaign_entries
   SET rules = jsonb_set(rules, '{tasks}', (rules->'tasks') || $j$[{"task_key":"fw_volume_ladder","type":"tiered","name":"Finals volume ladder","subtitle":"Every filled order on a Finals market counts · rewards paid in USDC","metric":"usd_volume","scope":{"categories":["sports"]},"tiers":[{"target":2000,"reward":{"usdc":4}},{"target":5000,"reward":{"usdc":6}},{"target":10000,"reward":{"usdc":10}},{"target":30000,"reward":{"usdc":40}},{"target":50000,"reward":{"usdc":40}},{"target":100000,"reward":{"usdc":100}},{"target":200000,"reward":{"usdc":200}}]}]$j$::jsonb),
       reward = '{"usdc": 402, "voucher": 16}'::jsonb
 WHERE id = 'b2222222-2222-4222-8222-bbbbbbbbbbb2';
INSERT INTO campaign_grants (user_id, entry_id, task_key, progress, status) VALUES
('968a2b3a-3913-4acb-948b-c78cc828a125','b2222222-2222-4222-8222-bbbbbbbbbbb2','fw_volume_ladder#t1','{"value":12400,"current":12400,"target":2000,"credited_usdc":4,"credited_at":"2026-06-19T12:00:00+00:00"}','claimed'),
('968a2b3a-3913-4acb-948b-c78cc828a125','b2222222-2222-4222-8222-bbbbbbbbbbb2','fw_volume_ladder#t2','{"value":12400,"current":12400,"target":5000,"credited_usdc":6,"credited_at":"2026-06-21T09:30:00+00:00"}','claimed'),
('968a2b3a-3913-4acb-948b-c78cc828a125','b2222222-2222-4222-8222-bbbbbbbbbbb2','fw_volume_ladder#t3','{"value":12400,"current":12400,"target":10000,"credited_usdc":10,"credited_at":"2026-06-24T18:45:00+00:00"}','claimed'),
('968a2b3a-3913-4acb-948b-c78cc828a125','b2222222-2222-4222-8222-bbbbbbbbbbb2','fw_volume_ladder#t4','{"value":12400,"current":12400,"target":30000}','in_progress'),
('968a2b3a-3913-4acb-948b-c78cc828a125','b2222222-2222-4222-8222-bbbbbbbbbbb2','fw_volume_ladder#t5','{"value":12400,"current":12400,"target":50000}','in_progress'),
('968a2b3a-3913-4acb-948b-c78cc828a125','b2222222-2222-4222-8222-bbbbbbbbbbb2','fw_volume_ladder#t6','{"value":12400,"current":12400,"target":100000}','in_progress'),
('968a2b3a-3913-4acb-948b-c78cc828a125','b2222222-2222-4222-8222-bbbbbbbbbbb2','fw_volume_ladder#t7','{"value":12400,"current":12400,"target":200000}','in_progress');
INSERT INTO transactions (user_id, type, amount, account, description, status, created_at) VALUES
('968a2b3a-3913-4acb-948b-c78cc828a125','bonus',4,'spot','Campaign reward · Finals volume ladder · Tier 1','completed','2026-06-19 12:00:00+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','bonus',6,'spot','Campaign reward · Finals volume ladder · Tier 2','completed','2026-06-21 09:30:00+00'),
('968a2b3a-3913-4acb-948b-c78cc828a125','bonus',10,'spot','Campaign reward · Finals volume ladder · Tier 3','completed','2026-06-24 18:45:00+00');

UPDATE profiles SET spot_balance = coalesce(spot_balance, 0) + 80, updated_at = now()
 WHERE user_id = '968a2b3a-3913-4acb-948b-c78cc828a125';
