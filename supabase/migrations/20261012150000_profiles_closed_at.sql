-- Settings › Close account (2026-10-12 CPO): no grace period — closed is closed.
-- Replaces close_scheduled_at: set when the user confirms; the account is
-- closed from that moment. Lovable keeps the row and blocks sign-in with a
-- "This account was closed" notice; the live platform deletes the account.
alter table public.profiles rename column close_scheduled_at to closed_at;
comment on column public.profiles.closed_at is
  'Settings › Close account (2026-10-12): set when the user confirms; the account is closed from that moment. Lovable keeps the row and blocks sign-in with a closed notice; the live platform deletes the account.';
