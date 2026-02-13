import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School } from "lucide-react";
import { ApplicationForm, SchoolRow, levelLabels, formatUGX, EducationLevel } from "./types";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
  schools: SchoolRow[];
  selectedSchool: SchoolRow | null;
  setSelectedSchool: (s: SchoolRow | null) => void;
}

const StepEducationLevel = ({ form, update, schools, selectedSchool, setSelectedSchool }: Props) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Education Level</CardTitle>
        <CardDescription>Select the level the student will be enrolling in</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(levelLabels).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { update("educationLevel", key as EducationLevel); setSelectedSchool(null); }}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                form.educationLevel === key
                  ? "border-secondary bg-secondary/10 text-secondary-foreground"
                  : "border-border hover:border-secondary/50"
              }`}
            >
              <School size={24} className={`mx-auto mb-2 ${form.educationLevel === key ? "text-secondary" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>

    {form.educationLevel && schools.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Partner Schools</CardTitle>
          <CardDescription>Select a Nyunga Foundation partner school (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schools.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => { setSelectedSchool(school); update("schoolId", school.id); }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedSchool?.id === school.id
                  ? "border-secondary bg-secondary/5"
                  : "border-border hover:border-secondary/40"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{school.name}</h4>
                  <p className="text-sm text-muted-foreground">{school.district}</p>
                </div>
                {school.boarding_available && <Badge variant="outline">Boarding</Badge>}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs text-muted-foreground">Full Fees</p>
                  <p className="font-semibold text-sm text-foreground">{formatUGX(school.full_fees)}</p>
                </div>
                <div className="bg-accent/10 rounded-md p-2">
                  <p className="text-xs text-muted-foreground">Nyunga Covers</p>
                  <p className="font-semibold text-sm text-accent">{formatUGX(school.nyunga_covered_fees)}</p>
                </div>
                <div className="bg-secondary/10 rounded-md p-2">
                  <p className="text-xs text-muted-foreground">You Pay</p>
                  <p className="font-semibold text-sm text-secondary">{formatUGX(school.parent_pays)}</p>
                </div>
              </div>
              {school.requirements && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Requirements:</p>
                  <p className="text-xs text-foreground">{school.requirements}</p>
                </div>
              )}
            </button>
          ))}
        </CardContent>
      </Card>
    )}

    {form.educationLevel && schools.length === 0 && (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No partner schools for this level yet. You can still proceed.
        </CardContent>
      </Card>
    )}
  </div>
);

export default StepEducationLevel;
