-- Drop the old constraint and add expanded one
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('deposit', 'withdraw', 'platform_credit', 'trade_profit', 'trade_loss', 'fee', 'bonus'));