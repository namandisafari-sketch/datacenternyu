import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApplicationForm } from "./types";

interface Props {
  form: ApplicationForm;
  update: (field: string, value: any) => void;
}

const isEcdPrimary = (level: string) => ["nursery", "primary"].includes(level);
const isSecondary = (level: string) => ["secondary_o", "secondary_a"].includes(level);
const isUniversity = (level: string) => ["university", "vocational"].includes(level);

const StepPersonalStatement = ({ form, update }: Props) => {
  const level = form.educationLevel;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Personal Statement</CardTitle>
        <CardDescription>
          {isEcdPrimary(level)
            ? "Parent/Guardian: Tell us why this child needs support"
            : isSecondary(level)
            ? "Student writes a short paragraph about their dreams and needs"
            : "Write a 300–500 word essay about your goals and why you deserve support"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEcdPrimary(level) && (
          <div className="space-y-2">
            <Label>Why does this child need support? *</Label>
            <Textarea
              value={form.reason}
              onChange={(e) => update("reason", e.target.value)}
              rows={4}
              placeholder="Briefly describe why the child needs financial support for school..."
            />
          </div>
        )}

        {isSecondary(level) && (
          <>
            <div className="space-y-2">
              <Label>What is your career dream?</Label>
              <Textarea
                value={form.personalStatement}
                onChange={(e) => update("personalStatement", e.target.value)}
                rows={3}
                placeholder="Tell us what you want to become and why..."
              />
            </div>
            <div className="space-y-2">
              <Label>Why do you need this scholarship? *</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => update("reason", e.target.value)}
                rows={3}
                placeholder="Explain your situation and why you need support..."
              />
            </div>
          </>
        )}

        {isUniversity(level) && (
          <>
            <div className="space-y-2">
              <Label>Personal Essay (300–500 words) *</Label>
              <p className="text-xs text-muted-foreground">Include: career goals, community impact, and why you deserve this scholarship.</p>
              <Textarea
                value={form.personalStatement}
                onChange={(e) => update("personalStatement", e.target.value)}
                rows={10}
                placeholder="Write your essay here..."
              />
              <p className="text-xs text-muted-foreground text-right">
                {form.personalStatement.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
            <div className="space-y-2">
              <Label>Additional reason for support</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => update("reason", e.target.value)}
                rows={3}
                placeholder="Any extra context about your situation..."
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StepPersonalStatement;
