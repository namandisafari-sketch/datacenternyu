import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApplicationForm } from "./types";
import FileUpload from "./FileUpload";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  userId: string;
}

const StepDocuments = ({ form, update, userId }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-xl">Document Uploads</CardTitle>
      <CardDescription>Upload supporting documents. Keep file sizes small (max 5MB each).</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid sm:grid-cols-2 gap-4">
        {!form.reportCardUrl && (
          <FileUpload userId={userId} folder="report-card" label="Report Card" value={form.reportCardUrl} onChange={(url) => update("reportCardUrl", url)} />
        )}
        {form.reportCardUrl && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Report Card</p>
            <p className="text-xs text-accent">✓ Already uploaded in School Info step</p>
          </div>
        )}
        <FileUpload userId={userId} folder="birth-certificate" label="Birth Certificate (young learners)" value={form.birthCertificateUrl} onChange={(url) => update("birthCertificateUrl", url)} />
        <FileUpload userId={userId} folder="parent-id" label="National ID (Parent or Student)" value={form.parentIdUrl} onChange={(url) => update("parentIdUrl", url)} />
        {!form.admissionLetterUrl && form.educationLevel && ["university", "vocational"].includes(form.educationLevel) && (
          <FileUpload userId={userId} folder="admission-letter" label="Admission Letter" value={form.admissionLetterUrl} onChange={(url) => update("admissionLetterUrl", url)} />
        )}
        {form.admissionLetterUrl && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Admission Letter</p>
            <p className="text-xs text-accent">✓ Already uploaded</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default StepDocuments;
