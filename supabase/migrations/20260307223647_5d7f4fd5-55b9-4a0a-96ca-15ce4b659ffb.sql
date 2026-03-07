-- Delete dependent records for old applications first
DELETE FROM public.parent_payments WHERE application_id IN (SELECT id FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day'));
DELETE FROM public.payment_codes WHERE application_id IN (SELECT id FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day'));
DELETE FROM public.expenses WHERE application_id IN (SELECT id FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day'));
DELETE FROM public.report_cards WHERE application_id IN (SELECT id FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day'));
DELETE FROM public.student_claims WHERE application_id IN (SELECT id FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day'));
DELETE FROM public.lost_id_reports WHERE application_id IN (SELECT id FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day'));
DELETE FROM public.lawyer_form_submissions WHERE application_id IN (SELECT id FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day'));

-- Now delete appointments referencing old applications
DELETE FROM public.appointments WHERE application_id IN (SELECT id FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day'));

-- Finally delete old applications
DELETE FROM public.applications WHERE created_at < (CURRENT_DATE - INTERVAL '1 day');