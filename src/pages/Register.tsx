import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, ArrowRight, ArrowLeft, Lock, Ticket, Printer, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PrintableApplicationForm from "@/components/register/PrintableApplicationForm";

import { ApplicationForm, SchoolRow, initialForm, EducationLevel } from "@/components/register/types";
import StepStudentParticulars from "@/components/register/StepStudentParticulars";
import StepResultsLocationHealth from "@/components/register/StepResultsLocationHealth";
import StepParentGuardian from "@/components/register/StepParentGuardian";
import StepQualificationDeclaration from "@/components/register/StepQualificationDeclaration";
import StepLawyerForm from "@/components/register/StepLawyerForm";

const TOTAL_STEPS = 5;

const stepLabels = [
  "Student Particulars",
  "Results, Location & Health",
  "Parent / Guardian",
  "Qualification & Declaration",
  "Legal Forms",
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
  const [submittedAppId, setSubmittedAppId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  // Payment code gate
  const [paymentCode, setPaymentCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Backdate
  const [backdateValue, setBackdateValue] = useState("");

  // Lawyer form state
  const [lawyerResponses, setLawyerResponses] = useState<Record<string, Record<string, any>>>({});
  const [lawyerSignatureUrl, setLawyerSignatureUrl] = useState("");

  // Admission lock & skip payment code
  const [admissionLocked, setAdmissionLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);
  const [skipPaymentCode, setSkipPaymentCode] = useState(false);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  // Check admission lock and skip_payment_code
  useEffect(() => {
    const checkSettings = async () => {
      const [lockRes, skipRes] = await Promise.all([
        supabase.from("app_settings").select("value").eq("key", "admission_lock").maybeSingle(),
        supabase.from("app_settings").select("value").eq("key", "skip_payment_code").maybeSingle(),
      ]);
      if (lockRes.data) {
        const val = lockRes.data.value as { locked?: boolean };
        setAdmissionLocked(val?.locked ?? false);
      }
      if (skipRes.data) {
        const val = skipRes.data.value as { enabled?: boolean };
        const enabled = val?.enabled ?? false;
        setSkipPaymentCode(enabled);
        if (enabled) setCodeVerified(true);
      }
      setCheckingLock(false);
    };
    checkSettings();
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
      case 1: return !!(form.studentName && form.dateOfBirth && form.gender);
      case 2: return !!(form.district);
      case 3: return true;
      case 4: return form.declarationConsent;
      case 5: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    if (!form.declarationConsent) { toast.error("Please accept the declaration"); return; }

    setLoading(true);

    // Map father/mother details to legacy parent fields
    const parentName = form.fatherDetails.name || form.motherDetails.name || form.guardianDetails.name || "";
    const parentPhone = form.fatherDetails.telephone || form.motherDetails.telephone || form.guardianDetails.contact || "";

    const insertData: any = {
      user_id: user.id,
      student_name: form.studentName,
      date_of_birth: form.dateOfBirth || null,
      gender: form.gender,
      nationality: form.nationality,
      religion: form.religion,
      tribe: form.tribe,
      nin: form.nin,
      passport_photo_url: form.passportPhotoUrl,
      district: form.district,
      sub_county: form.subCounty,
      parish: form.parish,
      village: form.village,
      education_level: (form.educationLevel || "primary") as EducationLevel,
      school_id: selectedSchool?.id || null,
      current_school: form.currentSchool,
      class_grade: form.classGrade,
      subject_combination: form.subjectCombination,
      course_program: form.courseProgram,
      previous_schools: form.previousSchools,
      academic_results: form.academicResults,
      subject_grades: form.subjectGrades,
      orphan_status: form.orphanStatus,
      deceased_parent: form.deceasedParent,
      physical_defect: form.physicalDefect,
      physical_defect_details: form.physicalDefectDetails,
      chronic_disease: form.chronicDisease,
      chronic_disease_details: form.chronicDiseaseDetails,
      father_details: form.fatherDetails,
      mother_details: form.motherDetails,
      who_pays_fees: form.whoPaysFees,
      guardian_details: form.guardianDetails,
      next_of_kin: form.nextOfKin,
      nearby_relative: form.nearbyRelative,
      nearest_neighbor: form.nearestNeighbor,
      lci_chairperson: form.lciChairperson,
      lci_contact: form.lciContact,
      previous_fees_amount: form.previousFeesAmount,
      affordable_fees_amount: form.affordableFeesAmount,
      parent_name: parentName || "N/A",
      parent_phone: parentPhone || "N/A",
      reason: form.reason,
      report_card_url: form.reportCardUrl,
      birth_certificate_url: form.birthCertificateUrl,
      parent_id_url: form.parentIdUrl,
      admission_letter_url: form.admissionLetterUrl,
      declaration_consent: form.declarationConsent,
      declaration_date: form.declarationDate || null,
      parent_passport_photo_url: form.parentPassportPhotoUrl,
      student_signature_url: form.studentSignatureUrl,
      parent_signature_url: form.parentSignatureUrl,
      vulnerability_indicators: form.orphanStatus === "yes" ? ["orphan_" + (form.deceasedParent || "single")] : [],
    };

    // If a backdate is set, override created_at
    if (backdateValue) {
      insertData.created_at = new Date(backdateValue).toISOString();
    }

    const { data: appData, error } = await supabase.from("applications").insert(insertData).select("id").single();

    // Log backdate audit if backdated
    if (!error && appData?.id && backdateValue) {
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "backdate_application_create",
        table_name: "applications",
        record_id: appData.id,
        details: {
          backdated_to: new Date(backdateValue).toISOString(),
          actual_created_at: new Date().toISOString(),
          student_name: form.studentName || "",
        },
      } as any);
    }

    setLoading(false);
    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      if (appData?.id && codeVerified && paymentCode && !skipPaymentCode) {
        const verifiedCode = await supabase
          .from("payment_codes")
          .select("id")
          .eq("code", paymentCode.trim().toUpperCase())
          .eq("is_used", true)
          .maybeSingle();

        if (verifiedCode.data) {
          await supabase
            .from("payment_codes")
            .update({ application_id: appData.id } as any)
            .eq("id", verifiedCode.data.id);

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
      // Save lawyer form submissions
      if (appData?.id) {
        const { data: templates } = await supabase
          .from("lawyer_form_templates")
          .select("id")
          .eq("is_active", true);

        if (templates && templates.length > 0) {
          for (const tmpl of templates) {
            const templateResponses = lawyerResponses[tmpl.id] || {};
            await supabase.from("lawyer_form_submissions").insert({
              template_id: tmpl.id,
              application_id: appData.id,
              user_id: user.id,
              responses: templateResponses as any,
              signed_document_url: lawyerSignatureUrl,
              status: "submitted",
              submitted_at: new Date().toISOString(),
            } as any);
          }
        }
      }

      setSubmittedAppId(appData?.id || "");
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Bursary Application Form</title>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
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
            <div className="flex flex-col gap-3">
              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer size={18} /> Print Application Form
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Hidden printable form */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <PrintableApplicationForm
            ref={printRef}
            form={form}
            applicationId={submittedAppId}
            passportPhotoUrl={form.passportPhotoUrl}
          />
        </div>
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
              <div className="mt-2 bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-center">
                <p className="text-destructive font-semibold text-sm mb-1">⚠️ Beware of Fake Programs</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Nyunga Foundation does <strong className="text-foreground">NOT</strong> conduct camps or collect payments outside our office. All fees are paid <strong className="text-foreground">only at our official office</strong>.
                </p>
                <a href="tel:0746960654" className="text-primary font-bold text-sm mt-2 inline-block">📞 0746 960654</a>
              </div>
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
          <h1 className="font-display text-2xl md:text-3xl font-bold text-primary mb-1">
            BURSARY APPLICATION FORM
          </h1>
          <p className="text-muted-foreground text-sm">
            Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}
          </p>

          {/* Progress bar */}
          <div className="flex gap-1 max-w-md mx-auto mt-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i + 1)}
                title={stepLabels[i]}
                className={`h-2.5 flex-1 rounded-full transition-colors cursor-pointer hover:opacity-80 ${
                  i < step ? "bg-secondary" : i === step - 1 ? "bg-secondary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-1 text-[10px] text-muted-foreground">
            {stepLabels.map((l, i) => (
              <span key={i} className={`${i === step - 1 ? "text-secondary font-medium" : ""}`}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        {/* Backdate option (staff use) */}
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="py-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock size={16} />
              <span className="font-medium">Backdate Application</span>
            </div>
            <Input
              type="date"
              value={backdateValue}
              onChange={(e) => setBackdateValue(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-auto"
              placeholder="Leave blank for today"
            />
            {backdateValue && (
              <Badge variant="secondary" className="text-xs">
                Will be recorded as: {new Date(backdateValue).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </Badge>
            )}
            {backdateValue && (
              <Button variant="ghost" size="sm" onClick={() => setBackdateValue("")} className="text-xs h-7">
                Clear
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Step content */}
        <div className="space-y-6">
          {step === 1 && <StepStudentParticulars form={form} update={update} userId={user?.id || ""} />}
          {step === 2 && <StepResultsLocationHealth form={form} update={update} />}
          {step === 3 && <StepParentGuardian form={form} update={update} userId={user?.id || ""} />}
          {step === 4 && (
            <StepQualificationDeclaration
              form={form}
              update={update}
              schools={schools}
              selectedSchool={selectedSchool}
              setSelectedSchool={setSelectedSchool}
              userId={user?.id || ""}
            />
          )}
          {step === 5 && (
            <StepLawyerForm
              userId={user?.id || ""}
              responses={lawyerResponses}
              setResponses={setLawyerResponses}
              lawyerSignatureUrl={lawyerSignatureUrl}
              setLawyerSignatureUrl={setLawyerSignatureUrl}
            />
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
                <ArrowLeft size={18} /> Back
              </Button>
            )}
            <div className="flex-1" />
            {step < TOTAL_STEPS ? (
              <div className="flex gap-2">
                {!canProceed() && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(step + 1)}
                    className="text-muted-foreground text-sm"
                  >
                    Skip
                  </Button>
                )}
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
                >
                  Next <ArrowRight size={18} />
                </Button>
              </div>
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
