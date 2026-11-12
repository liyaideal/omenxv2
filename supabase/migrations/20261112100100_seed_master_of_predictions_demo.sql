-- 2026-11-12 · Demo / first real use of the new campaign parts (executed on the Lovable DB the same day).
-- Campaign "Master of Predictions" (Crypto Brunoo, new users through his link) with an English and a
-- Spanish entry that share one ticket ranking, plus an ended campaign "Prediction Sprint" for the frozen state.
--
-- Lovable only: the live campaign starts 2026-11-10 23:00Z so the states can be checked now.
-- Real launch window: 2026-11-15 23:00Z → 2026-11-30 22:59:59Z (16–30 Nov, 23:59 CET).
-- alex_carter (968a2b3a-…) is on the allow list so the demo account can show every state; remove for production.
-- The ranking rows of the 13 demo traders (and alex's 9 tickets in the ended campaign) were inserted straight
-- into campaign_participations / campaign_grants as <task_key>#r<n> rows with status 'claimed'; not replayed here.
-- Prize amounts are deliberately not written anywhere on the page (CPO 2026-11-12).

INSERT INTO public.campaigns (id, name, status, starts_at, ends_at, budget_total) VALUES
  ('b3333333-3333-4333-8333-bbbbbbbbbbb3', 'Master of Predictions', 'live',  '2026-11-10T23:00:00Z', '2026-11-30T22:59:59Z', 2500),
  ('b4444444-4444-4444-8444-bbbbbbbbbbb4', 'Prediction Sprint',     'ended', '2026-10-26T00:00:00Z', '2026-11-02T00:00:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.campaign_entries (id, campaign_id, kind, link_code, seed_base, channel_id, reward, branding, rules) VALUES
('b3333333-3333-4333-8333-bbbbbbbbbb01', 'b3333333-3333-4333-8333-bbbbbbbbbbb3', 'special', 'BRUNOO', 170,
 (SELECT id FROM public.channels WHERE name = 'Crypto Brunoo' LIMIT 1), '{}'::jsonb,
 $j${"display_name":"Crypto Brunoo","accent":"#FF8A3D","blurb":"Win trades, collect tickets, top the ranking.","avatar_url":null,"key_visual_url":null}$j$::jsonb,
 $j${
  "tasks":[{"task_key":"mp_wins","type":"repeatable","metric":"winning_trades","target":1,"min_stake":10,"once_per_market":true,
            "scope":{"any_market":true},"reward":{"ticket":1},
            "name":"Make a profitable trade",
            "subtitle":"Trades of $10 or more count · tickets enter the weekly lucky draw",
            "cta":{"label":"Trade","href":"/events"}}],
  "leaderboard":{"task_key":"mp_wins","top":10,"title":"Ticket ranking · top 10"},
  "eligibility":{"new_users_only":true,"allow_user_ids":["968a2b3a-3913-4acb-948b-c78cc828a125"]},
  "details":{"heading":"Campaign rules","paragraphs":[
    "Open to new users who sign up through Crypto Brunoo's link. The campaign runs from Nov 16 to Nov 30, 2026 (23:59 CET).",
    "Every trade that ends in profit earns 1 ticket, whether the market settles your way or you cash out early with a gain. Your own stake must be $10 or more; Boost does not count toward the $10. Each market counts once, so buying both sides of the same market earns one ticket at most.",
    "Tickets set your place in the ticket ranking on this page, and each ticket is one entry in the weekly lucky draw. Draws are held live on Crypto Brunoo's TikTok. The trader with the most tickets when the campaign ends is the Master of Predictions.",
    "Results are announced on Dec 1 on Crypto Brunoo's TikTok and on this page. Prizes are paid in USDC to the winners' OmenX balance. OmenX may adjust or end the campaign at any time."]}
 }$j$::jsonb),
('b3333333-3333-4333-8333-bbbbbbbbbb02', 'b3333333-3333-4333-8333-bbbbbbbbbbb3', 'special', 'BRUNOO-ES', 170,
 (SELECT id FROM public.channels WHERE name = 'Crypto Brunoo' LIMIT 1), '{}'::jsonb,
 $j${"display_name":"Crypto Brunoo","title":"Maestro de las Predicciones","accent":"#FF8A3D","blurb":"Gana operaciones, suma boletos y lidera la clasificación.","avatar_url":null,"key_visual_url":null}$j$::jsonb,
 $j${
  "tasks":[{"task_key":"mp_wins","type":"repeatable","metric":"winning_trades","target":1,"min_stake":10,"once_per_market":true,
            "scope":{"any_market":true},"reward":{"ticket":1},
            "name":"Haz una operación con ganancias",
            "subtitle":"Cuentan las operaciones de $10 o más · los boletos entran en el sorteo semanal",
            "cta":{"label":"Operar","href":"/events"}}],
  "leaderboard":{"task_key":"mp_wins","top":10,"title":"Clasificación de boletos · top 10"},
  "eligibility":{"new_users_only":true,"allow_user_ids":["968a2b3a-3913-4acb-948b-c78cc828a125"]},
  "details":{"heading":"Reglas de la campaña","paragraphs":[
    "Abierta a nuevos usuarios que se registren con el enlace de Crypto Brunoo. La campaña va del 16 al 30 de noviembre de 2026 (23:59 CET).",
    "Cada operación que termina con ganancias da 1 boleto, tanto si el mercado se resuelve a tu favor como si retiras antes con ganancias. Tu propio importe debe ser de $10 o más; el Boost no cuenta para los $10. Cada mercado cuenta una vez, así que comprar los dos lados del mismo mercado da como máximo un boleto.",
    "Los boletos definen tu puesto en la clasificación de esta página, y cada boleto es una participación en el sorteo semanal. Los sorteos se hacen en directo en el TikTok de Crypto Brunoo. Quien tenga más boletos al terminar la campaña será el Maestro de las Predicciones.",
    "Los resultados se anuncian el 1 de diciembre en el TikTok de Crypto Brunoo y en esta página. Los premios se pagan en USDC al saldo de OmenX de los ganadores. OmenX puede ajustar o terminar la campaña en cualquier momento."]}
 }$j$::jsonb),
('b4444444-4444-4444-8444-bbbbbbbbbb01', 'b4444444-4444-4444-8444-bbbbbbbbbbb4', 'public', NULL, 640, NULL, '{}'::jsonb,
 $j${"display_name":"Prediction Sprint","accent":"#FBBA23","blurb":"A week of winning trades.","avatar_url":null,"key_visual_url":null}$j$::jsonb,
 $j${
  "tasks":[{"task_key":"ps_wins","type":"repeatable","metric":"winning_trades","target":1,"min_stake":10,"once_per_market":true,
            "scope":{"any_market":true},"reward":{"ticket":1},
            "name":"Make a profitable trade",
            "subtitle":"Trades of $10 or more count · tickets set the final ranking",
            "cta":{"label":"Trade","href":"/events"}}],
  "leaderboard":{"task_key":"ps_wins","top":10,"title":"Ticket ranking · top 10"},
  "details":{"heading":"Campaign rules","paragraphs":[
    "Every trade that ends in profit earned 1 ticket. Your own stake had to be $10 or more, and each market counted once.",
    "The ranking on this page is final. OmenX may adjust or end a campaign at any time."]}
 }$j$::jsonb)
ON CONFLICT (id) DO NOTHING;
