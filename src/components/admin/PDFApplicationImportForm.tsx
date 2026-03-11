import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";
import LocationSelector from "@/components/register/LocationSelector";

export interface PDFImportFormData {
  studentName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  religion: string;
  tribe: string;
  nin: string;
  registrationNumber: string;
  educationLevel: string;
  classGrade: string;
  currentSchool: string;
  schoolType: string;
  institutionName: string;
  yearOfStudy: string;
  courseProgram: string;
  subjectCombination: string;
  district: string;
  subCounty: string;
  parish: string;
  village: string;
  lciChairperson: string;
  lciContact: string;
  orphanStatus: string;
  deceasedParent: string;
  physicalDefect: boolean;
  physicalDefectDetails: string;
  chronicDisease: boolean;
  chronicDiseaseDetails: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: string;
  parentOccupation: string;
  parentMonthlyIncome: string;
  parentNin: string;
  childrenInSchool: number;
  feesPerTerm: number;
  outstandingBalances: number;
  previousBursary: boolean;
  personalStatement: string;
  reason: string;
}

export const emptyFormData: PDFImportFormData = {
  studentName: "", dateOfBirth: "", gender: "", nationality: "Ugandan",
  religion: "", tribe: "", nin: "", registrationNumber: "",
  educationLevel: "primary", classGrade: "", currentSchool: "", schoolType: "",
  institutionName: "", yearOfStudy: "", courseProgram: "", subjectCombination: "",
  district: "", subCounty: "", parish: "", village: "",
  lciChairperson: "", lciContact: "", orphanStatus: "no", deceasedParent: "",
  physicalDefect: false, physicalDefectDetails: "",
  chronicDisease: false, chronicDiseaseDetails: "",
  parentName: "", parentPhone: "", parentEmail: "", relationship: "parent",
  parentOccupation: "", parentMonthlyIncome: "", parentNin: "",
  childrenInSchool: 1, feesPerTerm: 0, outstandingBalances: 0,
  previousBursary: false, personalStatement: "", reason: "",
};

interface Props {
  form: PDFImportFormData;
  onChange: (field: keyof PDFImportFormData, value: any) => void;
  onSubmit: () => void;
  saving: boolean;
  hasPdf: boolean;
}

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-foreground">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
  </div>
);

const PDFApplicationImportForm = ({ form, onChange, onSubmit, saving, hasPdf }: Props) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Application Details</h2>
          <Button onClick={onSubmit} disabled={saving || !form.studentName || !hasPdf} size="sm" className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Application"}
          </Button>
        </div>

        {/* Student Particulars */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-primary">Student Particulars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <Input value={form.studentName} onChange={(e) => onChange("studentName", e.target.value)} placeholder="As on school records" className="h-8 text-sm" />
              </Field>
              <Field label="Registration / App No.">
                <Input value={form.registrationNumber} onChange={(e) => onChange("registrationNumber", e.target.value)} placeholder="e.g. 20176" className="h-8 text-sm" />
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.dateOfBirth} onChange={(e) => onChange("dateOfBirth", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Gender" required>
                <Select value={form.gender} onValueChange={(v) => onChange("gender", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Nationality">
                <Select value={form.nationality} onValueChange={(v) => onChange("nationality", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ugandan">Ugandan</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Religion">
                <Input value={form.religion} onChange={(e) => onChange("religion", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Tribe">
                <Input value={form.tribe} onChange={(e) => onChange("tribe", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="NIN">
                <Input value={form.nin} onChange={(e) => onChange("nin", e.target.value.toUpperCase())} maxLength={14} className="h-8 text-sm" />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-primary">Education</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Education Level" required>
                <Select value={form.educationLevel} onValueChange={(v) => onChange("educationLevel", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nursery">ECD (Nursery)</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary_o">Secondary (O-Level)</SelectItem>
                    <SelectItem value="secondary_a">Secondary (A-Level)</SelectItem>
                    <SelectItem value="vocational">Vocational</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Class / Grade">
                <Input value={form.classGrade} onChange={(e) => onChange("classGrade", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Current School">
                <Input value={form.currentSchool} onChange={(e) => onChange("currentSchool", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="School Type">
                <Select value={form.schoolType} onValueChange={(v) => onChange("schoolType", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="boarding">Boarding</SelectItem>
                    <SelectItem value="day_boarding">Day & Boarding</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Institution Name">
                <Input value={form.institutionName} onChange={(e) => onChange("institutionName", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Year of Study">
                <Input value={form.yearOfStudy} onChange={(e) => onChange("yearOfStudy", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Course / Program">
                <Input value={form.courseProgram} onChange={(e) => onChange("courseProgram", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Subject Combination">
                <Input value={form.subjectCombination} onChange={(e) => onChange("subjectCombination", e.target.value)} className="h-8 text-sm" />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-primary">Home Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <LocationSelector
              district={form.district}
              subCounty={form.subCounty}
              parish={form.parish}
              village={form.village}
              onDistrictChange={(v) => onChange("district", v)}
              onSubCountyChange={(v) => onChange("subCounty", v)}
              onParishChange={(v) => onChange("parish", v)}
              onVillageChange={(v) => onChange("village", v)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="LC1 Chairperson">
                <Input value={form.lciChairperson} onChange={(e) => onChange("lciChairperson", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="LC1 Contact">
                <Input value={form.lciContact} onChange={(e) => onChange("lciContact", e.target.value)} className="h-8 text-sm" />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Health & Vulnerability */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-primary">Health & Vulnerability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Orphan Status">
                <Select value={form.orphanStatus} onValueChange={(v) => onChange("orphanStatus", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Not an orphan</SelectItem>
                    <SelectItem value="single">Single orphan</SelectItem>
                    <SelectItem value="double">Double orphan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.orphanStatus !== "no" && (
                <Field label="Deceased Parent">
                  <Input value={form.deceasedParent} onChange={(e) => onChange("deceasedParent", e.target.value)} className="h-8 text-sm" />
                </Field>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.physicalDefect} onCheckedChange={(c) => onChange("physicalDefect", !!c)} id="pd" />
                <Label htmlFor="pd" className="text-xs">Physical defect</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.chronicDisease} onCheckedChange={(c) => onChange("chronicDisease", !!c)} id="cd" />
                <Label htmlFor="cd" className="text-xs">Chronic disease</Label>
              </div>
            </div>
            {form.physicalDefect && (
              <Input value={form.physicalDefectDetails} onChange={(e) => onChange("physicalDefectDetails", e.target.value)} placeholder="Describe physical defect..." className="h-8 text-sm" />
            )}
            {form.chronicDisease && (
              <Input value={form.chronicDiseaseDetails} onChange={(e) => onChange("chronicDiseaseDetails", e.target.value)} placeholder="Describe chronic disease..." className="h-8 text-sm" />
            )}
          </CardContent>
        </Card>

        {/* Parent / Guardian */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-primary">Parent / Guardian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Parent/Guardian Name" required>
                <Input value={form.parentName} onChange={(e) => onChange("parentName", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Phone" required>
                <Input value={form.parentPhone} onChange={(e) => onChange("parentPhone", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Email">
                <Input value={form.parentEmail} onChange={(e) => onChange("parentEmail", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Relationship">
                <Select value={form.relationship} onValueChange={(v) => onChange("relationship", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Occupation">
                <Input value={form.parentOccupation} onChange={(e) => onChange("parentOccupation", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Monthly Income">
                <Input value={form.parentMonthlyIncome} onChange={(e) => onChange("parentMonthlyIncome", e.target.value)} className="h-8 text-sm" />
              </Field>
              <Field label="Parent NIN">
                <Input value={form.parentNin} onChange={(e) => onChange("parentNin", e.target.value.toUpperCase())} maxLength={14} className="h-8 text-sm" />
              </Field>
              <Field label="Children in School">
                <Input type="number" value={form.childrenInSchool} onChange={(e) => onChange("childrenInSchool", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-primary">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fees per Term (UGX)">
                <Input type="number" value={form.feesPerTerm} onChange={(e) => onChange("feesPerTerm", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
              </Field>
              <Field label="Outstanding Balances">
                <Input type="number" value={form.outstandingBalances} onChange={(e) => onChange("outstandingBalances", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.previousBursary} onCheckedChange={(c) => onChange("previousBursary", !!c)} id="pb" />
              <Label htmlFor="pb" className="text-xs">Previously received bursary</Label>
            </div>
          </CardContent>
        </Card>

        {/* Reason / Statement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-primary">Reason & Statement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Reason for Applying">
              <Textarea value={form.reason} onChange={(e) => onChange("reason", e.target.value)} rows={2} className="text-sm" />
            </Field>
            <Field label="Personal Statement">
              <Textarea value={form.personalStatement} onChange={(e) => onChange("personalStatement", e.target.value)} rows={3} className="text-sm" />
            </Field>
          </CardContent>
        </Card>

        <Separator />

        <Button onClick={onSubmit} disabled={saving || !form.studentName || !hasPdf} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving Application..." : "Save Application"}
        </Button>
      </div>
    </ScrollArea>
  );
};

export default PDFApplicationImportForm;
