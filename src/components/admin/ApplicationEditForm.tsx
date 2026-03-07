import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import type { FullApplication } from "./ApplicationFullDetail";

interface Props {
  app: FullApplication;
  onSaved: () => void;
  onCancel: () => void;
}

const ApplicationEditForm = ({ app, onSaved, onCancel }: Props) => {
  const [form, setForm] = useState({ ...app });
  const [saving, setSaving] = useState(false);

  const u = (field: string, value: any) => setForm((p: any) => ({ ...p, [field]: value }));
  const uNested = (parent: string, field: string, value: any) =>
    setForm((p: any) => ({ ...p, [parent]: { ...(p[parent] || {}), [field]: value } }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("applications")
      .update({
        student_name: form.student_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        religion: form.religion,
        nationality: form.nationality,
        tribe: form.tribe,
        nin: form.nin,
        education_level: form.education_level as any,
        class_grade: form.class_grade,
        subject_combination: form.subject_combination,
        course_program: form.course_program,
        district: form.district,
        sub_county: form.sub_county,
        parish: form.parish,
        village: form.village,
        lci_chairperson: form.lci_chairperson,
        lci_contact: form.lci_contact,
        orphan_status: form.orphan_status,
        deceased_parent: form.deceased_parent,
        physical_defect: form.physical_defect,
        physical_defect_details: form.physical_defect_details,
        chronic_disease: form.chronic_disease,
        chronic_disease_details: form.chronic_disease_details,
        father_details: form.father_details as any,
        mother_details: form.mother_details as any,
        guardian_details: form.guardian_details as any,
        next_of_kin: form.next_of_kin as any,
        nearby_relative: form.nearby_relative as any,
        nearest_neighbor: form.nearest_neighbor as any,
        who_pays_fees: form.who_pays_fees,
        previous_fees_amount: form.previous_fees_amount,
        affordable_fees_amount: form.affordable_fees_amount,
        parent_name: form.parent_name,
        parent_phone: form.parent_phone,
        parent_email: form.parent_email,
        relationship: form.relationship,
        current_school: form.current_school,
        reason: form.reason,
        admin_notes: form.admin_notes,
        previous_schools: form.previous_schools as any,
        academic_results: form.academic_results as any,
        subject_grades: form.subject_grades as any,
      } as any)
      .eq("id", app.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Application updated successfully");
      onSaved();
    }
  };

  const father = (form.father_details || {}) as any;
  const mother = (form.mother_details || {}) as any;
  const guardian = (form.guardian_details || {}) as any;
  const kin = (form.next_of_kin || {}) as any;

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex justify-end gap-2 sticky top-0 bg-background z-10 pb-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1">
          <X size={14} /> Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Student Particulars */}
      <section className="space-y-3">
        <h4 className="font-semibold text-sm text-primary">1. Student Particulars</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Full Name</Label>
            <Input value={form.student_name} onChange={(e) => u("student_name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date of Birth</Label>
            <Input type="date" value={form.date_of_birth || ""} onChange={(e) => u("date_of_birth", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sex</Label>
            <Select value={form.gender || ""} onValueChange={(v) => u("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Religion</Label>
            <Input value={form.religion || ""} onChange={(e) => u("religion", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nationality</Label>
            <Input value={form.nationality || ""} onChange={(e) => u("nationality", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tribe</Label>
            <Input value={form.tribe || ""} onChange={(e) => u("tribe", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">NIN</Label>
            <Input value={form.nin || ""} onChange={(e) => u("nin", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Education Level</Label>
            <Select value={form.education_level} onValueChange={(v) => u("education_level", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nursery">Nursery</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary_o">O-Level</SelectItem>
                <SelectItem value="secondary_a">A-Level</SelectItem>
                <SelectItem value="vocational">Vocational</SelectItem>
                <SelectItem value="university">University</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Class/Grade</Label>
            <Input value={form.class_grade || ""} onChange={(e) => u("class_grade", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subject Combination</Label>
            <Input value={form.subject_combination || ""} onChange={(e) => u("subject_combination", e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">Course/Program</Label>
            <Input value={form.course_program || ""} onChange={(e) => u("course_program", e.target.value)} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Home Location */}
      <section className="space-y-3">
        <h4 className="font-semibold text-sm text-primary">Home Location</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">District</Label>
            <Input value={form.district || ""} onChange={(e) => u("district", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sub-County</Label>
            <Input value={form.sub_county || ""} onChange={(e) => u("sub_county", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Parish</Label>
            <Input value={form.parish || ""} onChange={(e) => u("parish", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Village</Label>
            <Input value={form.village || ""} onChange={(e) => u("village", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">LCI Chairperson</Label>
            <Input value={form.lci_chairperson || ""} onChange={(e) => u("lci_chairperson", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">LCI Contact</Label>
            <Input value={form.lci_contact || ""} onChange={(e) => u("lci_contact", e.target.value)} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Health & Vulnerability */}
      <section className="space-y-3">
        <h4 className="font-semibold text-sm text-primary">Health & Vulnerability</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Orphan Status</Label>
            <Select value={form.orphan_status || "no"} onValueChange={(v) => u("orphan_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.orphan_status === "yes" && (
            <div className="space-y-1">
              <Label className="text-xs">Deceased Parent</Label>
              <Select value={form.deceased_parent || ""} onValueChange={(v) => u("deceased_parent", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={form.physical_defect || false} onCheckedChange={(v) => u("physical_defect", !!v)} />
            <Label className="text-xs">Physical Defect</Label>
          </div>
          {form.physical_defect && (
            <Input value={form.physical_defect_details || ""} onChange={(e) => u("physical_defect_details", e.target.value)} placeholder="Details..." />
          )}
          <div className="flex items-center gap-2">
            <Checkbox checked={form.chronic_disease || false} onCheckedChange={(v) => u("chronic_disease", !!v)} />
            <Label className="text-xs">Chronic Disease</Label>
          </div>
          {form.chronic_disease && (
            <Input value={form.chronic_disease_details || ""} onChange={(e) => u("chronic_disease_details", e.target.value)} placeholder="Details..." />
          )}
        </div>
      </section>

      <Separator />

      {/* Parent Details */}
      <section className="space-y-3">
        <h4 className="font-semibold text-sm text-primary">2. Parent / Guardian</h4>
        <p className="text-xs font-medium text-muted-foreground">Father</p>
        <div className="grid grid-cols-2 gap-3">
          {["name", "occupation", "nin", "residence", "telephone", "religion", "tribe"].map((f) => (
            <div key={`f_${f}`} className="space-y-1">
              <Label className="text-xs capitalize">{f}</Label>
              <Input value={father[f] || ""} onChange={(e) => uNested("father_details", f, e.target.value)} />
            </div>
          ))}
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-3">Mother</p>
        <div className="grid grid-cols-2 gap-3">
          {["name", "occupation", "nin", "residence", "telephone", "religion", "tribe"].map((f) => (
            <div key={`m_${f}`} className="space-y-1">
              <Label className="text-xs capitalize">{f}</Label>
              <Input value={mother[f] || ""} onChange={(e) => uNested("mother_details", f, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="space-y-1 mt-3">
          <Label className="text-xs">Who Pays Fees</Label>
          <Input value={form.who_pays_fees || ""} onChange={(e) => u("who_pays_fees", e.target.value)} />
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-3">Guardian</p>
        <div className="grid grid-cols-2 gap-3">
          {["name", "relationship", "occupation", "nin", "residence", "placeOfWork", "contact"].map((f) => (
            <div key={`g_${f}`} className="space-y-1">
              <Label className="text-xs capitalize">{f === "placeOfWork" ? "Place of Work" : f}</Label>
              <Input value={guardian[f] || ""} onChange={(e) => uNested("guardian_details", f, e.target.value)} />
            </div>
          ))}
        </div>
        <p className="text-xs font-medium text-muted-foreground mt-3">Next of Kin</p>
        <div className="grid grid-cols-2 gap-3">
          {["name", "relationship", "residence", "telephone"].map((f) => (
            <div key={`k_${f}`} className="space-y-1">
              <Label className="text-xs capitalize">{f}</Label>
              <Input value={kin[f] || ""} onChange={(e) => uNested("next_of_kin", f, e.target.value)} />
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Contact / Financial */}
      <section className="space-y-3">
        <h4 className="font-semibold text-sm text-primary">3. Contact & Financial</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Parent/Guardian Name</Label>
            <Input value={form.parent_name} onChange={(e) => u("parent_name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input value={form.parent_phone} onChange={(e) => u("parent_phone", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input value={form.parent_email || ""} onChange={(e) => u("parent_email", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Relationship</Label>
            <Input value={form.relationship || ""} onChange={(e) => u("relationship", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Previous Fees Paid (UGX)</Label>
            <Input type="number" value={form.previous_fees_amount || 0} onChange={(e) => u("previous_fees_amount", parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Can Afford (UGX)</Label>
            <Input type="number" value={form.affordable_fees_amount || 0} onChange={(e) => u("affordable_fees_amount", parseFloat(e.target.value) || 0)} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Reason & Notes */}
      <section className="space-y-3">
        <h4 className="font-semibold text-sm text-primary">Reason & Admin Notes</h4>
        <div className="space-y-1">
          <Label className="text-xs">Reason for Support</Label>
          <Textarea rows={3} value={form.reason || ""} onChange={(e) => u("reason", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Admin Notes</Label>
          <Textarea rows={3} value={form.admin_notes || ""} onChange={(e) => u("admin_notes", e.target.value)} />
        </div>
      </section>

      {/* Bottom save */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-1">
          <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default ApplicationEditForm;
