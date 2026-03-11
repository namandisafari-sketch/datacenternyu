
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'school', 'parent');

-- 1. profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 2. user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access user_roles" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 3. app_settings
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage app_settings" ON public.app_settings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. schools
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'primary',
  district TEXT NOT NULL DEFAULT '',
  sub_county TEXT,
  parish TEXT,
  village TEXT,
  requirements TEXT,
  full_fees NUMERIC NOT NULL DEFAULT 0,
  nyunga_covered_fees NUMERIC NOT NULL DEFAULT 0,
  parent_pays NUMERIC DEFAULT 0,
  boarding_available BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  total_bursaries INTEGER NOT NULL DEFAULT 0,
  boarding_functional_fees JSONB NOT NULL DEFAULT '[]'::jsonb,
  day_functional_fees JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Admins can manage schools" ON public.schools FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. school_users
CREATE TABLE public.school_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_id)
);
ALTER TABLE public.school_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own school_users" ON public.school_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access school_users" ON public.school_users FOR ALL USING (true) WITH CHECK (true);

-- 6. applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  religion TEXT,
  tribe TEXT,
  nin TEXT,
  passport_photo_url TEXT,
  education_level TEXT NOT NULL DEFAULT 'primary',
  class_grade TEXT,
  subject_combination TEXT,
  course_program TEXT,
  previous_schools JSONB,
  academic_results JSONB,
  subject_grades JSONB,
  district TEXT,
  sub_county TEXT,
  parish TEXT,
  village TEXT,
  lci_chairperson TEXT,
  lci_contact TEXT,
  orphan_status TEXT,
  deceased_parent TEXT,
  physical_defect BOOLEAN DEFAULT false,
  physical_defect_details TEXT,
  chronic_disease BOOLEAN DEFAULT false,
  chronic_disease_details TEXT,
  father_details JSONB,
  mother_details JSONB,
  who_pays_fees TEXT,
  guardian_details JSONB,
  next_of_kin JSONB,
  nearby_relative JSONB,
  nearest_neighbor JSONB,
  previous_fees_amount NUMERIC DEFAULT 0,
  affordable_fees_amount NUMERIC DEFAULT 0,
  parent_name TEXT NOT NULL DEFAULT 'N/A',
  parent_phone TEXT NOT NULL DEFAULT 'N/A',
  parent_email TEXT,
  relationship TEXT,
  current_school TEXT,
  school_id UUID REFERENCES public.schools(id),
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  registration_number TEXT,
  reason TEXT,
  report_card_url TEXT,
  birth_certificate_url TEXT,
  parent_id_url TEXT,
  admission_letter_url TEXT,
  declaration_consent BOOLEAN DEFAULT false,
  declaration_date TEXT,
  parent_passport_photo_url TEXT,
  student_signature_url TEXT,
  parent_signature_url TEXT,
  vulnerability_indicators JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all applications" ON public.applications FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  term TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. parent_payments
CREATE TABLE public.parent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL DEFAULT '',
  payment_code_id UUID,
  recorded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parent_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage parent_payments" ON public.parent_payments FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own payments" ON public.parent_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.applications WHERE applications.id = parent_payments.application_id AND applications.user_id = auth.uid())
);

-- 9. payment_codes
CREATE TABLE public.payment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID,
  used_at TIMESTAMPTZ,
  application_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read unused payment_codes" ON public.payment_codes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update payment_codes" ON public.payment_codes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage payment_codes" ON public.payment_codes FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 10. accounting_transactions
CREATE TABLE public.accounting_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  reference_number TEXT NOT NULL DEFAULT '',
  application_id UUID,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage accounting_transactions" ON public.accounting_transactions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. budget_allocations
CREATE TABLE public.budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT '',
  allocated_amount NUMERIC NOT NULL DEFAULT 0,
  spent_amount NUMERIC NOT NULL DEFAULT 0,
  term TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage budget_allocations" ON public.budget_allocations FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 12. petty_cash
CREATE TABLE public.petty_cash (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'withdrawal',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  authorized_by TEXT DEFAULT '',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.petty_cash ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage petty_cash" ON public.petty_cash FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. material_categories
CREATE TABLE public.material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage material_categories" ON public.material_categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 14. material_distributions
CREATE TABLE public.material_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.material_categories(id),
  item_name TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  term TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  distributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.material_distributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage material_distributions" ON public.material_distributions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. bursary_request_links
CREATE TABLE public.bursary_request_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  created_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bursary_request_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read bursary_request_links" ON public.bursary_request_links FOR SELECT USING (true);
CREATE POLICY "Anyone can update bursary_request_links" ON public.bursary_request_links FOR UPDATE USING (true);
CREATE POLICY "Admins can manage bursary_request_links" ON public.bursary_request_links FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 16. bursary_requests
CREATE TABLE public.bursary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES public.bursary_request_links(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  nin TEXT,
  district TEXT,
  sub_county TEXT,
  parish TEXT,
  village TEXT,
  education_level TEXT,
  school_name TEXT,
  reason TEXT,
  income_details TEXT,
  children JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  appointment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bursary_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert bursary_requests" ON public.bursary_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage bursary_requests" ON public.bursary_requests FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 17. appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  seat_number TEXT,
  purpose TEXT NOT NULL DEFAULT 'general',
  requirements JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled',
  bursary_request_id UUID,
  application_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage appointments" ON public.appointments FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 18. student_claims
CREATE TABLE public.student_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.schools(id),
  claim_type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  action_taken TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage student_claims" ON public.student_claims FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 19. report_cards
CREATE TABLE public.report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  term TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage report_cards" ON public.report_cards FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 20. lawyer_form_templates
CREATE TABLE public.lawyer_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lawyer_form_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read lawyer_form_templates" ON public.lawyer_form_templates FOR SELECT USING (true);
CREATE POLICY "Admins can manage lawyer_form_templates" ON public.lawyer_form_templates FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 21. lawyer_form_submissions
CREATE TABLE public.lawyer_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.lawyer_form_templates(id),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  signed_document_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  admin_notes TEXT DEFAULT '',
  filled_from_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lawyer_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own submissions" ON public.lawyer_form_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON public.lawyer_form_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage lawyer_form_submissions" ON public.lawyer_form_submissions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 22. staff_profiles
CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  date_of_birth DATE,
  nin TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  role_title TEXT DEFAULT '',
  department TEXT DEFAULT '',
  staff_number TEXT,
  date_joined DATE DEFAULT CURRENT_DATE,
  employment_status TEXT DEFAULT 'active',
  access_level TEXT DEFAULT 'standard',
  district TEXT DEFAULT '',
  sub_county TEXT DEFAULT '',
  parish TEXT DEFAULT '',
  village TEXT DEFAULT '',
  emergency_contact_name TEXT DEFAULT '',
  emergency_contact_phone TEXT DEFAULT '',
  emergency_contact_relationship TEXT DEFAULT '',
  left_thumb_url TEXT DEFAULT '',
  right_thumb_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own staff_profile" ON public.staff_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage staff_profiles" ON public.staff_profiles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 23. staff_permissions
CREATE TABLE public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_key TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own permissions" ON public.staff_permissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage staff_permissions" ON public.staff_permissions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 24. attendance_records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  hours_worked NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'checked_in',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.attendance_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage attendance_records" ON public.attendance_records FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 25. audit_logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL DEFAULT '',
  record_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage audit_logs" ON public.audit_logs FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 26. access_logs
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage access_logs" ON public.access_logs FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert access_logs" ON public.access_logs FOR INSERT WITH CHECK (true);

-- 27. lost_id_reports
CREATE TABLE public.lost_id_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  finder_phone TEXT NOT NULL,
  finder_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lost_id_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert lost_id_reports" ON public.lost_id_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage lost_id_reports" ON public.lost_id_reports FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 28. trusted_devices
CREATE TABLE public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name TEXT DEFAULT '',
  device_fingerprint TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own devices" ON public.trusted_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devices" ON public.trusted_devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage trusted_devices" ON public.trusted_devices FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 29. webauthn_credentials
CREATE TABLE public.webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  device_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own webauthn" ON public.webauthn_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webauthn" ON public.webauthn_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage webauthn_credentials" ON public.webauthn_credentials FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 30. scanned_documents
CREATE TABLE public.scanned_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL DEFAULT '',
  original_filename TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL DEFAULT '',
  ocr_confidence NUMERIC DEFAULT 0,
  application_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scanned_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage scanned_documents" ON public.scanned_documents FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 31. uganda_locations (for location selectors)
CREATE TABLE public.uganda_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'district',
  parent_id UUID REFERENCES public.uganda_locations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.uganda_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read uganda_locations" ON public.uganda_locations FOR SELECT USING (true);
CREATE POLICY "Admins can manage uganda_locations" ON public.uganda_locations FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 32. photocopy_pricing
CREATE TABLE public.photocopy_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_size TEXT NOT NULL DEFAULT 'A4',
  copy_type TEXT NOT NULL DEFAULT 'black_white',
  price_per_copy NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photocopy_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read photocopy_pricing" ON public.photocopy_pricing FOR SELECT USING (true);
CREATE POLICY "Admins can manage photocopy_pricing" ON public.photocopy_pricing FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 33. photocopy_transactions
CREATE TABLE public.photocopy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT DEFAULT '',
  paper_size TEXT NOT NULL DEFAULT 'A4',
  copy_type TEXT NOT NULL DEFAULT 'black_white',
  num_copies INTEGER NOT NULL DEFAULT 1,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  staff_id UUID,
  shift_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photocopy_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage photocopy_transactions" ON public.photocopy_transactions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can insert photocopy_transactions" ON public.photocopy_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff can view photocopy_transactions" ON public.photocopy_transactions FOR SELECT USING (auth.uid() IS NOT NULL);

-- 34. photocopy_shifts
CREATE TABLE public.photocopy_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ,
  total_transactions INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, shift_date)
);
ALTER TABLE public.photocopy_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage own shifts" ON public.photocopy_shifts FOR ALL USING (auth.uid() = staff_id) WITH CHECK (auth.uid() = staff_id);
CREATE POLICY "Admins can manage photocopy_shifts" ON public.photocopy_shifts FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DB function: get_schools_with_availability
CREATE OR REPLACE FUNCTION public.get_schools_with_availability()
RETURNS TABLE (
  id UUID,
  name TEXT,
  level TEXT,
  total_bursaries INTEGER,
  approved_count BIGINT,
  available_slots BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    s.id,
    s.name,
    s.level,
    s.total_bursaries,
    COUNT(a.id) AS approved_count,
    GREATEST(s.total_bursaries - COUNT(a.id)::int, 0)::bigint AS available_slots
  FROM public.schools s
  LEFT JOIN public.applications a ON a.school_id = s.id AND a.status = 'approved'
  WHERE s.is_active = true AND s.total_bursaries > 0
  GROUP BY s.id, s.name, s.level, s.total_bursaries
$$;

-- Create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for scanned documents
INSERT INTO storage.buckets (id, name, public) VALUES ('scanned-documents', 'scanned-documents', false)
ON CONFLICT (id) DO NOTHING;
