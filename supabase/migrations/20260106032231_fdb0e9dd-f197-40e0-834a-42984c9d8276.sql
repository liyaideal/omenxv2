-- Create trades table to store user trades
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  option_label TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('Market', 'Limit')),
  price NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 10,
  margin NUMERIC NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Filled', 'Partial Filled', 'Cancelled', 'Closed')),
  tp_value NUMERIC,
  tp_mode TEXT CHECK (tp_mode IN ('%', '$')),
  sl_value NUMERIC,
  sl_mode TEXT CHECK (sl_mode IN ('%', '$')),
  pnl NUMERIC DEFAULT 0,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- RLS policies for trades
CREATE POLICY "Users can view their own trades"
ON public.trades
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
ON public.trades
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
ON public.trades
FOR UPDATE
USING (auth.uid() = user_id);

-- Create positions table for active positions
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  option_label TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  entry_price NUMERIC NOT NULL,
  mark_price NUMERIC NOT NULL,
  size NUMERIC NOT NULL,
  margin NUMERIC NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 10,
  pnl NUMERIC DEFAULT 0,
  pnl_percent NUMERIC DEFAULT 0,
  tp_value NUMERIC,
  tp_mode TEXT CHECK (tp_mode IN ('%', '$')),
  sl_value NUMERIC,
  sl_mode TEXT CHECK (sl_mode IN ('%', '$')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- RLS policies for positions
CREATE POLICY "Users can view their own positions"
ON public.positions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own positions"
ON public.positions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions"
ON public.positions
FOR UPDATE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
BEFORE UPDATE ON public.positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();