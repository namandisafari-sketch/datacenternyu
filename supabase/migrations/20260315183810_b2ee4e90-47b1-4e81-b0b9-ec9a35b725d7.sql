
CREATE OR REPLACE FUNCTION public.execute_readonly_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  normalized text;
BEGIN
  normalized := upper(trim(query_text));
  
  -- Only allow SELECT statements
  IF NOT (normalized LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Block dangerous keywords
  IF normalized ~ '\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Dangerous SQL keywords detected';
  END IF;
  
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;
