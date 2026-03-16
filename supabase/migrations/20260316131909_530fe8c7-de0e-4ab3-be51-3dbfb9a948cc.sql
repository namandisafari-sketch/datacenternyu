
-- Table for score sheet submissions (one per school per term)
CREATE TABLE public.student_performance_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  term text NOT NULL,
  year text NOT NULL,
  reporter_name text,
  reporter_phone text,
  file_url text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Individual student scores within a sheet
CREATE TABLE public.student_performance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id uuid NOT NULL REFERENCES public.student_performance_sheets(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id),
  student_name text NOT NULL,
  class_grade text,
  subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_marks numeric DEFAULT 0,
  average_marks numeric DEFAULT 0,
  grade text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_performance_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_performance_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for sheets
CREATE POLICY "Admins can manage performance sheets" ON public.student_performance_sheets
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "School users can manage own sheets" ON public.student_performance_sheets
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'school'::app_role));

CREATE POLICY "Anon can insert sheets" ON public.student_performance_sheets
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can view sheets" ON public.student_performance_sheets
  FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can insert sheets" ON public.student_performance_sheets
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS policies for scores
CREATE POLICY "Admins can manage performance scores" ON public.student_performance_scores
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "School users can manage scores" ON public.student_performance_scores
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'school'::app_role));

CREATE POLICY "Anon can insert scores" ON public.student_performance_scores
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can view scores" ON public.student_performance_scores
  FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can insert scores" ON public.student_performance_scores
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth can view scores" ON public.student_performance_scores
  FOR SELECT TO authenticated USING (true);
