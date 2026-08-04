-- Refresh the two in-play demo matches onto the current clock so the
-- "playing now" pinned section has something to render.
UPDATE public.events
SET start_date = now() - interval '63 minutes',
    end_date = now() + interval '35 minutes',
    metadata = metadata || jsonb_build_object('kickoff_at', to_char(now() - interval '63 minutes', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'live', true, 'minute', 63, 'phase', '2nd half')
WHERE id = 'sp-ucl-bay-rma';

UPDATE public.events
SET start_date = now() - interval '28 minutes',
    end_date = now() + interval '70 minutes',
    metadata = metadata || jsonb_build_object('kickoff_at', to_char(now() - interval '28 minutes', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'live', true, 'minute', 28, 'phase', '1st half')
WHERE id = 'sp-csl-shp-sdt';