
-- Bursary request links (admin generates shareable links)
CREATE TABLE public.bursary_request_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bursary_request_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage request links"
  ON public.bursary_request_links FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read valid links by token"
  ON public.bursary_request_links FOR SELECT
  USING (true);

CREATE POLICY "Anyone can mark link as used"
  ON public.bursary_request_links FOR UPDATE
  USING (is_used = false AND expires_at > now());

-- Bursary requests (public submissions)
CREATE TABLE public.bursary_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.bursary_request_links(id),
  full_name text NOT NULL,
  phone text NOT NULL,
  nin text,
  district text,
  sub_county text,
  parish text,
  village text,
  education_level text,
  school_name text,
  reason text,
  income_details text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  appointment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bursary_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bursary requests"
  ON public.bursary_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit a bursary request"
  ON public.bursary_requests FOR INSERT
  WITH CHECK (true);

-- Appointments (general + bursary-linked)
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name text NOT NULL,
  phone text NOT NULL,
  appointment_date date NOT NULL,
  seat_number text,
  purpose text NOT NULL DEFAULT 'bursary_request',
  requirements text[] DEFAULT '{}',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled',
  bursary_request_id uuid REFERENCES public.bursary_requests(id),
  application_id uuid REFERENCES public.applications(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage appointments"
  ON public.appointments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add default appointment requirements to app_settings
INSERT INTO public.app_settings (key, value)
VALUES ('appointment_requirements', '{"items": ["National ID (Original + Copy)", "LC1 Letter", "Recent Passport Photos (2)", "School Admission Letter"]}')
ON CONFLICT (key) DO NOTHING;

-- Trigger for updated_at on bursary_requests
CREATE TRIGGER update_bursary_requests_updated_at
  BEFORE UPDATE ON public.bursary_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on appointments
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
