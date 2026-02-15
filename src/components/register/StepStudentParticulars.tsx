import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationForm, levelLabels, EducationLevel } from "./types";
import PassportPhotoCapture from "./PassportPhotoCapture";
import { isValidNIN, NIN_HINT } from "./ninValidation";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  userId: string;
}

const StepStudentParticulars = ({ form, update, userId }: Props) => {
  const updatePrevSchool = (field: string, value: string) => {
    update("previousSchools", { ...form.previousSchools, [field]: value });
  };

  const updateAcademic = (field: string, value: string) => {
    update("academicResults", { ...form.academicResults, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">1. PARTICULARS OF APPLICANT (STUDENT)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* a) Basic Info */}
          <p className="text-sm font-semibold text-foreground">a) Personal Information</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.studentName} onChange={(e) => update("studentName", e.target.value)} placeholder="Full name as on school records" />
            </div>
            <div className="space-y-1">
              <Label>Date of Birth *</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Sex *</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Religion</Label>
              <Input value={form.religion} onChange={(e) => update("religion", e.target.value)} placeholder="e.g. Catholic, Muslim, Anglican" />
            </div>
            <div className="space-y-1">
              <Label>Nationality</Label>
              <Select value={form.nationality} onValueChange={(v) => update("nationality", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ugandan">Ugandan</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tribe</Label>
              <Input value={form.tribe} onChange={(e) => update("tribe", e.target.value)} placeholder="e.g. Muganda, Musoga" />
            </div>
            <div className="space-y-1">
              <Label>NIN (if available)</Label>
              <Input value={form.nin} onChange={(e) => update("nin", e.target.value.toUpperCase())} maxLength={14} />
              {form.nin && !isValidNIN(form.nin) && <p className="text-xs text-destructive">{NIN_HINT}</p>}
            </div>
          </div>

          {/* Education Level & Class */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label>Class or Level Applied For *</Label>
              <Select value={form.educationLevel} onValueChange={(v) => update("educationLevel", v as EducationLevel)}>
                <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(levelLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Class / Grade</Label>
              <Input value={form.classGrade} onChange={(e) => update("classGrade", e.target.value)} placeholder="e.g. S.1, P.7, Year 2" />
            </div>
            {form.educationLevel === "secondary_a" && (
              <div className="space-y-1">
                <Label>Subject Combination (A-Level)</Label>
                <Input value={form.subjectCombination} onChange={(e) => update("subjectCombination", e.target.value)} placeholder="e.g. HEG, PCM, BCM" />
              </div>
            )}
            {["university", "vocational"].includes(form.educationLevel) && (
              <div className="space-y-1">
                <Label>Course (University & Higher Institution)</Label>
                <Input value={form.courseProgram} onChange={(e) => update("courseProgram", e.target.value)} placeholder="e.g. Bachelor of Education" />
              </div>
            )}
          </div>

          {/* b) Previous Schools */}
          <p className="text-sm font-semibold text-foreground pt-2">b) Previous School(s) Attended</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">(i) PRIMARY for (PLE)</Label>
              <Input value={form.previousSchools.primaryPle} onChange={(e) => updatePrevSchool("primaryPle", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">(ii) SECONDARY (UCE)</Label>
              <Input value={form.previousSchools.secondaryUce} onChange={(e) => updatePrevSchool("secondaryUce", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">(iii) SECONDARY (UACE)</Label>
              <Input value={form.previousSchools.secondaryUace} onChange={(e) => updatePrevSchool("secondaryUace", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">(iv) UNIVERSITY / INSTITUTE</Label>
              <Input value={form.previousSchools.universityInstitute} onChange={(e) => updatePrevSchool("universityInstitute", e.target.value)} />
            </div>
          </div>

          {/* c) Academic Details */}
          <p className="text-sm font-semibold text-foreground pt-2">c) Academic Details</p>
          
          {/* PLE Results */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">(i) Primary Leaving Examination (PLE) — For S.1, S.2, S.3 & S.4 Entrants</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Input value={form.academicResults.pleYear} onChange={(e) => updateAcademic("pleYear", e.target.value)} placeholder="e.g. 2023" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Index Number</Label>
                <Input value={form.academicResults.pleIndex} onChange={(e) => updateAcademic("pleIndex", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Aggregates</Label>
                <Input value={form.academicResults.pleAggregates} onChange={(e) => updateAcademic("pleAggregates", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Grade</Label>
                <Input value={form.academicResults.pleGrade} onChange={(e) => updateAcademic("pleGrade", e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Results:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">English</Label>
                <Input value={form.academicResults.pleEnglish} onChange={(e) => updateAcademic("pleEnglish", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Math</Label>
                <Input value={form.academicResults.pleMath} onChange={(e) => updateAcademic("pleMath", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SST</Label>
                <Input value={form.academicResults.pleSst} onChange={(e) => updateAcademic("pleSst", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Science</Label>
                <Input value={form.academicResults.pleScience} onChange={(e) => updateAcademic("pleScience", e.target.value)} />
              </div>
            </div>
          </div>

          {/* UCE Results */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">(ii) Uganda Certificate of Education (UCE)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Input value={form.academicResults.uceYear} onChange={(e) => updateAcademic("uceYear", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Index No</Label>
                <Input value={form.academicResults.uceIndex} onChange={(e) => updateAcademic("uceIndex", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Grade</Label>
                <Input value={form.academicResults.uceGrade} onChange={(e) => updateAcademic("uceGrade", e.target.value)} />
              </div>
            </div>
          </div>

          {/* UACE Results */}
          <div className="border rounded-lg p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">(iii) Uganda Advanced Certificate of Education (UACE)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Input value={form.academicResults.uaceYear} onChange={(e) => updateAcademic("uaceYear", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Index No</Label>
                <Input value={form.academicResults.uaceIndex} onChange={(e) => updateAcademic("uaceIndex", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Points</Label>
                <Input value={form.academicResults.uacePoints} onChange={(e) => updateAcademic("uacePoints", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Combination</Label>
                <Input value={form.academicResults.uaceCombination} onChange={(e) => updateAcademic("uaceCombination", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Passport Photos */}
          <PassportPhotoCapture userId={userId} value={form.passportPhotoUrl} onChange={(url) => update("passportPhotoUrl", url)} />
        </CardContent>
      </Card>
    </div>
  );
};

export default StepStudentParticulars;
