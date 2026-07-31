ALTER TABLE public.positions
  ALTER COLUMN leverage TYPE numeric(10,2) USING leverage::numeric(10,2);