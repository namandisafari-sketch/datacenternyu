
-- Add date column to attendance_records for daily lookups
ALTER TABLE public.attendance_records 
  ADD COLUMN date DATE DEFAULT CURRENT_DATE;
