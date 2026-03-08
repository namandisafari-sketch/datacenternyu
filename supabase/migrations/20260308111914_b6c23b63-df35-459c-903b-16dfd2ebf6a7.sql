
-- Attendance records table
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_at timestamptz,
  check_out_at timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_in_accuracy double precision,
  check_in_distance double precision,
  check_out_lat double precision,
  check_out_lng double precision,
  check_out_accuracy double precision,
  check_out_distance double precision,
  hours_worked numeric GENERATED ALWAYS AS (
    CASE WHEN check_in_at IS NOT NULL AND check_out_at IS NOT NULL
      THEN ROUND(EXTRACT(EPOCH FROM (check_out_at - check_in_at)) / 3600.0, 2)
      ELSE NULL
    END
  ) STORED,
  status text NOT NULL DEFAULT 'checked_in',
  device_fingerprint text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Admins can see and manage all attendance
CREATE POLICY "Admins can manage attendance"
  ON public.attendance_records FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own attendance
CREATE POLICY "Users can view own attendance"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_attendance_user_date ON public.attendance_records(user_id, date DESC);
CREATE INDEX idx_attendance_date ON public.attendance_records(date DESC);

-- Store office location in app_settings (will be inserted via insert tool)
