import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApplicationForm } from "./types";
import SignaturePad from "./SignaturePad";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  userId: string;
}

const StepDeclaration = ({ form, update, userId }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-xl">Declaration & Consent</CardTitle>
      <CardDescription>Please read, sign and confirm the following before submitting</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm text-foreground">
        <p>By submitting this application, I declare that:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>All information provided in this application is <strong>true and accurate</strong> to the best of my knowledge.</li>
          <li>The Nyunga Foundation scholarship committee may <strong>verify any information</strong> provided.</li>
          <li>I consent to the <strong>storage and processing</strong> of the data provided for scholarship administration purposes.</li>
          <li>If the student is a minor, I am signing on behalf of the student as their parent or legal guardian.</li>
        </ul>
      </div>

      {/* Signatures */}
      <div className="grid sm:grid-cols-2 gap-6">
        <SignaturePad
          label="Student"
          userId={userId}
          value={form.studentSignatureUrl}
          onChange={(url) => update("studentSignatureUrl", url)}
        />
        <SignaturePad
          label="Parent/Guardian"
          userId={userId}
          value={form.parentSignatureUrl}
          onChange={(url) => update("parentSignatureUrl", url)}
        />
      </div>

      <div className="flex items-start gap-3 pt-2">
        <Checkbox
          id="declarationConsent"
          checked={form.declarationConsent}
          onCheckedChange={(checked) => {
            update("declarationConsent", !!checked);
            if (checked) update("declarationDate", new Date().toISOString().split("T")[0]);
          }}
        />
        <Label htmlFor="declarationConsent" className="text-sm leading-relaxed">
          I agree to the above declaration and give my consent *
        </Label>
      </div>
      {form.declarationDate && (
        <p className="text-xs text-muted-foreground">Signed on: {form.declarationDate}</p>
      )}
    </CardContent>
  </Card>
);

export default StepDeclaration;
