-- TEMPORARY probe: verifies that migrations pushed to GitHub get applied by Lovable Cloud.
-- Harmless and reversible (a schema comment). Will be reverted once the check is done.
comment on schema public is 'gh-sync-probe 2026-09-11';
