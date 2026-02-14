
-- Create a function to get schools with available bursary slots (accessible without auth)
CREATE OR REPLACE FUNCTION public.get_schools_with_availability()
RETURNS TABLE(id uuid, name text, level text, total_bursaries integer, approved_count bigint, available_slots bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    s.id,
    s.name,
    s.level::text,
    s.total_bursaries,
    COALESCE(COUNT(a.id), 0) AS approved_count,
    GREATEST(0, s.total_bursaries::bigint - COALESCE(COUNT(a.id), 0)) AS available_slots
  FROM schools s
  LEFT JOIN applications a ON a.school_id = s.id AND a.status = 'approved'
  WHERE s.is_active = true AND s.total_bursaries > 0
  GROUP BY s.id, s.name, s.level, s.total_bursaries
  HAVING s.total_bursaries > COALESCE(COUNT(a.id), 0)
  ORDER BY s.name;
$$;
