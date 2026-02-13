import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApplicationForm } from "./types";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
}

const StepParentInfo = ({ form, update }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display text-xl">Parent / Guardian Information</CardTitle>
      <CardDescription>Contact details of the parent or guardian responsible for the student</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentName">Full Name *</Label>
          <Input id="parentName" value={form.parentName} onChange={(e) => update("parentName", e.target.value)} placeholder="e.g. Mukasa John" />
        </div>
        <div className="space-y-2">
          <Label>Relationship *</Label>
          <Select value={form.relationship} onValueChange={(v) => update("relationship", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="guardian">Guardian</SelectItem>
              <SelectItem value="relative">Relative</SelectItem>
              <SelectItem value="self">Self (University)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentPhone">Phone Number * (WhatsApp preferred)</Label>
          <Input id="parentPhone" value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} placeholder="+256 700 000 000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentEmail">Email (optional)</Label>
          <Input id="parentEmail" type="email" value={form.parentEmail} onChange={(e) => update("parentEmail", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentOccupation">Occupation</Label>
          <Input id="parentOccupation" value={form.parentOccupation} onChange={(e) => update("parentOccupation", e.target.value)} placeholder="e.g. Farmer, Teacher, Boda rider" />
        </div>
        <div className="space-y-2">
          <Label>Estimated Monthly Income</Label>
          <Select value={form.parentMonthlyIncome} onValueChange={(v) => update("parentMonthlyIncome", v)}>
            <SelectTrigger><SelectValue placeholder="Select range..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="below_100k">Below UGX 100,000</SelectItem>
              <SelectItem value="100k_300k">UGX 100,000 – 300,000</SelectItem>
              <SelectItem value="300k_500k">UGX 300,000 – 500,000</SelectItem>
              <SelectItem value="500k_1m">UGX 500,000 – 1,000,000</SelectItem>
              <SelectItem value="above_1m">Above UGX 1,000,000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="childrenInSchool">Number of Children in School</Label>
          <Input id="childrenInSchool" type="number" min={0} value={form.childrenInSchool} onChange={(e) => update("childrenInSchool", parseInt(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentNin">Parent NIN (optional)</Label>
          <Input id="parentNin" value={form.parentNin} onChange={(e) => update("parentNin", e.target.value)} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StepParentInfo;
