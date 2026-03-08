
-- Remove permissive INSERT policy - all inserts will go through edge function with service role
DROP POLICY "System can insert access logs" ON public.access_logs;
