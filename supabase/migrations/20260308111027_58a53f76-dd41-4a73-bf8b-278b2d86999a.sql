
-- Access logs for audit trail
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  device_fingerprint text DEFAULT '',
  success boolean NOT NULL DEFAULT false,
  failure_reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs"
  ON public.access_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert access logs"
  ON public.access_logs FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Trusted devices
CREATE TABLE public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint text NOT NULL,
  device_name text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage trusted devices"
  ON public.trusted_devices FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own devices"
  ON public.trusted_devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON public.trusted_devices(user_id, device_fingerprint);
