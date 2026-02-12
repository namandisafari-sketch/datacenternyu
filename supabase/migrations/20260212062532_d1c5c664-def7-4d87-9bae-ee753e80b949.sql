
-- Education levels enum
CREATE TYPE public.education_level AS ENUM ('nursery', 'primary', 'secondary_o', 'secondary_a', 'vocational', 'university');

-- Application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- Role enum for admin
CREATE TYPE public.app_role AS ENUM ('admin', 'parent');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level education_level NOT NULL,
  district TEXT NOT NULL DEFAULT '',
  requirements TEXT DEFAULT '',
  full_fees NUMERIC NOT NULL DEFAULT 0,
  nyunga_covered_fees NUMERIC NOT NULL DEFAULT 0,
  parent_pays NUMERIC GENERATED ALWAYS AS (GREATEST(full_fees - nyunga_covered_fees, 0)) STORED,
  boarding_available BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Schools are publicly readable
CREATE POLICY "Anyone can view active schools" ON public.schools FOR SELECT USING (is_active = true);
-- Only admins can manage schools
CREATE POLICY "Admins can manage schools" ON public.schools FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Parent info
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT DEFAULT '',
  relationship TEXT DEFAULT 'parent',
  -- Student info
  student_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT DEFAULT '',
  education_level education_level NOT NULL,
  school_id UUID REFERENCES public.schools(id),
  current_school TEXT DEFAULT '',
  district TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  -- Status
  status application_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own applications" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Parents can create applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all applications" ON public.applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'tuition',
  term TEXT DEFAULT '',
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Parents can view own student expenses" ON public.expenses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications WHERE applications.id = expenses.application_id AND applications.user_id = auth.uid())
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''));
  
  -- Default role is parent
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'parent');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some schools
INSERT INTO public.schools (name, level, district, requirements, full_fees, nyunga_covered_fees, boarding_available) VALUES
('Kampala Primary School', 'primary', 'Kampala', 'Report card, Birth certificate, 2 passport photos', 450000, 350000, false),
('St. Mary''s Primary', 'primary', 'Wakiso', 'Report card, Birth certificate, Recommendation letter', 600000, 500000, true),
('Mengo Senior School', 'secondary_o', 'Kampala', 'PLE results, Birth certificate, 4 passport photos, Medical form', 1200000, 900000, true),
('Kibuli Secondary School', 'secondary_o', 'Kampala', 'PLE results, Birth certificate, 2 passport photos', 950000, 700000, true),
('Makerere College School', 'secondary_a', 'Kampala', 'UCE results, Birth certificate, 4 passport photos, Medical form', 1500000, 1100000, true),
('Nkumba University', 'university', 'Wakiso', 'UACE results, National ID, Admission letter, Medical form', 3500000, 2500000, false),
('Makerere University', 'university', 'Kampala', 'UACE results, National ID, Admission letter', 4000000, 3000000, false),
('Kampala Technical Institute', 'vocational', 'Kampala', 'UCE results or equivalent, National ID', 800000, 600000, false),
('Little Stars Nursery', 'nursery', 'Kampala', 'Birth certificate, Immunization card', 250000, 200000, false),
('Bright Future Nursery', 'nursery', 'Mukono', 'Birth certificate, Immunization card, 2 passport photos', 300000, 250000, false);
