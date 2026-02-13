
-- Tighten the payment code update policy to only allow claiming with proper check
DROP POLICY "Authenticated users can claim a code" ON public.payment_codes;

CREATE POLICY "Authenticated users can claim a code"
  ON public.payment_codes FOR UPDATE
  USING (auth.uid() IS NOT NULL AND is_used = false)
  WITH CHECK (auth.uid() IS NOT NULL AND used_by = auth.uid());
