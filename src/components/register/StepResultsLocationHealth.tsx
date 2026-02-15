import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationForm } from "./types";
import LocationSelector from "./LocationSelector";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
}

const StepResultsLocationHealth = ({ form, update }: Props) => {
  const updateGrade = (index: number, field: "name" | "grade", value: string) => {
    const updated = [...form.subjectGrades];
    updated[index] = { ...updated[index], [field]: value };
    update("subjectGrades", updated);
  };

  const addSubject = () => {
    update("subjectGrades", [...form.subjectGrades, { name: "", grade: "" }]);
  };

  return (
    <div className="space-y-6">
      {/* Subject Grades Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Results (State Subject and Grade)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground border-b">
              <span>Subject Name</span>
              <span>Grade</span>
            </div>
            {form.subjectGrades.map((sg, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 px-3 py-1.5 border-b last:border-b-0">
                <Input
                  value={sg.name}
                  onChange={(e) => updateGrade(i, "name", e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Subject"
                />
                <Input
                  value={sg.grade}
                  onChange={(e) => updateGrade(i, "grade", e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Grade"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSubject}
            className="text-xs text-primary hover:underline"
          >
            + Add another subject
          </button>
        </CardContent>
      </Card>

      {/* Home Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">d) Home Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocationSelector
            district={form.district}
            subCounty={form.subCounty}
            parish={form.parish}
            village={form.village}
            onDistrictChange={(v) => update("district", v)}
            onSubCountyChange={(v) => update("subCounty", v)}
            onParishChange={(v) => update("parish", v)}
            onVillageChange={(v) => update("village", v)}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Name of LCI Chairperson</Label>
              <Input value={form.lciChairperson} onChange={(e) => update("lciChairperson", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Contact</Label>
              <Input value={form.lciContact} onChange={(e) => update("lciContact", e.target.value)} placeholder="Phone number" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health & Orphan Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">e) Vulnerability & Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Orphan Status */}
          <div className="space-y-2">
            <Label className="font-medium">Are you an orphan?</Label>
            <Select value={form.orphanStatus} onValueChange={(v) => update("orphanStatus", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.orphanStatus === "yes" && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <Label>If yes, state who died:</Label>
              <Select value={form.deceasedParent} onValueChange={(v) => update("deceasedParent", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Physical Defect */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="physicalDefect"
                checked={form.physicalDefect}
                onCheckedChange={(c) => update("physicalDefect", !!c)}
              />
              <Label htmlFor="physicalDefect">Do you have any physical defect/hand cup?</Label>
            </div>
            {form.physicalDefect && (
              <div className="pl-6">
                <Label className="text-xs text-muted-foreground">If yes, state it:</Label>
                <Textarea
                  value={form.physicalDefectDetails}
                  onChange={(e) => update("physicalDefectDetails", e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Chronic Disease */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="chronicDisease"
                checked={form.chronicDisease}
                onCheckedChange={(c) => update("chronicDisease", !!c)}
              />
              <Label htmlFor="chronicDisease">Do you have any chronic disease?</Label>
            </div>
            {form.chronicDisease && (
              <div className="pl-6">
                <Label className="text-xs text-muted-foreground">If yes, state it:</Label>
                <Textarea
                  value={form.chronicDiseaseDetails}
                  onChange={(e) => update("chronicDiseaseDetails", e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {(form.physicalDefect || form.chronicDisease) && (
            <p className="text-xs text-muted-foreground italic">
              If yes, attach a doctor's report for the two cases above and explain how you contain it.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StepResultsLocationHealth;
