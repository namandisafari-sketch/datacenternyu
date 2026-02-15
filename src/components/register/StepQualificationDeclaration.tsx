import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationForm, SchoolRow, formatUGX } from "./types";
import { Badge } from "@/components/ui/badge";
import FileUpload from "./FileUpload";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  schools: SchoolRow[];
  selectedSchool: SchoolRow | null;
  setSelectedSchool: (s: SchoolRow | null) => void;
  userId: string;
}

const StepQualificationDeclaration = ({ form, update, schools, selectedSchool, setSelectedSchool, userId }: Props) => (
  <div className="space-y-6">
    {/* Qualification Info */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">3. QUALIFICATION FOR FULL OR PARTIAL BURSARY ON TUITION FEES</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-semibold">(a) S.1: 4–12 aggregates in PLE — Full Bursary | 13–26 aggregates — Partial Bursary</p>
          <p className="font-semibold">(b) S.5: A' Level; Combination with A's and B's — Full Bursary</p>
          <p className="pl-6">Combination with C's — Partial Bursary</p>
          <p className="font-semibold">(c) S.2, S.3, S.4, S.6 and Primary classes — interview-based:</p>
          <p className="pl-6">71% – 100% → Full Bursary</p>
          <p className="pl-6">36% – 70% → Partial Bursary</p>
          <p className="text-muted-foreground italic mt-2">
            However, bursaries can still be offered to applicants depending on financial challenges, students' talent(s) or to Orphans.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>4 (a) How much have you been paying as fees from your previous school or institution?</Label>
            <Input
              type="number"
              min={0}
              value={form.previousFeesAmount || ""}
              onChange={(e) => update("previousFeesAmount", parseFloat(e.target.value) || 0)}
              placeholder="Amount in UGX"
            />
          </div>
          <div className="space-y-1">
            <Label>(b) In case you do not get a full bursary, how much can you afford to pay as tuition fees?</Label>
            <Input
              type="number"
              min={0}
              value={form.affordableFeesAmount || ""}
              onChange={(e) => update("affordableFeesAmount", parseFloat(e.target.value) || 0)}
              placeholder="Amount in UGX"
            />
          </div>
        </div>

        {/* Reason for bursary */}
        <div className="space-y-1">
          <Label>Reason for the Bursary</Label>
          <Textarea
            value={form.reason}
            onChange={(e) => update("reason", e.target.value)}
            rows={3}
            placeholder="Explain why you need a bursary..."
          />
        </div>
      </CardContent>
    </Card>

    {/* School Selection */}
    {form.educationLevel && schools.length > 0 && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Partner Schools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {schools.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => { setSelectedSchool(school); update("schoolId", school.id); }}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                selectedSchool?.id === school.id
                  ? "border-secondary bg-secondary/5"
                  : "border-border hover:border-secondary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{school.name}</h4>
                  <p className="text-xs text-muted-foreground">{school.district}</p>
                </div>
                {school.boarding_available && <Badge variant="outline" className="text-xs">Boarding</Badge>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded p-1.5">
                  <p className="text-[10px] text-muted-foreground">Full Fees</p>
                  <p className="font-semibold text-xs">{formatUGX(school.full_fees)}</p>
                </div>
                <div className="bg-accent/10 rounded p-1.5">
                  <p className="text-[10px] text-muted-foreground">Nyunga Covers</p>
                  <p className="font-semibold text-xs text-accent">{formatUGX(school.nyunga_covered_fees)}</p>
                </div>
                <div className="bg-secondary/10 rounded p-1.5">
                  <p className="text-[10px] text-muted-foreground">You Pay</p>
                  <p className="font-semibold text-xs text-secondary">{formatUGX(school.parent_pays)}</p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    )}

    {/* Document Uploads */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Supporting Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4">
          <FileUpload userId={userId} folder="report-card" label="Report Card" value={form.reportCardUrl} onChange={(url) => update("reportCardUrl", url)} />
          <FileUpload userId={userId} folder="birth-certificate" label="Birth Certificate" value={form.birthCertificateUrl} onChange={(url) => update("birthCertificateUrl", url)} />
          <FileUpload userId={userId} folder="parent-id" label="National ID (Parent or Student)" value={form.parentIdUrl} onChange={(url) => update("parentIdUrl", url)} />
          {["university", "vocational"].includes(form.educationLevel) && (
            <FileUpload userId={userId} folder="admission-letter" label="Admission Letter" value={form.admissionLetterUrl} onChange={(url) => update("admissionLetterUrl", url)} />
          )}
        </div>
      </CardContent>
    </Card>

    {/* Declaration */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg">Declaration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p>
            We the undersigned declare and confirm that the information stated above is true and correct to
            the best of our knowledge and that we have agreed to the terms and conditions under this
            application form.
          </p>
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
  </div>
);

export default StepQualificationDeclaration;
