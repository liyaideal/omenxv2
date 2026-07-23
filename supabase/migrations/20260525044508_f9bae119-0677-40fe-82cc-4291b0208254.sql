-- Add side_labels column to events for single-market binary events (e.g. sports: Team A vs Team B)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS side_labels jsonb;

-- Seed several single-market binary events with custom side labels
-- Soccer derby
INSERT INTO public.events (id, name, icon, category, description, rules, source_name, source_url, settlement_description, start_date, end_date, volume, side_labels)
VALUES
  ('shanghai-derby-2026', 'Shanghai Derby: Shenhua vs Shandong Luneng?', '⚽', 'sports',
   'Predict the winner of the Shanghai Derby between Shanghai Shenhua and Shandong Luneng. Draw resolves to neither side.',
   E'Match kicks off at 18:00 local time\nDraw or postponement resolves both sides at 0.5\nSettlement uses official CSL result',
   'Chinese Super League', 'https://www.thecsl.com/',
   'Resolves based on the official CSL match result. A draw or cancellation refunds the market.',
   now(), now() + interval '3 days', '$420K',
   '{"yes":"Shanghai Shenhua","no":"Shandong Luneng"}'::jsonb),

  ('ufc-316-headline', 'UFC 316 Headliner: Pereira vs Ankalaev?', '🥊', 'sports',
   'Pick the winner of the UFC 316 main event between Alex Pereira and Magomed Ankalaev.',
   E'Five-round championship bout\nDraw or no contest refunds the market\nSettlement based on official UFC scorecard',
   'UFC', 'https://www.ufc.com/event/ufc-316',
   'Resolves on the official UFC result for the headline bout. Draws and no-contests refund.',
   now(), now() + interval '10 days', '$1.2M',
   '{"yes":"Alex Pereira","no":"Magomed Ankalaev"}'::jsonb),

  ('nba-finals-2026-g7', 'NBA Finals 2026 Game 7: Celtics vs Thunder?', '🏀', 'sports',
   'Will the Boston Celtics or Oklahoma City Thunder win a hypothetical Game 7 of the 2026 NBA Finals?',
   E'Only resolves if Game 7 occurs\nIf the series ends in fewer than 7 games this market voids\nWinner of Game 7 settles the market',
   'NBA', 'https://www.nba.com/playoffs',
   'Resolves based on the official NBA box score of Game 7. Voids if no Game 7 is played.',
   now(), now() + interval '21 days', '$680K',
   '{"yes":"Boston Celtics","no":"Oklahoma City Thunder"}'::jsonb),

  ('wimbledon-2026-final', 'Wimbledon 2026 Men''s Final: Alcaraz vs Sinner?', '🎾', 'sports',
   'Pick the winner of a projected Wimbledon 2026 men''s final between Carlos Alcaraz and Jannik Sinner.',
   E'Resolves only if both players reach the final\nIf either player does not reach the final the market voids\nBest-of-five final settles the market',
   'Wimbledon', 'https://www.wimbledon.com/',
   'Resolves on the official Wimbledon final result. Voids if matchup does not occur.',
   now(), now() + interval '45 days', '$340K',
   '{"yes":"Carlos Alcaraz","no":"Jannik Sinner"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  side_labels = EXCLUDED.side_labels,
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Seed Yes/No options for each (labels stay "Yes"/"No"; sideLabels drives UI aliases)
INSERT INTO public.event_options (id, event_id, label, price) VALUES
  ('shanghai-derby-2026-yes', 'shanghai-derby-2026', 'Yes', 0.58),
  ('shanghai-derby-2026-no',  'shanghai-derby-2026', 'No',  0.42),
  ('ufc-316-headline-yes', 'ufc-316-headline', 'Yes', 0.47),
  ('ufc-316-headline-no',  'ufc-316-headline', 'No',  0.53),
  ('nba-finals-2026-g7-yes', 'nba-finals-2026-g7', 'Yes', 0.51),
  ('nba-finals-2026-g7-no',  'nba-finals-2026-g7', 'No',  0.49),
  ('wimbledon-2026-final-yes', 'wimbledon-2026-final', 'Yes', 0.44),
  ('wimbledon-2026-final-no',  'wimbledon-2026-final', 'No',  0.56)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, price = EXCLUDED.price;