-- 2026-09-24 · 常驻网球演示赛事 demo-live-wta 的开赛时间自愈（已在 Lovable Cloud 执行，此文件留档）
-- 比分静态不推进，但列表卡分钟数按 kickoff 现算——不钉住会腐烂成 1560′。每 5 分钟把 kickoff 钉在「118 分钟前」。幂等。
create or replace function public.tick_demo_wta() returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare k timestamptz := now() - interval '118 minutes';
begin
  update public.events
     set start_date = k,
         metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('kickoff_at', to_char(k at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'minute', 118),
         updated_at = now()
   where id = 'demo-live-wta';
  return jsonb_build_object('fixture','demo-live-wta','kickoff_at',k);
end $$;
select cron.schedule('tick_demo_wta', '*/5 * * * *', 'select public.tick_demo_wta();');
