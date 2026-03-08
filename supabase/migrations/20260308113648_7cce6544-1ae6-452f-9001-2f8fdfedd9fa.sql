
CREATE POLICY "Admins can upload application documents"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'application-documents' AND has_role(auth.uid(), 'admin'::app_role)
);
