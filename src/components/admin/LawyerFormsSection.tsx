import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PlusCircle, Trash2, GripVertical, FileText, Eye, Edit, ToggleLeft, MapPin } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "checkbox";
  required: boolean;
  options?: string[]; // for select type
  placeholder?: string;
}

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  template_id: string;
  application_id: string;
  user_id: string;
  responses: Record<string, any>;
  signed_document_url: string;
  status: string;
  submitted_at: string | null;
  admin_notes: string;
  created_at: string;
  filled_from_location: string | null;
}

interface Application {
  id: string;
  student_name: string;
  parent_name: string;
}

const fieldTypes = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox / Agreement" },
];

const LawyerFormsSection = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [viewSubmissionsDialog, setViewSubmissionsDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Submission[]>([]);

  // Form builder state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    const [tRes, sRes, aRes] = await Promise.all([
      supabase.from("lawyer_form_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("lawyer_form_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("id, student_name, parent_name").eq("status", "approved"),
    ]);
    setTemplates((tRes.data as unknown as FormTemplate[]) || []);
    setSubmissions((sRes.data as unknown as Submission[]) || []);
    setApplications((aRes.data as unknown as Application[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormFields([]);
    setEditingId(null);
  };

  const openNewForm = () => {
    resetForm();
    setEditDialog(true);
  };

  const openEditForm = (t: FormTemplate) => {
    setFormTitle(t.title);
    setFormDescription(t.description);
    setFormFields(t.fields);
    setEditingId(t.id);
    setEditDialog(true);
  };

  const addField = () => {
    setFormFields([...formFields, {
      id: crypto.randomUUID(),
      label: "",
      type: "text",
      required: true,
      placeholder: "",
    }]);
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    const copy = [...formFields];
    copy[idx] = { ...copy[idx], ...updates };
    setFormFields(copy);
  };

  const removeField = (idx: number) => {
    setFormFields(formFields.filter((_, i) => i !== idx));
  };

  const saveTemplate = async () => {
    if (!formTitle.trim()) { toast.error("Enter a form title"); return; }
    if (formFields.length === 0) { toast.error("Add at least one field"); return; }
    if (formFields.some(f => !f.label.trim())) { toast.error("All fields need labels"); return; }

    if (editingId) {
      const { error } = await supabase.from("lawyer_form_templates").update({
        title: formTitle.trim(),
        description: formDescription.trim(),
        fields: formFields as any,
      } as any).eq("id", editingId);
      if (error) toast.error(error.message);
      else { toast.success("Form template updated"); setEditDialog(false); resetForm(); fetchData(); }
    } else {
      const { error } = await supabase.from("lawyer_form_templates").insert({
        title: formTitle.trim(),
        description: formDescription.trim(),
        fields: formFields as any,
      } as any);
      if (error) toast.error(error.message);
      else { toast.success("Form template created"); setEditDialog(false); resetForm(); fetchData(); }
    }
  };

  const toggleActive = async (t: FormTemplate) => {
    const { error } = await supabase.from("lawyer_form_templates").update({ is_active: !t.is_active } as any).eq("id", t.id);
    if (error) toast.error(error.message);
    else { toast.success(t.is_active ? "Form deactivated" : "Form activated"); fetchData(); }
  };

  const viewSubmissions = (t: FormTemplate) => {
    setSelectedTemplate(t);
    setSelectedSubmissions(submissions.filter(s => s.template_id === t.id));
    setViewSubmissionsDialog(true);
  };

  const updateSubmissionStatus = async (subId: string, status: string, notes: string) => {
    const { error } = await supabase.from("lawyer_form_submissions").update({
      status,
      admin_notes: notes,
      reviewed_at: new Date().toISOString(),
    } as any).eq("id", subId);
    if (error) toast.error(error.message);
    else { toast.success("Submission updated"); fetchData(); }
  };

  const getAppName = (appId: string) => applications.find(a => a.id === appId)?.student_name || "Unknown";

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Lawyer Form Templates</h2>
          <p className="text-sm text-muted-foreground">Create legal forms for parents to fill and sign</p>
        </div>
        <Button onClick={openNewForm} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
          <PlusCircle size={18} /> Create Form
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No lawyer forms created yet. Create your first template.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => {
            const subCount = submissions.filter(s => s.template_id === t.id).length;
            const pendingCount = submissions.filter(s => s.template_id === t.id && s.status === "submitted").length;
            return (
              <Card key={t.id} className={!t.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold">{t.title}</CardTitle>
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{t.fields.length} fields</span>
                    <span>{subCount} submissions</span>
                    {pendingCount > 0 && <span className="text-secondary font-medium">{pendingCount} pending review</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditForm(t)} className="gap-1">
                      <Edit size={14} /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => viewSubmissions(t)} className="gap-1">
                      <Eye size={14} /> Submissions
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(t)} className="gap-1">
                      <ToggleLeft size={14} /> {t.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Edit Form Template" : "Create Lawyer Form"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Form Title *</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Parental Consent & Legal Agreement" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief description of the form's purpose..." />
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base">Form Fields</Label>
                <Button size="sm" variant="outline" onClick={addField} className="gap-1">
                  <PlusCircle size={14} /> Add Field
                </Button>
              </div>

              {formFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No fields yet. Click "Add Field" to start building your form.</p>
              )}

              <div className="space-y-3">
                {formFields.map((field, idx) => (
                  <div key={field.id} className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">Field {idx + 1}</span>
                      <div className="flex-1" />
                      <Button size="sm" variant="ghost" onClick={() => removeField(idx)} className="h-7 w-7 p-0 text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Label *</Label>
                        <Input value={field.label} onChange={e => updateField(idx, { label: e.target.value })} placeholder="Field label" className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={field.type} onValueChange={v => updateField(idx, { type: v as any })}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {field.type === "select" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Options (comma-separated)</Label>
                        <Input
                          value={(field.options || []).join(", ")}
                          onChange={e => updateField(idx, { options: e.target.value.split(",").map(o => o.trim()).filter(Boolean) })}
                          placeholder="Option 1, Option 2, Option 3"
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Switch checked={field.required} onCheckedChange={v => updateField(idx, { required: v })} />
                      <Label className="text-xs">Required</Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={saveTemplate} className="w-full bg-primary text-primary-foreground">
              {editingId ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog open={viewSubmissionsDialog} onOpenChange={setViewSubmissionsDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Submissions: {selectedTemplate?.title}</DialogTitle>
          </DialogHeader>
          {selectedSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No submissions yet for this form.</p>
          ) : (
            <div className="space-y-4 mt-2">
              {selectedSubmissions.map(sub => (
                <Card key={sub.id}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{getAppName(sub.application_id)}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.submitted_at ? `Submitted ${new Date(sub.submitted_at).toLocaleDateString()}` : `Draft — ${new Date(sub.created_at).toLocaleDateString()}`}
                        </p>
                        {sub.filled_from_location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-primary" /> Filled from: {sub.filled_from_location}
                          </p>
                        )}
                      </div>
                      <Badge variant={sub.status === "approved" ? "default" : sub.status === "submitted" ? "secondary" : "outline"}>
                        {sub.status}
                      </Badge>
                    </div>

                    {/* Responses */}
                    {selectedTemplate && (
                      <div className="bg-muted/30 rounded-md p-3 space-y-2">
                        {selectedTemplate.fields.map(field => (
                          <div key={field.id} className="text-sm">
                            <span className="font-medium text-muted-foreground">{field.label}: </span>
                            <span className="text-foreground">
                              {field.type === "checkbox"
                                ? (sub.responses[field.id] ? "✓ Agreed" : "✗ Not agreed")
                                : (sub.responses[field.id] || "—")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {sub.signed_document_url && (
                      <a href={sub.signed_document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary underline">
                        View Signed Document
                      </a>
                    )}

                    {sub.status === "submitted" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateSubmissionStatus(sub.id, "approved", "")}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateSubmissionStatus(sub.id, "rejected", "")}>Reject</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LawyerFormsSection;
