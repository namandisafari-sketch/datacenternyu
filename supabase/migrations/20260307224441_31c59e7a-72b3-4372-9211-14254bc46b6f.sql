
-- Delete all non-application, non-auth data
DELETE FROM public.parent_payments;
DELETE FROM public.payment_codes;
DELETE FROM public.expenses;
DELETE FROM public.report_cards;
DELETE FROM public.student_claims;
DELETE FROM public.lost_id_reports;
DELETE FROM public.lawyer_form_submissions;
DELETE FROM public.appointments;
DELETE FROM public.bursary_requests;
DELETE FROM public.bursary_request_links;
DELETE FROM public.lawyer_form_templates;

-- Add location tracking to lawyer_form_submissions
ALTER TABLE public.lawyer_form_submissions 
ADD COLUMN IF NOT EXISTS filled_from_location TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS filled_from_ip TEXT DEFAULT '';
