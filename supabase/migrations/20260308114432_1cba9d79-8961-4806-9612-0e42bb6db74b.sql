
ALTER TABLE public.staff_profiles
ADD COLUMN IF NOT EXISTS left_thumb_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS right_thumb_url text DEFAULT '';
