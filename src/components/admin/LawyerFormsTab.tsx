import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Stamp, PlusCircle, Loader2, CheckCircle } from "lucide-react";
import SignaturePad from "@/components/register/SignaturePad";
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

  // Templates not yet submitted for this application
  const availableTemplates = templates.filter(
    (t) => t.is_active && !submissions.some((s) => s.template_id === t.id)
  );

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const updateResponse = (fieldId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
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

    const { error } = await supabase.from("lawyer_form_submissions").insert({
      application_id: applicationId,
      template_id: selectedTemplateId,
      user_id: userId,
      responses,
      signed_document_url: signatureUrl || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      filled_from_location: locationStr,
    } as any);

    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Legal form submitted successfully");
      setShowNewForm(false);
      setSelectedTemplateId("");
      setResponses({});
      setSignatureUrl("");
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
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
                <Badge variant={sub.status === "submitted" ? "default" : "outline"}>{sub.status}</Badge>
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
          {availableTemplates.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => setShowNewForm(true)}>
              <PlusCircle size={16} /> Fill & Sign Legal Form
            </Button>
          )}
          {availableTemplates.length === 0 && submissions.length > 0 && (
            <p className="text-xs text-muted-foreground">All available legal forms have been completed.</p>
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

                {/* Signature */}
                <div className="border-t border-border pt-4 mt-4">
                  <Label className="text-sm font-semibold mb-2 block">Parent / Applicant Signature</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    By signing below, you confirm that you have read, understood, and agree to the terms in this legal form.
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
                    Submit Legal Form
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
