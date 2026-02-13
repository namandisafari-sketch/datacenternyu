
-- Add new columns to applications table for comprehensive Uganda scholarship form

-- Applicant info
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Ugandan';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS nin text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS passport_photo_url text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS sub_county text DEFAULT '';

-- School info (level-specific)
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS school_type text DEFAULT ''; -- government/private
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS uneb_index_number text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS institution_name text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS course_program text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS year_of_study text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS registration_number text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS admission_letter_url text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS transcript_url text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS expected_graduation_year text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS report_card_url text DEFAULT '';

-- Parent/guardian extended info
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS parent_occupation text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS parent_monthly_income text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS parent_nin text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS children_in_school integer DEFAULT 0;

-- Financial need assessment
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS current_fee_payer text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS fees_per_term numeric DEFAULT 0;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS outstanding_balances numeric DEFAULT 0;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS previous_bursary boolean DEFAULT false;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS household_income_range text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS proof_of_need_url text DEFAULT '';

-- Personal statement
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS personal_statement text DEFAULT '';

-- Vulnerability indicators (stored as JSONB array of strings)
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS vulnerability_indicators jsonb DEFAULT '[]'::jsonb;

-- Document uploads
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS birth_certificate_url text DEFAULT '';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS parent_id_url text DEFAULT '';

-- Declaration
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS declaration_consent boolean DEFAULT false;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS declaration_date date;

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all application documents
CREATE POLICY "Admins can view all application documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'application-documents' AND public.has_role(auth.uid(), 'admin'));

-- School users can view documents for their students
CREATE POLICY "Schools can view student documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'application-documents' AND public.has_role(auth.uid(), 'school'));
