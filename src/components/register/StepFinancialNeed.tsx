import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationForm } from "./types";
import FileUpload from "./FileUpload";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  userId: string;
}

const StepFinancialNeed = ({ form, update, userId }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-xl">Financial Need Assessment</CardTitle>
      <CardDescription>Help us understand the student's financial situation for fair allocation</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currentFeePayer">Who currently pays school fees?</Label>
          <Input id="currentFeePayer" value={form.currentFeePayer} onChange={(e) => update("currentFeePayer", e.target.value)} placeholder="e.g. Mother, Uncle, Self" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feesPerTerm">Total Fees per Term/Semester (UGX)</Label>
          <Input id="feesPerTerm" type="number" min={0} value={form.feesPerTerm || ""} onChange={(e) => update("feesPerTerm", parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="outstandingBalances">Outstanding Balance (UGX)</Label>
          <Input id="outstandingBalances" type="number" min={0} value={form.outstandingBalances || ""} onChange={(e) => update("outstandingBalances", parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>Household Income Range</Label>
          <Select value={form.householdIncomeRange} onValueChange={(v) => update("householdIncomeRange", v)}>
            <SelectTrigger><SelectValue placeholder="Select range..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="below_100k">Below UGX 100,000/month</SelectItem>
              <SelectItem value="100k_300k">UGX 100,000 – 300,000/month</SelectItem>
              <SelectItem value="300k_500k">UGX 300,000 – 500,000/month</SelectItem>
              <SelectItem value="500k_1m">UGX 500,000 – 1,000,000/month</SelectItem>
              <SelectItem value="above_1m">Above UGX 1,000,000/month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="previousBursary"
          checked={form.previousBursary}
          onCheckedChange={(checked) => update("previousBursary", !!checked)}
        />
        <Label htmlFor="previousBursary" className="text-sm">Has the applicant received a bursary or scholarship before?</Label>
      </div>
      <FileUpload userId={userId} folder="proof-of-need" label="Proof of Need (optional)" value={form.proofOfNeedUrl} onChange={(url) => update("proofOfNeedUrl", url)} />
    </CardContent>
  </Card>
);

export default StepFinancialNeed;
