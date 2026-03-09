import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Loader2, Stamp } from "lucide-react";
import SignaturePad from "./SignaturePad";
import lawyerStampImg from "@/assets/lawyer-stamp.png";

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
  description: string;
  fields: FormField[];
  is_active: boolean;
}

interface Props {
  userId: string;
  responses: Record<string, Record<string, any>>;
  setResponses: (r: Record<string, Record<string, any>>) => void;
  lawyerSignatureUrl: string;
  setLawyerSignatureUrl: (url: string) => void;
}

const StepLawyerForm = ({ userId, responses, setResponses, lawyerSignatureUrl, setLawyerSignatureUrl }: Props) => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from("lawyer_form_templates")
        .select("*")
        .eq("is_active", true);
      setTemplates((data as unknown as FormTemplate[]) || []);
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  const updateResponse = (templateId: string, fieldId: string, value: any) => {
    setResponses({
      ...responses,
      [templateId]: {
        ...(responses[templateId] || {}),
        [fieldId]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle size={40} className="text-accent mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No legal forms required at this time. You may proceed to submit.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} className="text-primary" />
            <h3 className="font-display font-semibold text-primary">Legal Forms</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Please complete the following legal form(s) and provide your signature before submitting.
          </p>
        </CardContent>
      </Card>

      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              {template.title}
            </CardTitle>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {template.fields.map((field) => (
              <div key={field.id} className="space-y-1">
                <Label className="text-sm">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.type === "text" && (
                  <Input
                    value={responses[template.id]?.[field.id] || ""}
                    onChange={(e) => updateResponse(template.id, field.id, e.target.value)}
                    placeholder={field.placeholder || ""}
                  />
                )}
                {field.type === "textarea" && (
                  <Textarea
                    rows={3}
                    value={responses[template.id]?.[field.id] || ""}
                    onChange={(e) => updateResponse(template.id, field.id, e.target.value)}
                    placeholder={field.placeholder || ""}
                  />
                )}
                {field.type === "date" && (
                  <Input
                    type="date"
                    value={responses[template.id]?.[field.id] || ""}
                    onChange={(e) => updateResponse(template.id, field.id, e.target.value)}
                  />
                )}
                {field.type === "select" && (
                  <Select
                    value={responses[template.id]?.[field.id] || ""}
                    onValueChange={(v) => updateResponse(template.id, field.id, v)}
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
                      checked={!!responses[template.id]?.[field.id]}
                      onCheckedChange={(v) => updateResponse(template.id, field.id, v)}
                    />
                    <span className="text-sm text-muted-foreground">I agree</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Signature for legal forms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Legal Form Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            By signing below, you confirm that you have read, understood, and agree to the terms in all legal forms above.
          </p>
          <SignaturePad
            label="Applicant / Parent"
            userId={userId}
            value={lawyerSignatureUrl}
            onChange={setLawyerSignatureUrl}
          />

          {/* Lawyer stamp - auto-applied after signature */}
          {lawyerSignatureUrl && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Stamp size={18} className="text-primary" />
                <p className="text-sm font-semibold text-foreground">Certified by Advocate</p>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="bg-background border border-border rounded-lg p-3 inline-block">
                  <img
                    src={lawyerStampImg}
                    alt="Advocate Lubwama Ezra Tonny - Official Stamp"
                    className="h-20 object-contain opacity-90"
                    style={{ transform: "rotate(-5deg)" }}
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Advocate:</span> Lubwama Ezra Tonny</p>
                  <p><span className="font-medium text-foreground">Email:</span> ezratonny85@gmail.com</p>
                  <p><span className="font-medium text-foreground">Stamped on:</span> {new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StepLawyerForm;
