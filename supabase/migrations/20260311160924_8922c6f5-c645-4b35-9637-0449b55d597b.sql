CREATE INDEX IF NOT EXISTS idx_applications_registration_number_norm
ON public.applications ((regexp_replace(lower(coalesce(registration_number, '')), '[^a-z0-9]', '', 'g')));

CREATE INDEX IF NOT EXISTS idx_scanned_documents_application_number_norm
ON public.scanned_documents ((regexp_replace(lower(coalesce(application_number, '')), '[^a-z0-9]', '', 'g')));

CREATE OR REPLACE FUNCTION public.link_scanned_documents_to_applications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  WITH matched AS (
    SELECT sd.id AS scanned_id, a.id AS application_id
    FROM public.scanned_documents sd
    JOIN public.applications a
      ON regexp_replace(lower(coalesce(sd.application_number, '')), '[^a-z0-9]', '', 'g')
       = regexp_replace(lower(coalesce(a.registration_number, '')), '[^a-z0-9]', '', 'g')
    WHERE sd.application_id IS NULL
      AND coalesce(a.registration_number, '') <> ''
  ), updated AS (
    UPDATE public.scanned_documents sd
    SET application_id = m.application_id
    FROM matched m
    WHERE sd.id = m.scanned_id
      AND sd.application_id IS NULL
    RETURNING sd.id
  )
  SELECT count(*) INTO v_updated FROM updated;

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_scanned_documents_to_applications() TO authenticated;