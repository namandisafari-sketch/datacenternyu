-- Delete all scanned document records
DELETE FROM public.scanned_documents;

-- Create school attendance tracking table
CREATE TABLE IF NOT EXISTS public.school_attendance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  class_grade text NOT NULL DEFAULT '',
  registration_number text DEFAULT '',
  application_id uuid REFERENCES public.applications(id),
  match_status text NOT NULL DEFAULT 'not_found',
  reported_at timestamp with time zone NOT NULL DEFAULT now(),
  term text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  reporter_name text DEFAULT '',
  reporter_phone text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_attendance_reports ENABLE ROW LEVEL SECURITY;

-- Public insert policy (schools submit without auth)
CREATE POLICY "Anyone can insert school_attendance_reports"
  ON public.school_attendance_reports FOR INSERT
  WITH CHECK (true);

-- Public select for own submissions (by reporter_phone)  
CREATE POLICY "Anyone can read school_attendance_reports"
  ON public.school_attendance_reports FOR SELECT
  USING (true);

-- Admins full access
CREATE POLICY "Admins can manage school_attendance_reports"
  ON public.school_attendance_reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));