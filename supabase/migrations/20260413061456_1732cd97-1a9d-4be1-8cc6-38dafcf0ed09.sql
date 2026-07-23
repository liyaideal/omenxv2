-- Drop old check constraint and recreate with new transaction types
ALTER TABLE public.transactions DROP CONSTRAINT transactions_type_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check 
CHECK (type = ANY (ARRAY[
  'deposit', 'withdraw', 'platform_credit', 'trade_profit', 'trade_loss', 'fee', 'bonus',
  'cross_chain_in', 'cross_chain_out', 'fiat_buy', 'fiat_sell'
]));
