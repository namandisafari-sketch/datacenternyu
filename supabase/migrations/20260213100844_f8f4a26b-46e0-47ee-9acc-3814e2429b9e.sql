
-- Payment codes table: admin generates codes, parents use them to apply
CREATE TABLE public.payment_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES auth.users(id),
  used_at timestamp with time zone,
  application_id uuid REFERENCES public.applications(id),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment codes"
  ON public.payment_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view unused codes by code value"
  ON public.payment_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can claim a code"
  ON public.payment_codes FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_used = false)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admission settings table: stores global config like admission lock
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.app_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Insert default admission setting
INSERT INTO public.app_settings (key, value) VALUES ('admission_lock', '{"locked": false}'::jsonb);
