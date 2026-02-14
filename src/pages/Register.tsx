import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, ArrowRight, ArrowLeft, Lock, Ticket } from "lucide-react";

import { ApplicationForm, SchoolRow, initialForm, EducationLevel } from "@/components/register/types";
import StepApplicantInfo from "@/components/register/StepApplicantInfo";
import StepEducationLevel from "@/components/register/StepEducationLevel";
import StepSchoolInfo from "@/components/register/StepSchoolInfo";
import StepParentInfo from "@/components/register/StepParentInfo";
import StepFinancialNeed from "@/components/register/StepFinancialNeed";
import StepPersonalStatement from "@/components/register/StepPersonalStatement";
import StepVulnerability from "@/components/register/StepVulnerability";
import StepDocuments from "@/components/register/StepDocuments";
import StepDeclaration from "@/components/register/StepDeclaration";

const TOTAL_STEPS = 9;

const stepLabels = [
  "Applicant",
  "Level",
  "School",
  "Parent",
  "Financial",
  "Statement",
  "Vulnerability",
  "Documents",
  "Declaration",
];

const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRow | null>(null);

  // Payment code gate
  const [paymentCode, setPaymentCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Admission lock
  const [admissionLocked, setAdmissionLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  // Check admission lock
  useEffect(() => {
    const checkLock = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "admission_lock")
        .single();
      if (data) {
        const val = data.value as { locked?: boolean };
        setAdmissionLocked(val?.locked ?? false);
      }
      setCheckingLock(false);
    };
    checkLock();
  }, []);

  useEffect(() => {
    if (form.educationLevel) {
      supabase
        .from("schools")
        .select("*")
        .eq("level", form.educationLevel)
        .then(({ data }) => {
          setSchools((data as unknown as SchoolRow[]) || []);
          setSelectedSchool(null);
        });
    }
  }, [form.educationLevel]);

  const verifyPaymentCode = async () => {
    if (!paymentCode.trim()) {
      toast.error("Please enter a payment code");
      return;
    }
    setVerifying(true);
    const { data, error } = await supabase
      .from("payment_codes")
      .select("*")
      .eq("code", paymentCode.trim().toUpperCase())
      .eq("is_used", false)
      .maybeSingle();

    if (error || !data) {
      toast.error("Invalid or already used payment code");
      setVerifying(false);
      return;
    }

    // Mark code as used
    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from("payment_codes")
      .update({
        is_used: true,
        used_by: userData.user?.id,
        used_at: new Date().toISOString(),
      } as any)
      .eq("id", data.id);

    setCodeVerified(true);
    setVerifying(false);
    toast.success("Payment verified! You can now proceed.");
  };

  const update = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!(form.studentName && form.dateOfBirth && form.gender && form.district);
      case 2: return !!form.educationLevel;
      case 3: {
        const lvl = form.educationLevel;
        if (["nursery", "primary", "secondary_o", "secondary_a"].includes(lvl)) return !!(form.currentSchool && form.classGrade);
        if (["university", "vocational"].includes(lvl)) return !!(form.institutionName && form.courseProgram);
        return true;
      }
      case 4: return !!(form.parentName && form.parentPhone);
      case 5: return true;
      case 6: return !!form.reason || !!form.personalStatement;
      case 7: return true;
      case 8: return true;
      case 9: return form.declarationConsent;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    if (!form.declarationConsent) { toast.error("Please accept the declaration"); return; }

    setLoading(true);
    const { data: appData, error } = await supabase.from("applications").insert({
      user_id: user.id,
      student_name: form.studentName,
      date_of_birth: form.dateOfBirth || null,
      gender: form.gender,
      nationality: form.nationality,
      nin: form.nin,
      passport_photo_url: form.passportPhotoUrl,
      district: form.district,
      sub_county: form.subCounty,
      parish: form.parish,
      village: form.village,
      education_level: form.educationLevel as EducationLevel,
      school_id: selectedSchool?.id || null,
      current_school: form.currentSchool,
      school_type: form.schoolType,
      class_grade: form.classGrade,
      report_card_url: form.reportCardUrl,
      uneb_index_number: form.unebIndexNumber,
      institution_name: form.institutionName,
      course_program: form.courseProgram,
      year_of_study: form.yearOfStudy,
      registration_number: form.registrationNumber,
      admission_letter_url: form.admissionLetterUrl,
      transcript_url: form.transcriptUrl,
      expected_graduation_year: form.expectedGraduationYear,
      parent_name: form.parentName,
      parent_phone: form.parentPhone,
      parent_email: form.parentEmail,
      relationship: form.relationship,
      parent_occupation: form.parentOccupation,
      parent_monthly_income: form.parentMonthlyIncome,
      parent_nin: form.parentNin,
      children_in_school: form.childrenInSchool,
      current_fee_payer: form.currentFeePayer,
      fees_per_term: form.feesPerTerm,
      outstanding_balances: form.outstandingBalances,
      previous_bursary: form.previousBursary,
      household_income_range: form.householdIncomeRange,
      proof_of_need_url: form.proofOfNeedUrl,
      personal_statement: form.personalStatement,
      reason: form.reason,
      vulnerability_indicators: form.vulnerabilityIndicators,
      birth_certificate_url: form.birthCertificateUrl,
      parent_id_url: form.parentIdUrl,
      declaration_consent: form.declarationConsent,
      declaration_date: form.declarationDate || null,
    } as any).select("id").single();

    setLoading(false);
    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      // Link payment code to application and auto-record payment
      if (appData?.id && codeVerified && paymentCode) {
        const verifiedCode = await supabase
          .from("payment_codes")
          .select("id")
          .eq("code", paymentCode.trim().toUpperCase())
          .eq("is_used", true)
          .maybeSingle();

        if (verifiedCode.data) {
          // Link the payment code to this application
          await supabase
            .from("payment_codes")
            .update({ application_id: appData.id } as any)
            .eq("id", verifiedCode.data.id);

          // Auto-create payment record in parent_payments
          await supabase.from("parent_payments").insert({
            application_id: appData.id,
            amount: 50000,
            payment_method: "payment_code",
            payment_date: new Date().toISOString().split("T")[0],
            description: "application_fee",
            payment_code_id: verifiedCode.data.id,
            recorded_by: user.id,
          } as any);
        }
      }

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10">
            <CheckCircle size={64} className="text-accent mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your application has been received. You can track the status from your dashboard.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkingLock) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (admissionLocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10">
            <Lock size={64} className="text-destructive mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Admissions Closed</h2>
            <p className="text-muted-foreground mb-6">
              Applications are currently closed. Please check back later or contact the Nyunga Foundation for more information.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!codeVerified) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-6">
              <Ticket size={48} className="text-primary mx-auto mb-3" />
              <h2 className="font-display text-2xl font-bold text-primary mb-2">Payment Required</h2>
              <p className="text-muted-foreground text-sm">
                Enter your payment code to start the application. You can get a code after making payment at any Nyunga Foundation office.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Code</Label>
                <Input
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
                  placeholder="e.g. NYG-ABCD-EFGH-JKLM"
                  className="font-mono text-center text-lg tracking-wider"
                />
              </div>
              <Button onClick={verifyPaymentCode} disabled={verifying} className="w-full gap-2">
                {verifying ? "Verifying..." : "Verify & Continue"}
              </Button>
              <Button onClick={() => navigate("/")} variant="ghost" className="w-full">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
            Scholarship Application 🇺🇬
          </h1>
          <p className="text-muted-foreground">
            Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}
          </p>

          {/* Progress bar */}
          <div className="flex gap-1 max-w-md mx-auto mt-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-secondary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="space-y-6">
          {step === 1 && <StepApplicantInfo form={form} update={update} userId={user?.id || ""} />}
          {step === 2 && <StepEducationLevel form={form} update={update} schools={schools} selectedSchool={selectedSchool} setSelectedSchool={setSelectedSchool} />}
          {step === 3 && <StepSchoolInfo form={form} update={update} userId={user?.id || ""} />}
          {step === 4 && <StepParentInfo form={form} update={update} />}
          {step === 5 && <StepFinancialNeed form={form} update={update} userId={user?.id || ""} />}
          {step === 6 && <StepPersonalStatement form={form} update={update} />}
          {step === 7 && <StepVulnerability form={form} update={update} />}
          {step === 8 && <StepDocuments form={form} update={update} userId={user?.id || ""} />}
          {step === 9 && <StepDeclaration form={form} update={update} />}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                <ArrowLeft size={18} /> Back
              </Button>
            )}
            <div className="flex-1" />
            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
              >
                Next <ArrowRight size={18} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold flex-1 max-w-xs"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
