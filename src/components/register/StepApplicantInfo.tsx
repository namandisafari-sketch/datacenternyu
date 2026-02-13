import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApplicationForm } from "./types";
import FileUpload from "./FileUpload";
import { isValidNIN, NIN_HINT } from "./ninValidation";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  userId: string;
}

const StepApplicantInfo = ({ form, update, userId }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-xl">Applicant Information</CardTitle>
      <CardDescription>Student's basic details as on school records</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="studentName">Full Name (as on school records) *</Label>
          <Input id="studentName" value={form.studentName} onChange={(e) => update("studentName", e.target.value)} placeholder="e.g. Nakato Grace" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Gender *</Label>
          <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nationality</Label>
          <Select value={form.nationality} onValueChange={(v) => update("nationality", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Ugandan">Ugandan</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nin">NIN (if available)</Label>
          <Input id="nin" value={form.nin} onChange={(e) => update("nin", e.target.value.toUpperCase())} placeholder="e.g. CM1234567ABC1Z" maxLength={14} />
          {form.nin && !isValidNIN(form.nin) && (
            <p className="text-xs text-destructive">{NIN_HINT}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="district">District *</Label>
          <Input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="e.g. Kampala" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subCounty">Sub-county</Label>
          <Input id="subCounty" value={form.subCounty} onChange={(e) => update("subCounty", e.target.value)} placeholder="e.g. Makindye" />
        </div>
      </div>
      <FileUpload userId={userId} folder="passport-photo" label="Passport Photo" accept="image/*" value={form.passportPhotoUrl} onChange={(url) => update("passportPhotoUrl", url)} />
    </CardContent>
  </Card>
);

export default StepApplicantInfo;
