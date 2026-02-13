
-- Create uganda_locations table for cascading location data
CREATE TABLE public.uganda_locations (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('district', 'county', 'subcounty', 'parish', 'village')),
  parent_id TEXT REFERENCES public.uganda_locations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_uganda_locations_level ON public.uganda_locations(level);
CREATE INDEX idx_uganda_locations_parent ON public.uganda_locations(parent_id);
CREATE INDEX idx_uganda_locations_level_parent ON public.uganda_locations(level, parent_id);

-- Enable RLS
ALTER TABLE public.uganda_locations ENABLE ROW LEVEL SECURITY;

-- Everyone can read locations
CREATE POLICY "Anyone can view locations"
ON public.uganda_locations
FOR SELECT
USING (true);

-- Only admins can manage locations
CREATE POLICY "Admins can manage locations"
ON public.uganda_locations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add parish and village columns to applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS parish TEXT DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS village TEXT DEFAULT '';
