
-- 1. Fix bursary_requests: require link validation instead of open INSERT
DROP POLICY IF EXISTS "Anyone can submit a bursary request" ON public.bursary_requests;
CREATE POLICY "Validated link holders can submit bursary request"
ON public.bursary_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bursary_request_links
    WHERE id = link_id
      AND is_used = false
      AND expires_at > now()
  )
);

-- 2. Fix lost_id_reports: require valid application_id exists  
DROP POLICY IF EXISTS "Anyone can report a lost ID" ON public.lost_id_reports;
CREATE POLICY "Anyone can report a lost ID with valid application"
ON public.lost_id_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications
    WHERE id = lost_id_reports.application_id
  )
);

-- 3. Fix bursary_request_links: tighten the update policy
DROP POLICY IF EXISTS "Anyone can mark link as used" ON public.bursary_request_links;
CREATE POLICY "Link can be marked used only once"
ON public.bursary_request_links
FOR UPDATE
USING (is_used = false AND expires_at > now())
WITH CHECK (is_used = true);

-- 4. Add parent appointment visibility
CREATE POLICY "Parents can view own appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = appointments.application_id
      AND a.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.bursary_requests br
    JOIN public.bursary_request_links brl ON brl.id = br.link_id
    WHERE br.appointment_id = appointments.id
  )
);
