import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Stamp, PlusCircle, Loader2, CheckCircle, Printer } from "lucide-react";
import SignaturePad from "@/components/register/SignaturePad";
import PrintableLawyerForm, { generateFullDocumentHTML } from "./PrintableLawyerForm";
import lawyerStampImg from "@/assets/lawyer-stamp.png";
import { toast } from "sonner";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "checkbox";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormTemplate {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  is_active: boolean;
}

interface LawyerFormSubmission {
  id: string;
  application_id: string;
  template_id: string;
  responses: Record<string, any>;
  status: string;
  submitted_at: string | null;
  signed_document_url: string | null;
  created_at: string;
}

interface Props {
  applicationId: string;
  userId: string;
  submissions: LawyerFormSubmission[];
  templates: FormTemplate[];
  onRefresh: () => void;
}

const LawyerFormsTab = ({ applicationId, userId, submissions, templates, onRefresh }: Props) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [signatureUrl, setSignatureUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitBoth, setSubmitBoth] = useState(true);
  const [manualAppNumber, setManualAppNumber] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  // All active templates available for (re)submission by admin
  const availableTemplates = templates.filter((t) => t.is_active);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const updateResponse = (fieldId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePrint = (sub: LawyerFormSubmission) => {
    const tpl = templates.find((t) => t.id === sub.template_id);
    if (!tpl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print");
      return;
    }

    const formResponses = (sub.responses || {}) as Record<string, any>;
    const submittedDate = sub.submitted_at || sub.created_at;
    const fullDoc = generateFullDocumentHTML(tpl.id, formResponses, sub.signed_document_url || null, submittedDate);

    if (fullDoc) {
      printWindow.document.write(`
        <!DOCTYPE html><html><head><title>${tpl.title} - Print</title>
        <style>
          @media print { @page { size: A4; margin: 15mm; } body { margin: 0; } }
          body { margin: 0; padding: 0; }
        </style></head><body>${fullDoc}</body></html>
      `);
    } else {
      // Fallback for unknown templates
      const fields = (tpl.fields || []) as FormField[];
      printWindow.document.write(`
        <!DOCTYPE html><html><head><title>${tpl.title} - Print</title>
        <style>
          @media print { @page { size: A4; margin: 15mm; } body { margin: 0; } }
          body { font-family: "Times New Roman", serif; color: #000; background: #fff; padding: 40px 50px; max-width: 210mm; margin: 0 auto; }
          .field { margin-bottom: 12px; font-size: 11px; }
          .field-label { font-weight: bold; }
          .field-value { border-bottom: 1px dotted #000; padding-bottom: 1px; min-width: 200px; display: inline-block; }
        </style></head><body>
        <h2 style="text-align:center">${tpl.title}</h2>
        ${fields.map((f: FormField) => `<div class="field"><span class="field-label">${f.label}: </span><span class="field-value">${formResponses[f.id] || "______"}</span></div>`).join("")}
        </body></html>
      `);
    }
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handlePrintAll = () => {
    if (submissions.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print");
      return;
    }

    const pages = submissions.map((sub) => {
      const tpl = templates.find((t) => t.id === sub.template_id);
      if (!tpl) return "";
      const formResponses = (sub.responses || {}) as Record<string, any>;
      const submittedDate = sub.submitted_at || sub.created_at;
      const fullDoc = generateFullDocumentHTML(tpl.id, formResponses, sub.signed_document_url || null, submittedDate);

      if (fullDoc) {
        return `<div class="page">${fullDoc}</div>`;
      }
      return `<div class="page"><h2>${tpl.title}</h2><p>Document content unavailable</p></div>`;
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Legal Forms - Print All</title>
      <style>
        @media print { body { margin: 0; } .page { page-break-after: always; } .page:last-child { page-break-after: auto; } @page { size: A4; margin: 15mm; } }
        body { margin: 0; padding: 0; }
      </style></head><body>${pages.join("")}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleSubmit = async () => {
    if (!selectedTemplateId) return;
    const tpl = selectedTemplate;
    if (!tpl) return;

    // Check required fields
    const missing = (tpl.fields || []).filter(
      (f) => f.required && !responses[f.id]
    );
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setSubmitting(true);

    // Get location for verification
    let locationStr = "";
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      );
      locationStr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
    } catch {
      locationStr = "Location unavailable";
    }

    // If "submit both versions" is checked, submit for all active templates using the same signature
    const templatesToSubmit = submitBoth
      ? availableTemplates.map((t) => t.id)
      : [selectedTemplateId];

    const insertRows = templatesToSubmit.map((tId) => ({
      application_id: applicationId,
      template_id: tId,
      user_id: userId,
      responses: { ...(tId === selectedTemplateId ? responses : {}), application_number: manualAppNumber },
      signed_document_url: signatureUrl || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      filled_from_location: locationStr,
    }));

    const { error } = await supabase.from("lawyer_form_submissions").insert(insertRows as any);

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        submitBoth && templatesToSubmit.length > 1
          ? `${templatesToSubmit.length} legal forms submitted (signature shared across all versions)`
          : "Legal form submitted successfully"
      );
      setShowNewForm(false);
      setSelectedTemplateId("");
      setResponses({});
      setSignatureUrl("");
      setManualAppNumber("");
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* Print all button */}
      {submissions.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrintAll}>
            <Printer size={14} /> Print All Legal Forms
          </Button>
        </div>
      )}

      {/* Existing submissions */}
      {submissions.map((sub) => {
        const tpl = templates.find((t) => t.id === sub.template_id);
        const formResponses = (sub.responses || {}) as Record<string, any>;
        const fields = (tpl?.fields || []) as FormField[];
        return (
          <Card key={sub.id}>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  {tpl?.title || "Legal Form"}
                </h4>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-1 h-7 px-2 text-xs" onClick={() => handlePrint(sub)}>
                    <Printer size={12} /> Print
                  </Button>
                  <Badge variant={sub.status === "submitted" ? "default" : "outline"}>{sub.status}</Badge>
                </div>
              </div>
              {tpl?.description && <p className="text-xs text-muted-foreground">{tpl.description}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {fields.map((field) => (
                  <div key={field.id} className="text-sm">
                    <span className="text-muted-foreground">{field.label}:</span>{" "}
                    <span className="font-medium">
                      {field.type === "checkbox" ? (formResponses[field.id] ? "Yes" : "No") : (formResponses[field.id] || "—")}
                    </span>
                  </div>
                ))}
              </div>
              {sub.signed_document_url && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Signature:</p>
                  <img src={sub.signed_document_url} alt="Signature" className="h-16 border rounded bg-background p-1" />
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Stamp size={16} className="text-primary" />
                  <p className="text-xs font-semibold text-foreground">Certified by Advocate</p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="bg-background border border-border rounded-lg p-2 inline-block">
                    <img src={lawyerStampImg} alt="Advocate Official Stamp" className="h-16 object-contain opacity-90" style={{ transform: "rotate(-5deg)" }} />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p><span className="font-medium text-foreground">Advocate:</span> Lubwama Ezra Tonny</p>
                    <p><span className="font-medium text-foreground">Email:</span> ezratonny85@gmail.com</p>
                    <p><span className="font-medium text-foreground">Submitted:</span> {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" }) : new Date(sub.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* New form section */}
      {!showNewForm ? (
        <div className="text-center space-y-2 py-2">
          {submissions.length === 0 && (
            <p className="text-sm text-muted-foreground">No legal forms submitted for this application.</p>
          )}
          {availableTemplates.length > 0 ? (
            <Button variant="outline" className="gap-2" onClick={() => setShowNewForm(true)}>
              <PlusCircle size={16} /> {submissions.length > 0 ? "Re-submit / Add Legal Form" : "Fill & Sign Legal Form"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">No form templates available. Create templates in the Lawyer Forms admin section first.</p>
          )}
        </div>
      ) : (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <FileText size={18} className="text-primary" /> Fill Legal Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template selector */}
            <div className="space-y-2">
              <Label>Select Form Template</Label>
              <Select value={selectedTemplateId} onValueChange={(v) => { setSelectedTemplateId(v); setResponses({}); }}>
                <SelectTrigger><SelectValue placeholder="Choose a form..." /></SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Application Number - manual entry */}
            <div className="space-y-1">
              <Label className="text-sm">Application Number</Label>
              <Input
                value={manualAppNumber}
                onChange={(e) => setManualAppNumber(e.target.value)}
                placeholder="e.g. NYF-2026-0001"
              />
              <p className="text-xs text-muted-foreground">Enter the application/registration number to appear on the form</p>
            </div>

            {/* Form fields */}
            {selectedTemplate && (
              <>
                {selectedTemplate.description && (
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                )}
                {(selectedTemplate.fields || []).map((field) => (
                  <div key={field.id} className="space-y-1">
                    <Label className="text-sm">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.type === "text" && (
                      <Input
                        value={responses[field.id] || ""}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    )}
                    {field.type === "textarea" && (
                      <Textarea
                        rows={3}
                        value={responses[field.id] || ""}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    )}
                    {field.type === "date" && (
                      <Input
                        type="date"
                        value={responses[field.id] || ""}
                        onChange={(e) => updateResponse(field.id, e.target.value)}
                      />
                    )}
                    {field.type === "select" && (
                      <Select
                        value={responses[field.id] || ""}
                        onValueChange={(v) => updateResponse(field.id, v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {(field.options || []).map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === "checkbox" && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={!!responses[field.id]}
                          onCheckedChange={(v) => updateResponse(field.id, v)}
                        />
                        <span className="text-sm text-muted-foreground">I agree</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Submit both versions option */}
                {availableTemplates.length > 1 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <Checkbox
                      checked={submitBoth}
                      onCheckedChange={(v) => setSubmitBoth(!!v)}
                    />
                    <div>
                      <p className="text-sm font-medium">Submit both English & Luganda versions</p>
                      <p className="text-xs text-muted-foreground">The same signature will be applied to all form versions automatically.</p>
                    </div>
                  </div>
                )}

                {/* Signature */}
                <div className="border-t border-border pt-4 mt-4">
                  <Label className="text-sm font-semibold mb-2 block">Parent / Applicant Signature</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    By signing below, you confirm that you have read, understood, and agree to the terms in this legal form.
                    {submitBoth && availableTemplates.length > 1 && (
                      <span className="font-medium text-primary"> This signature will be used on all form versions.</span>
                    )}
                  </p>
                  <SignaturePad
                    label="Applicant / Parent"
                    userId={userId}
                    value={signatureUrl}
                    onChange={setSignatureUrl}
                  />
                </div>

                {/* Stamp preview after signing */}
                {signatureUrl && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Stamp size={16} className="text-primary" />
                      <p className="text-xs font-semibold text-foreground">Advocate stamp will be applied</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="bg-background border border-border rounded-lg p-2 inline-block">
                        <img src={lawyerStampImg} alt="Advocate Official Stamp" className="h-14 object-contain opacity-90" style={{ transform: "rotate(-5deg)" }} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p><span className="font-medium text-foreground">Advocate:</span> Lubwama Ezra Tonny</p>
                        <p><span className="font-medium text-foreground">Date:</span> {new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {submitBoth && availableTemplates.length > 1 ? "Submit All Versions" : "Submit Legal Form"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowNewForm(false); setSelectedTemplateId(""); setResponses({}); setSignatureUrl(""); }}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LawyerFormsTab;
