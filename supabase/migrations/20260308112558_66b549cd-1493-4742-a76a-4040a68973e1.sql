
-- Staff profiles table with comprehensive fields
CREATE TABLE public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Personal details
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  date_of_birth date,
  nin text DEFAULT '',
  gender text DEFAULT '',
  photo_url text DEFAULT '',
  
  -- Employment info
  staff_number text DEFAULT '',
  role_title text DEFAULT '',
  department text DEFAULT '',
  date_joined date DEFAULT CURRENT_DATE,
  employment_status text DEFAULT 'active',
  access_level text DEFAULT 'standard',
  
  -- Home address (Uganda location hierarchy)
  district text DEFAULT '',
  sub_county text DEFAULT '',
  parish text DEFAULT '',
  village text DEFAULT '',
  
  -- Emergency contact
  emergency_contact_name text DEFAULT '',
  emergency_contact_phone text DEFAULT '',
  emergency_contact_relationship text DEFAULT '',
  
  -- ID card
  id_card_generated boolean DEFAULT false,
  id_card_generated_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage staff profiles"
  ON public.staff_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own staff profile"
  ON public.staff_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_staff_profiles_user ON public.staff_profiles(user_id);
CREATE INDEX idx_staff_profiles_department ON public.staff_profiles(department);

-- Auto-generate staff numbers
CREATE OR REPLACE FUNCTION public.generate_staff_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
  year_str text;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(staff_number FROM 'KBJ-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.staff_profiles
  WHERE staff_number LIKE 'KBJ-' || year_str || '-%';
  
  NEW.staff_number := 'KBJ-' || year_str || '-' || LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_staff_number
  BEFORE INSERT ON public.staff_profiles
  FOR EACH ROW
  WHEN (NEW.staff_number IS NULL OR NEW.staff_number = '')
  EXECUTE FUNCTION public.generate_staff_number();
