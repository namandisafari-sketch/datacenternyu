
-- Remove duplicate trusted_devices rows, keeping only the latest one per user+fingerprint
DELETE FROM public.trusted_devices a
USING public.trusted_devices b
WHERE a.user_id = b.user_id
  AND a.device_fingerprint = b.device_fingerprint
  AND a.created_at < b.created_at;

-- Add unique constraint so upsert works correctly
ALTER TABLE public.trusted_devices
ADD CONSTRAINT trusted_devices_user_fingerprint_unique
UNIQUE (user_id, device_fingerprint);
