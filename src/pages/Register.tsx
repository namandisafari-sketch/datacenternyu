import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, School, ArrowRight, ArrowLeft } from "lucide-react";

type EducationLevel = "nursery" | "primary" | "secondary_o" | "secondary_a" | "vocational" | "university";

interface SchoolRow {
  id: string;
  name: string;
  level: string;
  district: string;
  requirements: string | null;
  full_fees: number;
  nyunga_covered_fees: number;
  parent_pays: number;
  boarding_available: boolean | null;
}

const levelLabels: Record<string, string> = {
  nursery: "Nursery",
  primary: "Primary",
  secondary_o: "Secondary (O-Level)",
  secondary_a: "Secondary (A-Level)",
  vocational: "Vocational / Technical",
  university: "University",
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const Register = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1: level selection
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | "">("");
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRow | null>(null);

  // Step 2: form
  const [form, setForm] = useState({
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    relationship: "parent",
    studentName: "",
    dateOfBirth: "",
    gender: "",
    classGrade: "",
    currentSchool: "",
    district: "",
    reason: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (selectedLevel) {
      supabase
        .from("schools")
        .select("*")
        .eq("level", selectedLevel)
        .then(({ data }) => {
          setSchools((data as unknown as SchoolRow[]) || []);
          setSelectedSchool(null);
        });
    }
  }, [selectedLevel]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentName || !form.studentName || !form.parentPhone || !selectedLevel) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      parent_name: form.parentName,
      parent_phone: form.parentPhone,
      parent_email: form.parentEmail,
      relationship: form.relationship,
      student_name: form.studentName,
      date_of_birth: form.dateOfBirth || null,
      gender: form.gender,
      class_grade: form.classGrade,
      education_level: selectedLevel as EducationLevel,
      school_id: selectedSchool?.id || null,
      current_school: form.currentSchool,
      district: form.district,
      reason: form.reason,
    } as any);

    setLoading(false);
    if (error) {
      toast.error("Failed to submit: " + error.message);
    } else {
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10">
            <CheckCircle size={64} className="text-accent mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your application has been received. You can track the status from your dashboard.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-3">
            Scholarship Application
          </h1>
          <p className="text-muted-foreground text-lg">
            Step {step} of 2 — {step === 1 ? "Choose Education Level & School" : "Fill in Details"}
          </p>
          {/* Progress bar */}
          <div className="flex gap-2 max-w-xs mx-auto mt-4">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-secondary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-secondary" : "bg-muted"}`} />
          </div>
        </div>

        {/* STEP 1: Level & School Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Select Education Level</CardTitle>
                <CardDescription>Choose the level your child will be enrolling in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(levelLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedLevel(key as EducationLevel)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedLevel === key
                          ? "border-secondary bg-secondary/10 text-secondary-foreground"
                          : "border-border hover:border-secondary/50"
                      }`}
                    >
                      <School size={24} className={`mx-auto mb-2 ${selectedLevel === key ? "text-secondary" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* School listing */}
            {selectedLevel && schools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl">Available Schools</CardTitle>
                  <CardDescription>Compare full fees vs. what Nyunga Foundation covers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {schools.map((school) => (
                    <button
                      key={school.id}
                      onClick={() => setSelectedSchool(school)}
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

            {selectedLevel && schools.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No schools available for this level yet. You can still proceed with your application.
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedLevel}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
              >
                Next: Fill Details <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Application Form */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">Parent / Guardian Details</CardTitle>
              {selectedSchool && (
                <CardDescription>
                  Applying to: <span className="font-medium text-foreground">{selectedSchool.name}</span> — You pay: <span className="font-medium text-secondary">{formatUGX(selectedSchool.parent_pays)}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Full Name *</Label>
                    <Input id="parentName" value={form.parentName} onChange={(e) => update("parentName", e.target.value)} placeholder="John Mukasa" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Phone Number *</Label>
                    <Input id="parentPhone" value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} placeholder="+256 700 000 000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Email (optional)</Label>
                    <Input id="parentEmail" type="email" value={form.parentEmail} onChange={(e) => update("parentEmail", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select value={form.relationship} onValueChange={(v) => update("relationship", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="relative">Relative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Student Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName">Student Full Name *</Label>
                      <Input id="studentName" value={form.studentName} onChange={(e) => update("studentName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
                    </div>
                     <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classGrade">Class / Grade</Label>
                      <Input id="classGrade" value={form.classGrade} onChange={(e) => update("classGrade", e.target.value)} placeholder="e.g. P.5, S.2, Year 1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Kampala" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Why does this student need support?</Label>
                  <Textarea id="reason" value={form.reason} onChange={(e) => update("reason", e.target.value)} rows={4} placeholder="Briefly describe the student's situation..." />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                    <ArrowLeft size={18} /> Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Register;
