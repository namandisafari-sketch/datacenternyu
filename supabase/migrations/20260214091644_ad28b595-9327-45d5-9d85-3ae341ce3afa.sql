
-- Add bursary allocation and separate boarding/day functional fees
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS total_bursaries integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boarding_functional_fees jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS day_functional_fees jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sub_county text DEFAULT '',
  ADD COLUMN IF NOT EXISTS parish text DEFAULT '',
  ADD COLUMN IF NOT EXISTS village text DEFAULT '';
