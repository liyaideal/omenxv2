do $$
begin
  if exists (select 1 from cron.job where jobname = 'sim-daily-seed-2105utc') then
    perform cron.unschedule('sim-daily-seed-2105utc');
  end if;
end $$;

select cron.schedule(
  'sim-daily-seed-2105utc',
  '5 21 * * *',
  $cron$
  select net.http_post(
    url := 'https://lbrwdmnctmivgrsgdpqj.supabase.co/functions/v1/sim-daily-seed',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxicndkbW5jdG1pdmdyc2dkcHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjAzMDAsImV4cCI6MjA4MzIzNjMwMH0.RV_BjXITobIJhZa9up2x3aUzmLiVyJbwW46ATHCVcRU'
    ),
    body := jsonb_build_object('trigger', 'cron', 'at', now())
  );
  $cron$
);