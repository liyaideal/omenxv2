-- Notifications center v1 (CPO 2026-10-13, mock v1 M1–M8).
-- Demo engine (🟡 B): message types, params, read rules and retention are the
-- requirement; storage / delivery implementation is the real platform's call.
-- Single write path: public.notify(). Every producer below calls it; the
-- dedupe_key makes every write idempotent (re-running a trigger/cron is a no-op).

-- ---------------------------------------------------------------- table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  category    text NOT NULL CHECK (category IN ('settled','autoclose','trades','funds','rewards','account','system')),
  type        text NOT NULL,
  params      jsonb NOT NULL DEFAULT '{}'::jsonb,
  entity_type text,
  entity_id   uuid,
  deep_link   text,
  dedupe_key  text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedupe_key)
);
COMMENT ON TABLE public.notifications IS
  'In-app notification center (Notifications). category = tab mapping source; type = i18n key (notifications.<type>.title/body); params = i18n interpolation only — never rendered text. Written only through notify(). 90-day retention (purge_notifications cron).';

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx  ON public.notifications (user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications: own rows" ON public.notifications;
CREATE POLICY "notifications: own rows" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- No INSERT / UPDATE / DELETE policies: writes go through SECURITY DEFINER RPCs.

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------- notify()
CREATE OR REPLACE FUNCTION public.notification_category(p_type text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE split_part(p_type, '.', 1)
    WHEN 'settled'   THEN 'settled'
    WHEN 'autoclose' THEN 'autoclose'
    WHEN 'trade'     THEN 'trades'
    WHEN 'funds'     THEN 'funds'
    WHEN 'reward'    THEN 'rewards'
    WHEN 'account'   THEN 'account'
    ELSE 'system' END
$$;

CREATE OR REPLACE FUNCTION public.notify(
  p_user uuid, p_type text, p_params jsonb DEFAULT '{}'::jsonb,
  p_entity_type text DEFAULT NULL, p_entity_id uuid DEFAULT NULL,
  p_deep_link text DEFAULT NULL, p_dedupe text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF p_user IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.notifications (user_id, category, type, params, entity_type, entity_id, deep_link, dedupe_key)
  VALUES (p_user, public.notification_category(p_type), p_type, COALESCE(p_params, '{}'::jsonb),
          p_entity_type, p_entity_id, p_deep_link,
          COALESCE(p_dedupe, p_type || ':' || COALESCE(p_entity_id::text, gen_random_uuid()::text)))
  ON CONFLICT (user_id, dedupe_key) DO NOTHING
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.notify(uuid,text,jsonb,text,uuid,text,text) FROM PUBLIC, anon, authenticated;

-- Client-side producers (demo only 🔴): Boost check tiers are computed in the
-- browser (useRealtimeRiskMetrics) and new sign-ins come from the auth client;
-- the real platform's risk engine / auth service emit these server-side.
CREATE OR REPLACE FUNCTION public.notify_self(p_type text, p_params jsonb DEFAULT '{}'::jsonb, p_dedupe text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF p_type NOT IN ('autoclose.tight','autoclose.soon','account.new_session','account.password_changed') THEN
    RAISE EXCEPTION 'type % is not client-producible', p_type;
  END IF;
  RETURN public.notify(auth.uid(), p_type, p_params, NULL, NULL,
    CASE WHEN p_type LIKE 'autoclose.%' THEN '/portfolio' ELSE '/settings' END, p_dedupe);
END $$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids uuid[] DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  UPDATE public.notifications SET read_at = now()
   WHERE user_id = auth.uid() AND read_at IS NULL
     AND (p_ids IS NULL OR id = ANY (p_ids));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- ---------------------------------------------------------------- producers
-- positions: INSERT → trade.bought ; UPDATE → settled.* / autoclose.done / trade.cashed_out
CREATE OR REPLACE FUNCTION public.notif_position_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event text;
BEGIN
  IF NEW.status <> 'Open' THEN RETURN NEW; END IF;
  SELECT event_id INTO v_event FROM public.event_options WHERE id = NEW.option_id;
  PERFORM public.notify(NEW.user_id, 'trade.bought',
    jsonb_build_object('event_name', NEW.event_name, 'option_label', NEW.option_label, 'side', NEW.side,
                       'margin', NEW.margin, 'leverage', NEW.leverage, 'product_line', NEW.product_line),
    'position', NEW.id,
    CASE WHEN v_event IS NULL THEN '/trade' ELSE '/trade?event=' || v_event END,
    'trade.bought:' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_position_insert ON public.positions;
CREATE TRIGGER notif_position_insert AFTER INSERT ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.notif_position_insert();

-- Statement-level so quick rounds settled in one UPDATE collapse into
-- settled.round_batch (≥3 closes of the same event for one user in one statement).
CREATE OR REPLACE FUNCTION public.notif_position_close() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; g record;
BEGIN
  -- Fast exit: price ticks update every open position but never touch status.
  IF NOT EXISTS (SELECT 1 FROM new_tbl n JOIN old_tbl o ON o.id = n.id
                  WHERE n.status = 'Closed' AND o.status IS DISTINCT FROM 'Closed') THEN
    RETURN NULL;
  END IF;
  CREATE TEMP TABLE IF NOT EXISTS _closed (LIKE public.positions) ON COMMIT DROP;
  TRUNCATE _closed;
  INSERT INTO _closed
    SELECT n.* FROM new_tbl n JOIN old_tbl o ON o.id = n.id
    WHERE n.status = 'Closed' AND o.status IS DISTINCT FROM 'Closed'
      -- a close with no reason and no PnL is a retracted / cancelled bet, not a result
      AND (n.close_reason IS NOT NULL OR COALESCE(n.pnl, 0) <> 0);

  -- batches
  FOR g IN
    SELECT user_id, event_name, count(*) AS n, sum(COALESCE(pnl,0)) AS net, max(closed_at) AS at
      FROM _closed WHERE COALESCE(close_reason,'settlement') = 'settlement'
     GROUP BY user_id, event_name HAVING count(*) >= 3
  LOOP
    PERFORM public.notify(g.user_id, 'settled.round_batch',
      jsonb_build_object('series', g.event_name, 'n', g.n, 'net', g.net),
      NULL, NULL, '/portfolio/settlements',
      'settled.round_batch:' || g.user_id::text || ':' || g.event_name || ':' || to_char(COALESCE(g.at, now()), 'YYYY-MM-DD"T"HH24:MI'));
  END LOOP;

  -- singles
  FOR r IN
    SELECT c.* FROM _closed c
    WHERE NOT (COALESCE(c.close_reason,'settlement') = 'settlement' AND (c.user_id, c.event_name) IN (
      SELECT user_id, event_name FROM _closed WHERE COALESCE(close_reason,'settlement') = 'settlement'
      GROUP BY user_id, event_name HAVING count(*) >= 3))
  LOOP
    PERFORM public.notify(r.user_id,
      CASE COALESCE(r.close_reason, 'settlement')
        WHEN 'cashout'    THEN 'trade.cashed_out'
        WHEN 'auto_close' THEN 'autoclose.done'
        ELSE CASE WHEN COALESCE(r.pnl,0) > 0 THEN 'settled.win' WHEN COALESCE(r.pnl,0) < 0 THEN 'settled.loss' ELSE 'settled.flat' END
      END,
      jsonb_build_object('event_name', r.event_name, 'option_label', r.option_label, 'side', r.side,
                         'pnl', COALESCE(r.pnl,0), 'margin', r.margin, 'leverage', r.leverage, 'product_line', r.product_line),
      'position', r.id, '/portfolio/settlement/' || r.id::text,
      'position.closed:' || r.id::text);
  END LOOP;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS notif_position_close ON public.positions;
CREATE TRIGGER notif_position_close AFTER UPDATE ON public.positions
  REFERENCING OLD TABLE AS old_tbl NEW TABLE AS new_tbl
  FOR EACH STATEMENT EXECUTE FUNCTION public.notif_position_close();

-- transactions: funds.*
CREATE OR REPLACE FUNCTION public.notif_transaction() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type text; v_is_in boolean; v_is_out boolean;
BEGIN
  v_is_in  := NEW.type IN ('deposit','cross_chain_in','fiat_buy');
  v_is_out := NEW.type IN ('withdraw','cross_chain_out','fiat_sell');
  IF TG_OP = 'INSERT' THEN
    IF v_is_out AND NEW.status IN ('pending','processing') THEN v_type := 'funds.withdraw_submitted';
    ELSIF NEW.type = 'bonus' AND NEW.amount > 0 THEN v_type := 'funds.credit';
    ELSIF v_is_in AND NEW.status = 'completed' THEN v_type := 'funds.deposit_done';
    ELSIF v_is_out AND NEW.status = 'completed' THEN v_type := 'funds.withdraw_done';
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'completed' THEN
      v_type := CASE WHEN v_is_in THEN 'funds.deposit_done' WHEN v_is_out THEN 'funds.withdraw_done' END;
    ELSIF NEW.status IN ('failed','rejected') THEN
      v_type := CASE WHEN v_is_in THEN 'funds.deposit_failed' WHEN v_is_out THEN 'funds.withdraw_failed' END;
    END IF;
  END IF;
  IF v_type IS NULL THEN RETURN NEW; END IF;
  PERFORM public.notify(NEW.user_id, v_type,
    jsonb_build_object('amount', abs(NEW.amount), 'account', NEW.account, 'tx_type', NEW.type,
                       'network', NEW.network, 'tx_hash', NEW.tx_hash, 'description', NEW.description),
    'transaction', NEW.id, '/wallet', v_type || ':' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_transaction ON public.transactions;
CREATE TRIGGER notif_transaction AFTER INSERT OR UPDATE OF status ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.notif_transaction();

-- position_vouchers: reward.voucher_issued / reward.voucher_expired
CREATE OR REPLACE FUNCTION public.notif_voucher() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_source text;
BEGIN
  v_source := CASE WHEN NEW.source_entry_id IS NOT NULL THEN 'campaign' ELSE 'referral' END;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(NEW.user_id, 'reward.voucher_issued',
      jsonb_build_object('face_value', NEW.face_value, 'source', v_source, 'expires_at', NEW.expires_at),
      'voucher', NEW.id, '/vouchers', 'reward.voucher_issued:' || NEW.id::text);
  ELSIF NEW.status = 'expired' AND OLD.status IS DISTINCT FROM 'expired' THEN
    PERFORM public.notify(NEW.user_id, 'reward.voucher_expired',
      jsonb_build_object('face_value', NEW.face_value, 'source', v_source),
      'voucher', NEW.id, '/vouchers', 'reward.voucher_expired:' || NEW.id::text);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_voucher ON public.position_vouchers;
CREATE TRIGGER notif_voucher AFTER INSERT OR UPDATE OF status ON public.position_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.notif_voucher();

-- campaign_grants: reward.grant_claimable
CREATE OR REPLACE FUNCTION public.notif_grant() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_campaign uuid; v_name text; v_task jsonb; v_reward jsonb;
BEGIN
  IF NEW.status <> 'claimable' OR OLD.status IS NOT DISTINCT FROM 'claimable' THEN RETURN NEW; END IF;
  SELECT c.id, c.name, t INTO v_campaign, v_name, v_task
    FROM public.campaign_entries e
    JOIN public.campaigns c ON c.id = e.campaign_id
    LEFT JOIN LATERAL jsonb_array_elements(COALESCE(e.rules->'tasks','[]'::jsonb)) t ON t->>'task_key' = NEW.task_key
   WHERE e.id = NEW.entry_id LIMIT 1;
  v_reward := COALESCE(v_task->'reward', '{}'::jsonb);
  PERFORM public.notify(NEW.user_id, 'reward.grant_claimable',
    jsonb_build_object('campaign', v_name, 'task', v_task->>'name',
      'amount', COALESCE((v_reward->>'voucher')::numeric, (v_reward->>'usdc')::numeric, 0),
      'reward_kind', CASE WHEN v_reward ? 'usdc' THEN 'usdc' ELSE 'voucher' END),
    'campaign_grant', NEW.id, '/rewards/campaign/' || COALESCE(v_campaign::text, ''), 'reward.grant_claimable:' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_grant ON public.campaign_grants;
CREATE TRIGGER notif_grant AFTER UPDATE OF status ON public.campaign_grants
  FOR EACH ROW EXECUTE FUNCTION public.notif_grant();

-- user_tasks: reward.task_claimable (rewards are never auto-paid — user must Claim)
CREATE OR REPLACE FUNCTION public.notif_user_task() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_points integer;
BEGIN
  IF NEW.status <> 'completed' OR (TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'completed') THEN RETURN NEW; END IF;
  SELECT name, reward_points INTO v_name, v_points FROM public.tasks WHERE id = NEW.task_id;
  PERFORM public.notify(NEW.user_id, 'reward.task_claimable',
    jsonb_build_object('task', v_name, 'points', v_points),
    'user_task', NEW.id, '/rewards', 'reward.task_claimable:' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_user_task ON public.user_tasks;
CREATE TRIGGER notif_user_task AFTER INSERT OR UPDATE OF status ON public.user_tasks
  FOR EACH ROW EXECUTE FUNCTION public.notif_user_task();

-- referrals: reward.referral_joined (to the referrer)
CREATE OR REPLACE FUNCTION public.notif_referral() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text;
BEGIN
  SELECT username INTO v_name FROM public.profiles WHERE user_id = NEW.referee_id;
  PERFORM public.notify(NEW.referrer_id, 'reward.referral_joined',
    jsonb_build_object('username', COALESCE(v_name, 'A new trader')),
    'referral', NEW.id, '/affiliate', 'reward.referral_joined:' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_referral ON public.referrals;
CREATE TRIGGER notif_referral AFTER INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.notif_referral();

-- airdrop_positions: reward.airdrop_credited (H2E — the surface the 2026-08-25 toast removal left open)
CREATE OR REPLACE FUNCTION public.notif_airdrop() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify(NEW.user_id, 'reward.airdrop_credited',
    jsonb_build_object('event_name', NEW.counter_event_name, 'option_label', NEW.counter_option_label,
                       'side', NEW.counter_side, 'amount', NEW.airdrop_value, 'expires_at', NEW.expires_at),
    'airdrop_position', NEW.id, '/portfolio/airdrops', 'reward.airdrop_credited:' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_airdrop ON public.airdrop_positions;
CREATE TRIGGER notif_airdrop AFTER INSERT ON public.airdrop_positions
  FOR EACH ROW EXECUTE FUNCTION public.notif_airdrop();

-- api_keys: account.api_key_created / account.api_key_revoked
CREATE OR REPLACE FUNCTION public.notif_api_key() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.notify(NEW.user_id, 'account.api_key_created',
      jsonb_build_object('label', NEW.label, 'key_prefix', NEW.key_prefix),
      'api_key', NEW.id, '/settings/api', 'account.api_key_created:' || NEW.id::text);
  ELSIF NEW.status = 'revoked' AND OLD.status IS DISTINCT FROM 'revoked' THEN
    PERFORM public.notify(NEW.user_id, 'account.api_key_revoked',
      jsonb_build_object('label', NEW.label, 'key_prefix', NEW.key_prefix),
      'api_key', NEW.id, '/settings/api', 'account.api_key_revoked:' || NEW.id::text);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_api_key ON public.api_keys;
CREATE TRIGGER notif_api_key AFTER INSERT OR UPDATE OF status ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.notif_api_key();

-- connected_accounts: account.wallet_linked
CREATE OR REPLACE FUNCTION public.notif_connected_account() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify(NEW.user_id, 'account.wallet_linked',
    jsonb_build_object('address', NEW.wallet_address, 'platform', NEW.platform),
    'connected_account', NEW.id, '/rewards/campaign/h2e', 'account.wallet_linked:' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_connected_account ON public.connected_accounts;
CREATE TRIGGER notif_connected_account AFTER INSERT ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.notif_connected_account();

-- recovery_requests: funds.recovery_update
CREATE OR REPLACE FUNCTION public.notif_recovery() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('completed','rejected') OR OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  PERFORM public.notify(NEW.user_id, 'funds.recovery_update',
    jsonb_build_object('status', NEW.status, 'amount', NEW.claimed_amount, 'token', NEW.wrong_token, 'network', NEW.wrong_network),
    'recovery_request', NEW.id, '/wallet/recovery/' || NEW.id::text, 'funds.recovery_update:' || NEW.id::text || ':' || NEW.status);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_recovery ON public.recovery_requests;
CREATE TRIGGER notif_recovery AFTER UPDATE OF status ON public.recovery_requests
  FOR EACH ROW EXECUTE FUNCTION public.notif_recovery();

-- voucher_earnings_ledger: reward.voucher_earnings_unlocked (accrual = a tier credited)
CREATE OR REPLACE FUNCTION public.notif_voucher_earnings() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.type <> 'accrual' OR NEW.amount <= 0 THEN RETURN NEW; END IF;
  PERFORM public.notify(NEW.user_id, 'reward.voucher_earnings_unlocked',
    jsonb_build_object('amount', NEW.amount, 'description', NEW.description),
    'voucher_earnings_ledger', NEW.id, '/vouchers', 'reward.voucher_earnings_unlocked:' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_voucher_earnings ON public.voucher_earnings_ledger;
CREATE TRIGGER notif_voucher_earnings AFTER INSERT ON public.voucher_earnings_ledger
  FOR EACH ROW EXECUTE FUNCTION public.notif_voucher_earnings();

-- treasure_drops: reward.treasure_opened (a drop row is written when the box is opened)
CREATE OR REPLACE FUNCTION public.notif_treasure() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify(NEW.user_id, 'reward.treasure_opened',
    jsonb_build_object('points', NEW.points_dropped, 'tier', NEW.tier),
    'treasure_drop', NEW.id, '/rewards', 'reward.treasure_opened:' || NEW.id::text);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_treasure ON public.treasure_drops;
CREATE TRIGGER notif_treasure AFTER INSERT ON public.treasure_drops
  FOR EACH ROW EXECUTE FUNCTION public.notif_treasure();

-- profiles: account.email_changed / account.2fa_on / account.2fa_off
CREATE OR REPLACE FUNCTION public.notif_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND OLD.email IS NOT NULL AND NEW.email IS NOT NULL THEN
    PERFORM public.notify(NEW.user_id, 'account.email_changed', jsonb_build_object('email', NEW.email),
      'profile', NEW.id, '/settings', 'account.email_changed:' || NEW.user_id::text || ':' || to_char(now(), 'YYYY-MM-DD"T"HH24:MI'));
  END IF;
  IF NEW.totp_enabled IS DISTINCT FROM OLD.totp_enabled THEN
    PERFORM public.notify(NEW.user_id, CASE WHEN NEW.totp_enabled THEN 'account.2fa_on' ELSE 'account.2fa_off' END, '{}'::jsonb,
      'profile', NEW.id, '/settings', 'account.2fa:' || NEW.user_id::text || ':' || to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS'));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notif_profile ON public.profiles;
CREATE TRIGGER notif_profile AFTER UPDATE OF email, totp_enabled ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notif_profile();

-- Applied to Lovable Cloud via query_database 2026-10-13 (trigger smoke test: buy → trade.bought;
-- settle → settled.win; 3 same-event closes in one UPDATE → 1 settled.round_batch + 0 singles;
-- non-status UPDATE → no-op; notify_expiring() twice → 0 / 0). Fixtures deleted after the test.

-- ---------------------------------------------------------------- cron producers
-- Expiry reminders (24h window). Idempotent per entity — safe to run every 30 minutes.
CREATE OR REPLACE FUNCTION public.notify_expiring() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN SELECT * FROM public.position_vouchers
            WHERE status IN ('granted','claimed') AND expires_at BETWEEN now() AND now() + interval '24 hours'
  LOOP
    IF public.notify(r.user_id, 'reward.voucher_expiring',
         jsonb_build_object('face_value', r.face_value, 'expires_at', r.expires_at),
         'voucher', r.id, '/vouchers', 'reward.voucher_expiring:' || r.id::text) IS NOT NULL THEN n := n + 1; END IF;
  END LOOP;
  FOR r IN SELECT * FROM public.airdrop_positions
            WHERE status NOT IN ('settled','expired') AND expires_at BETWEEN now() AND now() + interval '24 hours'
  LOOP
    IF public.notify(r.user_id, 'reward.airdrop_expiring',
         jsonb_build_object('event_name', r.counter_event_name, 'option_label', r.counter_option_label, 'side', r.counter_side, 'expires_at', r.expires_at),
         'airdrop_position', r.id, '/portfolio/airdrops', 'reward.airdrop_expiring:' || r.id::text) IS NOT NULL THEN n := n + 1; END IF;
  END LOOP;
  FOR r IN SELECT g.id, g.user_id, g.task_key, c.id AS campaign_id, c.name AS campaign, c.ends_at, t AS task
             FROM public.campaign_grants g
             JOIN public.campaign_entries e ON e.id = g.entry_id
             JOIN public.campaigns c ON c.id = e.campaign_id
             LEFT JOIN LATERAL jsonb_array_elements(COALESCE(e.rules->'tasks','[]'::jsonb)) t ON t->>'task_key' = g.task_key
            WHERE g.status = 'claimable' AND c.ends_at BETWEEN now() AND now() + interval '24 hours'
  LOOP
    IF public.notify(r.user_id, 'reward.grant_expiring',
         jsonb_build_object('campaign', r.campaign, 'task', r.task->>'name', 'ends_at', r.ends_at,
           'amount', COALESCE((r.task->'reward'->>'voucher')::numeric, (r.task->'reward'->>'usdc')::numeric, 0),
           'reward_kind', CASE WHEN (r.task->'reward') ? 'usdc' THEN 'usdc' ELSE 'voucher' END),
         'campaign_grant', r.id, '/rewards/campaign/' || r.campaign_id::text, 'reward.grant_expiring:' || r.id::text) IS NOT NULL THEN n := n + 1; END IF;
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.purge_notifications() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.notifications WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN ('notify-expiring','purge-notifications');
SELECT cron.schedule('notify-expiring', '*/30 * * * *', $$SELECT public.notify_expiring()$$);
SELECT cron.schedule('purge-notifications', '40 3 * * *', $$SELECT public.purge_notifications()$$);
