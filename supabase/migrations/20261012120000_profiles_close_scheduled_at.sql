-- Settings › Close account (2026-10-12 CPO rules): 7-day grace before deletion.
-- Set when the user confirms; signing in before it cancels (next round); the
-- live platform deletes at this time. Lovable only stores the timestamp.
alter table public.profiles add column if not exists close_scheduled_at timestamptz null;
comment on column public.profiles.close_scheduled_at is
  'Settings › Close account (2026-10-12): when set, the account is scheduled to close at this time (7-day grace; signing in before then cancels). Lovable only stores it; the live platform deletes.';
