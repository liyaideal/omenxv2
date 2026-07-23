-- Enable realtime for trades table to sync pending orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;