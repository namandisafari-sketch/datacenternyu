
-- Add missing columns to photocopy_shifts
ALTER TABLE public.photocopy_shifts 
  ADD COLUMN opening_cash NUMERIC DEFAULT 0,
  ADD COLUMN closing_cash NUMERIC,
  ADD COLUMN expected_cash NUMERIC,
  ADD COLUMN discrepancy NUMERIC,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN closed_at TIMESTAMPTZ;

-- Add missing column to attendance_records
ALTER TABLE public.attendance_records 
  ADD COLUMN check_in_distance NUMERIC;
