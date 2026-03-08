
-- Create a public bucket for organization assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('org-assets', 'org-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Admins can upload org assets
CREATE POLICY "Admins can upload org assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'org-assets' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update org assets
CREATE POLICY "Admins can update org assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'org-assets' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete org assets
CREATE POLICY "Admins can delete org assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'org-assets' AND public.has_role(auth.uid(), 'admin'));

-- Anyone can view org assets (public bucket)
CREATE POLICY "Anyone can view org assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-assets');
