
-- Add children data as JSONB array to bursary_requests
-- Each child: { name, education_level, school_id, school_name }
ALTER TABLE public.bursary_requests 
ADD COLUMN IF NOT EXISTS children jsonb DEFAULT '[]'::jsonb;
