import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Upload, CheckCircle, Loader2 } from "lucide-react";
import FileUpload from "@/components/register/FileUpload";

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

interface Submission {
  id: string;
  template_id: string;
  application_id: string;
  responses: Record<string, any>;
  signed_document_url: string;
  status: string;
  submitted_at: string | null;
  admin_notes: string;
  created_at: string;
}

interface Application {
  id: string;
  student_name: string;
}

const ParentLawyerForms = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [fillDialog, setFillDialog] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [signedUrl, setSignedUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [tRes, sRes, aRes] = await Promise.all([
      supabase.from("lawyer_form_templates").select("*").eq("is_active", true),
      supabase.from("lawyer_form_submissions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("applications").select("id, student_name").eq("user_id", user.id).eq("status", "approved"),
    ]);
    setTemplates((tRes.data as unknown as FormTemplate[]) || []);
    setSubmissions((sRes.data as unknown as Submission[]) || []);
    setApplications((aRes.data as unknown as Application[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const openFillForm = (t: FormTemplate) => {
    setActiveTemplate(t);
    setResponses({});
    setSignedUrl("");
    setSelectedAppId(applications.length === 1 ? applications[0].id : "");
    setFillDialog(true);
  };

  const updateResponse = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const getLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve("Geolocation not supported"); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => resolve("Location denied"),
        { timeout: 5000 }
      );
    });
  };

  const submitForm = async () => {
    if (!activeTemplate || !user || !selectedAppId) {
      toast.error("Please select a student");
      return;
    }

    for (const field of activeTemplate.fields) {
      if (field.required && !responses[field.id]) {
        toast.error(`"${field.label}" is required`);
        return;
      }
    }

    setSubmitting(true);
    const filledFromLocation = await getLocation();

    const existing = submissions.find(s => s.template_id === activeTemplate.id && s.application_id === selectedAppId);

    if (existing && existing.status === "draft") {
      const { error } = await supabase.from("lawyer_form_submissions").update({
        responses: responses as any,
        signed_document_url: signedUrl,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        filled_from_location: filledFromLocation,
      } as any).eq("id", existing.id);
      if (error) toast.error(error.message);
      else { toast.success("Form submitted successfully"); setFillDialog(false); fetchData(); }
    } else if (!existing) {
      const { error } = await supabase.from("lawyer_form_submissions").insert({
        template_id: activeTemplate.id,
        application_id: selectedAppId,
        user_id: user.id,
        responses: responses as any,
        signed_document_url: signedUrl,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        filled_from_location: filledFromLocation,
      } as any);
      if (error) toast.error(error.message);
      else { toast.success("Form submitted successfully"); setFillDialog(false); fetchData(); }
    } else {
      toast.error("You've already submitted this form for this student");
    }

    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge variant="default">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "submitted": return <Badge variant="secondary">Pending Review</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (loading) return null;
  if (templates.length === 0 && submissions.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-semibold text-primary">Legal Forms</h2>
      <p className="text-sm text-muted-foreground">Complete the required legal forms for your sponsored student(s).</p>

      {/* Available forms to fill */}
      {templates.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map(t => {
            const filled = submissions.filter(s => s.template_id === t.id);
            const allFilled = applications.length > 0 && applications.every(app =>
              filled.some(s => s.application_id === app.id && s.status !== "draft")
            );
            return (
              <Card key={t.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{t.title}</h3>
                      {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    </div>
                    <FileText size={18} className="text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{t.fields.length} fields to complete</p>
                  {allFilled ? (
                    <div className="flex items-center gap-1 text-xs text-accent">
                      <CheckCircle size={14} /> All students completed
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => openFillForm(t)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      Fill Form
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Past submissions */}
      {submissions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Your Submissions</h3>
          {submissions.map(sub => {
            const tmpl = templates.find(t => t.id === sub.template_id);
            const app = applications.find(a => a.id === sub.application_id);
            return (
              <Card key={sub.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{tmpl?.title || "Form"}</p>
                    <p className="text-xs text-muted-foreground">{app?.student_name || "Student"} • {new Date(sub.created_at).toLocaleDateString()}</p>
                    {sub.admin_notes && <p className="text-xs text-muted-foreground mt-1">Note: {sub.admin_notes}</p>}
                  </div>
                  {getStatusBadge(sub.status)}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fill Form Dialog */}
      <Dialog open={fillDialog} onOpenChange={setFillDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{activeTemplate?.title}</DialogTitle>
          </DialogHeader>
          {activeTemplate && (
            <div className="space-y-4 mt-2">
              {activeTemplate.description && (
                <p className="text-sm text-muted-foreground">{activeTemplate.description}</p>
              )}

              {applications.length > 1 && (
                <div className="space-y-2">
                  <Label>Select Student *</Label>
                  <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                    <SelectTrigger><SelectValue placeholder="Choose student..." /></SelectTrigger>
                    <SelectContent>
                      {applications.map(a => <SelectItem key={a.id} value={a.id}>{a.student_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {activeTemplate.fields.map(field => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-sm">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {field.type === "text" && (
                    <Input
                      value={responses[field.id] || ""}
                      onChange={e => updateResponse(field.id, e.target.value)}
                      placeholder={field.placeholder || ""}
                    />
                  )}
                  {field.type === "textarea" && (
                    <Textarea
                      rows={3}
                      value={responses[field.id] || ""}
                      onChange={e => updateResponse(field.id, e.target.value)}
                      placeholder={field.placeholder || ""}
                    />
                  )}
                  {field.type === "date" && (
                    <Input
                      type="date"
                      value={responses[field.id] || ""}
                      onChange={e => updateResponse(field.id, e.target.value)}
                    />
                  )}
                  {field.type === "select" && (
                    <Select value={responses[field.id] || ""} onValueChange={v => updateResponse(field.id, v)}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {field.type === "checkbox" && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!!responses[field.id]}
                        onCheckedChange={v => updateResponse(field.id, v)}
                      />
                      <span className="text-sm text-muted-foreground">I agree</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Upload signed document */}
              <div className="border-t border-border pt-4">
                <Label className="text-sm mb-2 block">Upload Signed Document (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">If you have a physically signed copy, upload it here.</p>
                {user && (
                  <FileUpload
                    userId={user.id}
                    folder="lawyer-forms"
                    label="Signed Document"
                    value={signedUrl}
                    onChange={setSignedUrl}
                  />
                )}
              </div>

              <Button onClick={submitForm} disabled={submitting} className="w-full bg-primary text-primary-foreground">
                {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Submitting...</> : "Submit Form"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentLawyerForms;
