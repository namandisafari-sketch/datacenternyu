import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  School,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertTriangle,
  Search,
  GraduationCap,
} from "lucide-react";
import nyungaLogo from "@/assets/nyunga-foundation-logo.png";

interface SchoolOption {
  id: string;
  name: string;
  level: string;
  district: string;
}

interface StudentEntry {
  name: string;
  class_grade: string;
}

interface MatchResult {
  student_name: string;
  class_grade: string;
  match_status: "matched" | "no_details";
  registration_number?: string;
  application_id?: string;
}

const TERMS = ["Term 1", "Term 2", "Term 3"];
const CURRENT_YEAR = new Date().getFullYear().toString();

const SchoolAttendancePortal = () => {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [students, setStudents] = useState<StudentEntry[]>([{ name: "", class_grade: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      const { data } = await supabase
        .from("schools")
        .select("id, name, level, district")
        .eq("is_active", true)
        .order("name");
      setSchools((data as SchoolOption[]) || []);
      setLoading(false);
    };
    fetchSchools();
  }, []);

  const addStudent = () => {
    setStudents((prev) => [...prev, { name: "", class_grade: "" }]);
  };

  const removeStudent = (idx: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStudent = (idx: number, field: keyof StudentEntry, value: string) => {
    setStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async () => {
    if (!selectedSchoolId) return toast.error("Please select your school");
    if (!reporterName.trim()) return toast.error("Please enter your name");
    if (!reporterPhone.trim()) return toast.error("Please enter your phone number");
    if (!term) return toast.error("Please select the term");

    const validStudents = students.filter((s) => s.name.trim());
    if (validStudents.length === 0) return toast.error("Please enter at least one student name");

    setSubmitting(true);
    setResults(null);

    try {
      // Fetch all applications to match against
      const { data: applications } = await supabase
        .from("applications")
        .select("id, student_name, registration_number, class_grade, school_id, status")
        .eq("status", "approved");

      const matchResults: MatchResult[] = [];
      const insertRows: any[] = [];

      for (const student of validStudents) {
        const normalizedName = student.name.trim().toLowerCase();

        // Try to find a matching application
        const match = (applications || []).find((app) => {
          const appName = (app.student_name || "").trim().toLowerCase();
          return appName === normalizedName || appName.includes(normalizedName) || normalizedName.includes(appName);
        });

        const matchStatus = match ? "matched" : "no_details";

        matchResults.push({
          student_name: student.name.trim(),
          class_grade: student.class_grade,
          match_status: matchStatus,
          registration_number: match?.registration_number || undefined,
          application_id: match?.id || undefined,
        });

        insertRows.push({
          school_id: selectedSchoolId,
          student_name: student.name.trim(),
          class_grade: student.class_grade,
          registration_number: match?.registration_number || "",
          application_id: match?.id || null,
          match_status: matchStatus,
          term,
          year,
          reporter_name: reporterName.trim(),
          reporter_phone: reporterPhone.trim(),
        });
      }

      const { error } = await supabase.from("school_attendance_reports").insert(insertRows);
      if (error) throw error;

      setResults(matchResults);
      toast.success(`${validStudents.length} student(s) reported successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit attendance report");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStudents([{ name: "", class_grade: "" }]);
    setResults(null);
  };

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-muted/60">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={nyungaLogo} alt="Nyunga Foundation" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Nyunga Foundation</h1>
            <p className="text-xs text-muted-foreground">School Attendance Reporting Portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Info Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <School className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">For Partner Schools</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Report which students have arrived at your school this term. The foundation will use this
                  to track bursary beneficiaries and verify enrollment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results View */}
        {results ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Attendance Report Submitted
              </CardTitle>
              <CardDescription>
                {selectedSchool?.name} — {term} {year}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    r.match_status === "matched"
                      ? "border-green-500/30 bg-green-50 dark:bg-green-950/20"
                      : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {r.match_status === "matched" ? (
                      <UserCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm text-foreground">{r.student_name}</p>
                      {r.class_grade && <p className="text-xs text-muted-foreground">{r.class_grade}</p>}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      r.match_status === "matched"
                        ? "border-green-500/50 text-green-700 dark:text-green-400"
                        : "border-amber-500/50 text-amber-700 dark:text-amber-400"
                    }
                  >
                    {r.match_status === "matched" ? "At School ✓" : "At School — No Details Yet"}
                  </Badge>
                </div>
              ))}

              <div className="pt-4 flex gap-3">
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Report More Students
                </Button>
                <Button onClick={() => window.location.reload()} variant="secondary" className="flex-1">
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* School Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Step 1: Select Your School
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>School</Label>
                  <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your school..." />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — {s.district} ({s.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Your Name</Label>
                    <Input
                      placeholder="e.g. Mr. Okello James"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Your Phone</Label>
                    <Input
                      placeholder="e.g. 0771234567"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Term</Label>
                    <Select value={term} onValueChange={setTerm}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {TERMS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Input value={year} onChange={(e) => setYear(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Step 2: Enter Students at School
                </CardTitle>
                <CardDescription>
                  Type the names of students who have reported to your school this term
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {students.map((student, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      {idx === 0 && <Label className="text-xs">Student Name</Label>}
                      <Input
                        placeholder="Full name e.g. Namukasa Grace"
                        value={student.name}
                        onChange={(e) => updateStudent(idx, "name", e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      {idx === 0 && <Label className="text-xs">Class</Label>}
                      <Input
                        placeholder="e.g. S.2"
                        value={student.class_grade}
                        onChange={(e) => updateStudent(idx, "class_grade", e.target.value)}
                      />
                    </div>
                    {students.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeStudent(idx)} className="shrink-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button variant="outline" onClick={addStudent} className="w-full gap-2">
                  <Plus className="h-4 w-4" /> Add Another Student
                </Button>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full gap-2"
              size="lg"
            >
              {submitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Attendance Report
            </Button>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nyunga Foundation. All rights reserved.
      </footer>
    </div>
  );
};

export default SchoolAttendancePortal;
