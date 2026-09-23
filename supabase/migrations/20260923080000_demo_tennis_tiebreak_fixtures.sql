-- 2026-09-23 · 网球抢七常驻演示赛事（已在 Lovable Cloud 经 query_database 执行，此文件仅留档）
-- demo-live-wta  : 永远处在「直播中 · 第三盘抢七进行中」，S2 由抢七决出（7⁷ / 6²）。静态，不由 tick 引擎推进（无 family 字段，end_date 2126）。
-- demo-final-wta : 已结算 2–1（S1 与决胜盘都是抢七）。end_date 置 2126 是为了躲开 roll_sports_matches() 的「已结束即重排」。
-- 数据契约：metadata.segment_results[i].tb = {home, away}；metadata.score 为供应商串，展示层经 tennisScore formatter。
insert into public.events (id, name, category, event_subtype, description, start_date, end_date, expected_settlement_time, lifecycle_status, is_resolved, product_lines, side_labels, icon, volume, metadata)
values
('demo-live-wta', 'Tatiana Prozorova vs Sofia Costoulas', 'sports', 'SPORTS_MATCH', 'WTA · Tatiana Prozorova vs Sofia Costoulas. Winning shares pay $1, losing shares pay $0.',
 now() - interval '118 minutes', '2126-09-23 00:00:00+00', '2126-09-23 00:00:00+00', 'TRADING', false, array['contract'], '{"yes":"Prozorova","no":"Costoulas"}'::jsonb, '', 214630,
 jsonb_build_object(
   'sport','tennis','league','WTA','format','h2h',
   'home','Tatiana Prozorova','away','Sofia Costoulas','home_abbr','PRO','away_abbr','COS',
   'kickoff_at', to_char(now() - interval '118 minutes','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
   'live', true, 'minute', 118, 'phase','3rd set',
   'score','5-7, 7-6(7-2), 6-6',
   'segment_index', 3,
   'segment_results', jsonb_build_array(
      jsonb_build_object('home',5,'away',7),
      jsonb_build_object('home',7,'away',6,'tb',jsonb_build_object('home',7,'away',2)),
      jsonb_build_object('home',6,'away',6,'tb',jsonb_build_object('home',5,'away',3))
   ),
   'server','Costoulas','game_points','0–0',
   'market_type','winner'
 )),
('demo-final-wta', 'Tamara Zidansek vs Kimberly Birrell', 'sports', 'SPORTS_MATCH', 'WTA · Tamara Zidansek vs Kimberly Birrell. Winning shares pay $1, losing shares pay $0.',
 now() - interval '26 hours', '2126-09-23 00:00:00+00', '2126-09-23 00:00:00+00', 'SETTLED', true, array['contract'], '{"yes":"Zidansek","no":"Birrell"}'::jsonb, '', 98420,
 jsonb_build_object(
   'sport','tennis','league','WTA','format','h2h',
   'home','Tamara Zidansek','away','Kimberly Birrell','home_abbr','ZID','away_abbr','BIR',
   'kickoff_at', to_char(now() - interval '26 hours','YYYY-MM-DD"T"HH24:MI:SS"Z"'),
   'live', false, 'minute', null, 'phase', null,
   'score','6-7(2-7), 6-3, 7-6(10-8)',
   'segment_index', 3,
   'segment_results', jsonb_build_array(
      jsonb_build_object('home',6,'away',7,'tb',jsonb_build_object('home',2,'away',7)),
      jsonb_build_object('home',6,'away',3),
      jsonb_build_object('home',7,'away',6,'tb',jsonb_build_object('home',10,'away',8))
   ),
   'market_type','winner'
 ))
on conflict (id) do nothing;
insert into public.event_options (id, event_id, label, price, is_winner, final_price) values
('demo-live-wta-o1','demo-live-wta','Prozorova',0.53,false,null),
('demo-live-wta-o2','demo-live-wta','Costoulas',0.47,false,null),
('demo-final-wta-o1','demo-final-wta','Zidansek',1,true,1),
('demo-final-wta-o2','demo-final-wta','Birrell',0,false,0)
on conflict (id) do nothing;
update public.events set winning_option_id='demo-final-wta-o1', settled_at = now() - interval '23 hours' where id='demo-final-wta';
