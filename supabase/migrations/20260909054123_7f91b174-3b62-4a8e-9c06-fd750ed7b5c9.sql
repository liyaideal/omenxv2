DO $mig$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO d
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='roll_demo_positions';
  d := replace(d, 'round(v_margin * v_lev * 0.001, 4)', 'round(v_margin * v_lev * 0.0015, 4)');
  EXECUTE d;
END
$mig$;

INSERT INTO public.transactions (user_id, type, account, status, amount, description, created_at)
SELECT p.user_id, 'fee', 'futures', 'completed',
       -round(p.margin * p.leverage * 0.0015, 4),
       'Trading fee · ' || p.option_label || ' · ' || p.event_name,
       p.created_at
FROM public.positions p
JOIN public.profiles pr ON pr.user_id = p.user_id
WHERE pr.username = 'alex_carter' AND p.status = 'Open' AND p.product_line = 'futures'
ORDER BY p.created_at DESC
LIMIT 3;