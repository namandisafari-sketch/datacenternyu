
-- =============================================
-- Nyunga Foundation Full Database Schema
-- =============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'parent', 'school', 'staff', 'accountant', 'secretary', 'data_entrant');
CREATE TYPE public.education_level AS ENUM ('nursery', 'primary', 'secondary_o', 'secondary_a', 'vocational', 'university');

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. USER ROLES TABLE
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. APP SETTINGS
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. SCHOOLS
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL DEFAULT 'primary',
  district text NOT NULL DEFAULT '',
  sub_county text,
  parish text,
  village text,
  requirements text,
  full_fees numeric NOT NULL DEFAULT 0,
  nyunga_covered_fees numeric NOT NULL DEFAULT 0,
  parent_pays numeric DEFAULT 0,
  boarding_available boolean DEFAULT false,
  is_active boolean DEFAULT true,
  total_bursaries integer NOT NULL DEFAULT 0,
  boarding_functional_fees jsonb DEFAULT '[]'::jsonb,
  day_functional_fees jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view schools" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public can view schools" ON public.schools FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can manage schools" ON public.schools FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. APPLICATIONS
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  date_of_birth date,
  gender text,
  nationality text,
  religion text,
  tribe text,
  nin text,
  passport_photo_url text,
  education_level text NOT NULL DEFAULT 'primary',
  class_grade text,
  subject_combination text,
  course_program text,
  previous_schools jsonb,
  academic_results jsonb,
  subject_grades jsonb,
  district text,
  sub_county text,
  parish text,
  village text,
  lci_chairperson text,
  lci_contact text,
  orphan_status text,
  deceased_parent text,
  physical_defect boolean,
  physical_defect_details text,
  chronic_disease boolean,
  chronic_disease_details text,
  father_details jsonb,
  mother_details jsonb,
  who_pays_fees text,
  guardian_details jsonb,
  next_of_kin jsonb,
  nearby_relative jsonb,
  nearest_neighbor jsonb,
  previous_fees_amount numeric,
  affordable_fees_amount numeric,
  parent_name text NOT NULL DEFAULT 'N/A',
  parent_phone text NOT NULL DEFAULT 'N/A',
  parent_email text,
  relationship text,
  current_school text,
  school_id uuid REFERENCES public.schools(id),
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  registration_number text,
  reason text,
  declaration_consent boolean,
  declaration_date date,
  report_card_url text,
  birth_certificate_url text,
  parent_id_url text,
  admission_letter_url text,
  parent_passport_photo_url text,
  student_signature_url text,
  parent_signature_url text,
  right_thumb_url text,
  vulnerability_indicators text[] DEFAULT '{}',
  fees_per_term numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all applications" ON public.applications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_applications_user ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_school ON public.applications(school_id);

-- Auto-generate registration number
CREATE OR REPLACE FUNCTION public.generate_registration_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  prefix text;
  seq integer;
BEGIN
  prefix := 'NYF-' || to_char(now(), 'YY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO seq
  FROM public.applications
  WHERE registration_number LIKE prefix || '%';
  NEW.registration_number := prefix || '-' || LPAD(seq::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_registration_number
  BEFORE INSERT ON public.applications
  FOR EACH ROW
  WHEN (NEW.registration_number IS NULL)
  EXECUTE FUNCTION public.generate_registration_number();

-- 7. PAYMENT CODES
CREATE TABLE public.payment_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  application_id uuid REFERENCES public.applications(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view codes" ON public.payment_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can verify codes" ON public.payment_codes FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can manage codes" ON public.payment_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update codes on use" ON public.payment_codes FOR UPDATE TO authenticated USING (true);

-- 8. PARENT PAYMENTS
CREATE TABLE public.parent_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  payment_code_id uuid REFERENCES public.payment_codes(id),
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.parent_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payments" ON public.parent_payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own payments" ON public.parent_payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications WHERE applications.id = application_id AND applications.user_id = auth.uid())
);
CREATE POLICY "Users can insert payments" ON public.parent_payments FOR INSERT TO authenticated WITH CHECK (true);

-- 9. EXPENSES
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'tuition',
  term text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 10. STUDENT CLAIMS
CREATE TABLE public.student_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id),
  claim_type text NOT NULL DEFAULT 'general',
  description text NOT NULL,
  action_taken text,
  status text NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage claims" ON public.student_claims FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "School users can manage claims" ON public.student_claims FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'school'));

-- 11. REPORT CARDS
CREATE TABLE public.report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  term text NOT NULL,
  year text NOT NULL,
  file_url text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage report cards" ON public.report_cards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "School users can manage reports" ON public.report_cards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'school'));

-- 12. SCANNED DOCUMENTS
CREATE TABLE public.scanned_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id),
  application_number text NOT NULL DEFAULT '',
  original_filename text NOT NULL DEFAULT '',
  storage_path text NOT NULL DEFAULT '',
  school_id uuid REFERENCES public.schools(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scanned_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage scanned docs" ON public.scanned_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 13. LAWYER FORM TEMPLATES
CREATE TABLE public.lawyer_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lawyer_form_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active templates" ON public.lawyer_form_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage templates" ON public.lawyer_form_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 14. LAWYER FORM SUBMISSIONS
CREATE TABLE public.lawyer_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.lawyer_form_templates(id),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  responses jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  signed_document_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lawyer_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own submissions" ON public.lawyer_form_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own submissions" ON public.lawyer_form_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON public.lawyer_form_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete submissions" ON public.lawyer_form_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 15. AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 16. STAFF PROFILES
CREATE TABLE public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  date_of_birth date,
  nin text,
  gender text,
  photo_url text,
  staff_number text UNIQUE,
  role_title text,
  department text,
  date_joined date,
  employment_status text DEFAULT 'active',
  access_level text DEFAULT 'standard',
  district text,
  sub_county text,
  parish text,
  village text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  left_thumb_url text,
  right_thumb_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage staff" ON public.staff_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can view own profile" ON public.staff_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Auto-generate staff number
CREATE OR REPLACE FUNCTION public.generate_staff_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE seq integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(staff_number FROM '[0-9]+$') AS integer)), 0) + 1
  INTO seq FROM public.staff_profiles WHERE staff_number IS NOT NULL;
  NEW.staff_number := 'STF-' || LPAD(seq::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_staff_number
  BEFORE INSERT ON public.staff_profiles
  FOR EACH ROW
  WHEN (NEW.staff_number IS NULL)
  EXECUTE FUNCTION public.generate_staff_number();

-- 17. STAFF PERMISSIONS
CREATE TABLE public.staff_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage permissions" ON public.staff_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own permissions" ON public.staff_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 18. WEBAUTHN CREDENTIALS
CREATE TABLE public.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter integer NOT NULL DEFAULT 0,
  device_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage webauthn" ON public.webauthn_credentials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own credentials" ON public.webauthn_credentials FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credentials" ON public.webauthn_credentials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 19. ATTENDANCE RECORDS
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  hours_worked numeric,
  status text DEFAULT 'present',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage attendance" ON public.attendance_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own attendance" ON public.attendance_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.attendance_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 20. APPOINTMENTS
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name text NOT NULL,
  phone text NOT NULL,
  appointment_date date NOT NULL,
  seat_number text,
  purpose text DEFAULT 'general',
  requirements text[] DEFAULT '{}',
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  bursary_request_id uuid,
  application_id uuid REFERENCES public.applications(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 21. BURSARY REQUESTS
CREATE TABLE public.bursary_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  nin text,
  district text,
  sub_county text,
  parish text,
  village text,
  education_level text,
  school_name text,
  reason text,
  income_details text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  appointment_id uuid,
  children jsonb DEFAULT '[]'::jsonb,
  link_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bursary_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage bursary requests" ON public.bursary_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can insert bursary requests" ON public.bursary_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can insert bursary requests" ON public.bursary_requests FOR INSERT TO authenticated WITH CHECK (true);

-- 22. BURSARY REQUEST LINKS
CREATE TABLE public.bursary_request_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  is_used boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bursary_request_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage links" ON public.bursary_request_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can view valid links" ON public.bursary_request_links FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can update links" ON public.bursary_request_links FOR UPDATE TO anon USING (true);

-- 23. ACCOUNTING TRANSACTIONS
CREATE TABLE public.accounting_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  reference_number text,
  application_id uuid REFERENCES public.applications(id),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage transactions" ON public.accounting_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 24. BUDGET ALLOCATIONS
CREATE TABLE public.budget_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  allocated_amount numeric NOT NULL DEFAULT 0,
  spent_amount numeric NOT NULL DEFAULT 0,
  term text,
  year text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage budgets" ON public.budget_allocations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 25. PETTY CASH
CREATE TABLE public.petty_cash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  authorized_by text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  notes text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.petty_cash ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage petty cash" ON public.petty_cash FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 26. MATERIAL CATEGORIES
CREATE TABLE public.material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit_cost numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage material categories" ON public.material_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 27. MATERIAL DISTRIBUTIONS
CREATE TABLE public.material_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id),
  category_id uuid REFERENCES public.material_categories(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  notes text,
  distributed_by uuid REFERENCES auth.users(id),
  distributed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.material_distributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage distributions" ON public.material_distributions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 28. PHOTOCOPY PRICING
CREATE TABLE public.photocopy_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_size text NOT NULL DEFAULT 'A4',
  copy_type text NOT NULL DEFAULT 'black_white',
  price_per_copy numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.photocopy_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view pricing" ON public.photocopy_pricing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage pricing" ON public.photocopy_pricing FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 29. PHOTOCOPY TRANSACTIONS
CREATE TABLE public.photocopy_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text,
  paper_size text NOT NULL DEFAULT 'A4',
  copy_type text NOT NULL DEFAULT 'black_white',
  num_copies integer NOT NULL DEFAULT 1,
  price_per_copy numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  change_given numeric DEFAULT 0,
  served_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.photocopy_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view ph transactions" ON public.photocopy_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert ph transactions" ON public.photocopy_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage ph transactions" ON public.photocopy_transactions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 30. PHOTOCOPY SHIFTS
CREATE TABLE public.photocopy_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id text NOT NULL,
  shift_date date NOT NULL,
  opening_cash numeric DEFAULT 0,
  closing_cash numeric,
  expected_cash numeric,
  discrepancy numeric,
  status text NOT NULL DEFAULT 'open',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.photocopy_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view shifts" ON public.photocopy_shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert shifts" ON public.photocopy_shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update shifts" ON public.photocopy_shifts FOR UPDATE TO authenticated USING (true);

-- 31. ACCESS LOGS
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  ip_address text,
  user_agent text,
  device_fingerprint text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view access logs" ON public.access_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can insert access logs" ON public.access_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can insert access logs" ON public.access_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 32. TRUSTED DEVICES
CREATE TABLE public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage devices" ON public.trusted_devices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 33. SCHOOL USERS
CREATE TABLE public.school_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_id)
);
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage school users" ON public.school_users FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "School users can view own" ON public.school_users FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 34. SCHOOL ATTENDANCE REPORTS
CREATE TABLE public.school_attendance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  student_name text NOT NULL,
  class_grade text,
  registration_number text,
  match_status text DEFAULT 'unmatched',
  term text,
  year text,
  reporter_name text,
  reporter_phone text,
  fees_currently_paying numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.school_attendance_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage attendance reports" ON public.school_attendance_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anon can insert att reports" ON public.school_attendance_reports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can select att reports" ON public.school_attendance_reports FOR SELECT TO anon USING (true);
CREATE POLICY "Auth can insert att reports" ON public.school_attendance_reports FOR INSERT TO authenticated WITH CHECK (true);

-- 35. UGANDA LOCATIONS
CREATE TABLE public.uganda_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL,
  parent_id uuid REFERENCES public.uganda_locations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.uganda_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view locations" ON public.uganda_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can view locations" ON public.uganda_locations FOR SELECT TO anon USING (true);
CREATE INDEX idx_locations_level ON public.uganda_locations(level);
CREATE INDEX idx_locations_parent ON public.uganda_locations(parent_id);

-- 36. LOST ID REPORTS
CREATE TABLE public.lost_id_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id),
  finder_phone text NOT NULL,
  finder_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lost_id_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon can insert lost id reports" ON public.lost_id_reports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admins can view lost id reports" ON public.lost_id_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 37. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view application docs" ON storage.objects FOR SELECT USING (bucket_id = 'application-documents');
CREATE POLICY "Authenticated can upload docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'application-documents');
CREATE POLICY "Authenticated can update docs" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'application-documents');

-- 38. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_schools_with_availability()
RETURNS TABLE (id uuid, name text, level text, total_bursaries integer, approved_count bigint, available_slots bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.name, s.level, s.total_bursaries,
    COUNT(a.id) AS approved_count,
    GREATEST(s.total_bursaries - COUNT(a.id), 0) AS available_slots
  FROM public.schools s
  LEFT JOIN public.applications a ON a.school_id = s.id AND a.status = 'approved'
  WHERE s.is_active = true
  GROUP BY s.id, s.name, s.level, s.total_bursaries;
$$;

CREATE OR REPLACE FUNCTION public.link_scanned_documents_to_applications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.scanned_documents sd
  SET application_id = a.id
  FROM public.applications a
  WHERE sd.application_id IS NULL
    AND sd.application_number != ''
    AND a.registration_number = sd.application_number;
END;
$$;

-- 39. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_profiles_updated_at BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lawyer_templates_updated_at BEFORE UPDATE ON public.lawyer_form_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add FK for appointments -> bursary_requests (deferred since bursary_requests created after appointments)
ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_bursary_request FOREIGN KEY (bursary_request_id) REFERENCES public.bursary_requests(id);
