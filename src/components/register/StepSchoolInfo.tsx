import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApplicationForm } from "./types";
import FileUpload from "./FileUpload";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  userId: string;
}

const isEcdPrimary = (level: string) => ["nursery", "primary"].includes(level);
const isSecondary = (level: string) => ["secondary_o", "secondary_a"].includes(level);
const isUniversity = (level: string) => ["university", "vocational"].includes(level);

const StepSchoolInfo = ({ form, update, userId }: Props) => {
  const level = form.educationLevel;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">School Information</CardTitle>
        <CardDescription>Details about the student's current or intended school</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ECD / Primary fields */}
        {isEcdPrimary(level) && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentSchool">School Name *</Label>
              <Input id="currentSchool" value={form.currentSchool} onChange={(e) => update("currentSchool", e.target.value)} placeholder="e.g. Kitante Primary School" />
            </div>
            <div className="space-y-2">
              <Label>School Type</Label>
              <Select value={form.schoolType} onValueChange={(v) => update("schoolType", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classGrade">Class *</Label>
              <Input id="classGrade" value={form.classGrade} onChange={(e) => update("classGrade", e.target.value)} placeholder={level === "nursery" ? "e.g. Baby Class, Middle, Top" : "e.g. P.1 – P.7"} />
            </div>
            <FileUpload userId={userId} folder="report-card" label="Current Report Card" value={form.reportCardUrl} onChange={(url) => update("reportCardUrl", url)} />
          </div>
        )}

        {/* Secondary fields */}
        {isSecondary(level) && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentSchool">School Name *</Label>
              <Input id="currentSchool" value={form.currentSchool} onChange={(e) => update("currentSchool", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classGrade">Class *</Label>
              <Input id="classGrade" value={form.classGrade} onChange={(e) => update("classGrade", e.target.value)} placeholder="e.g. S.1 – S.6" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unebIndexNumber">UNEB Index Number (if candidate)</Label>
              <Input id="unebIndexNumber" value={form.unebIndexNumber} onChange={(e) => update("unebIndexNumber", e.target.value)} />
            </div>
            <FileUpload userId={userId} folder="report-card" label="Latest Report Card" value={form.reportCardUrl} onChange={(url) => update("reportCardUrl", url)} />
          </div>
        )}

        {/* University / Vocational fields */}
        {isUniversity(level) && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institutionName">Institution Name *</Label>
              <Input id="institutionName" value={form.institutionName} onChange={(e) => update("institutionName", e.target.value)} placeholder="e.g. Makerere University" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseProgram">Course / Programme *</Label>
              <Input id="courseProgram" value={form.courseProgram} onChange={(e) => update("courseProgram", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearOfStudy">Year of Study</Label>
              <Input id="yearOfStudy" value={form.yearOfStudy} onChange={(e) => update("yearOfStudy", e.target.value)} placeholder="e.g. Year 2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input id="registrationNumber" value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedGraduationYear">Expected Graduation Year</Label>
              <Input id="expectedGraduationYear" value={form.expectedGraduationYear} onChange={(e) => update("expectedGraduationYear", e.target.value)} placeholder="e.g. 2028" />
            </div>
            <FileUpload userId={userId} folder="admission-letter" label="Admission Letter" value={form.admissionLetterUrl} onChange={(url) => update("admissionLetterUrl", url)} />
            <FileUpload userId={userId} folder="transcript" label="Transcript / Results" value={form.transcriptUrl} onChange={(url) => update("transcriptUrl", url)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StepSchoolInfo;
