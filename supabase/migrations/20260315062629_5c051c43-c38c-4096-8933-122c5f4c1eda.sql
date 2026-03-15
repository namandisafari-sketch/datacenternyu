
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_in_distance numeric;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_out_distance numeric;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_in_coords jsonb;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_out_coords jsonb;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS device_fingerprint text;
CREATE INDEX idx_attendance_date ON public.attendance_records(date);
CREATE INDEX idx_attendance_user_date ON public.attendance_records(user_id, date);
