
-- 1. Create school_users table
CREATE TABLE public.school_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own school link"
  ON public.school_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage school users"
  ON public.school_users FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add class_grade column to applications
ALTER TABLE public.applications ADD COLUMN class_grade TEXT DEFAULT '';

-- 3. Create report_cards table
CREATE TABLE public.report_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id),
  term TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  notes TEXT DEFAULT '',
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage report cards"
  ON public.report_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "School users can insert report cards for their students"
  ON public.report_cards FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'school'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.school_users su
      JOIN public.applications a ON a.school_id = su.school_id
      WHERE su.user_id = auth.uid()
        AND a.id = application_id
    )
  );

CREATE POLICY "School users can view report cards for their students"
  ON public.report_cards FOR SELECT
  USING (
    has_role(auth.uid(), 'school'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.school_users su
      JOIN public.applications a ON a.school_id = su.school_id
      WHERE su.user_id = auth.uid()
        AND a.id = application_id
    )
  );

CREATE POLICY "Parents can view own student report cards"
  ON public.report_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

-- 4. School users can file and view claims
CREATE POLICY "School users can file claims for their students"
  ON public.student_claims FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'school'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.school_users su
      JOIN public.applications a ON a.school_id = su.school_id
      WHERE su.user_id = auth.uid()
        AND a.id = application_id
    )
  );

CREATE POLICY "School users can view claims for their students"
  ON public.student_claims FOR SELECT
  USING (
    has_role(auth.uid(), 'school'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.school_users su
      JOIN public.applications a ON a.school_id = su.school_id
      WHERE su.user_id = auth.uid()
        AND a.id = application_id
    )
  );

-- 5. Storage bucket for report cards
INSERT INTO storage.buckets (id, name, public) VALUES ('report-cards', 'report-cards', true);

CREATE POLICY "Admins can manage report card files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'report-cards' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "School users can upload report card files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'report-cards' AND has_role(auth.uid(), 'school'::app_role));

CREATE POLICY "Anyone authenticated can view report card files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-cards' AND auth.uid() IS NOT NULL);
