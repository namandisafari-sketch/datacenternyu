import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

const Register = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    relationship: "",
    studentName: "",
    dateOfBirth: "",
    gender: "",
    educationLevel: "",
    schoolName: "",
    district: "",
    reason: "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentName || !form.studentName || !form.educationLevel || !form.parentPhone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitted(true);
    toast.success("Application submitted successfully!");
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10">
            <CheckCircle size={64} className="text-accent mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Application Received!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for registering. Our team will review your application and contact you soon.
            </p>
            <Button onClick={() => setSubmitted(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Submit Another Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-3">
            Scholarship Application
          </h1>
          <p className="text-muted-foreground text-lg">
            Parents and guardians can register their children online for bursary consideration.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Parent / Guardian Details</CardTitle>
            <CardDescription>Provide your contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Parent section */}
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
                  <Input id="parentEmail" type="email" value={form.parentEmail} onChange={(e) => update("parentEmail", e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Relationship to Student</Label>
                  <Select value={form.relationship} onValueChange={(v) => update("relationship", v)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="relative">Relative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Student section */}
              <div>
                <h3 className="font-display text-lg font-semibold text-primary mb-4 border-b border-border pb-2">Student Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Full Name *</Label>
                    <Input id="studentName" value={form.studentName} onChange={(e) => update("studentName", e.target.value)} placeholder="Jane Nalubega" />
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
                    <Label>Education Level *</Label>
                    <Select value={form.educationLevel} onValueChange={(v) => update("educationLevel", v)}>
                      <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nursery">Nursery</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary-o">Secondary (O-Level)</SelectItem>
                        <SelectItem value="secondary-a">Secondary (A-Level)</SelectItem>
                        <SelectItem value="vocational">Vocational / Technical</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">Current School</Label>
                    <Input id="schoolName" value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} placeholder="Makerere College School" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="Kampala" />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Why does this student need support?</Label>
                <Textarea
                  id="reason"
                  value={form.reason}
                  onChange={(e) => update("reason", e.target.value)}
                  rows={4}
                  placeholder="Briefly describe the student's situation and why they need financial support..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-base">
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
