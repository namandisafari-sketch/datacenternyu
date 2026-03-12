import { useState, useEffect, useCallback } from "react";
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
  Loader2,
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
  fees_currently_paying: string;
}

interface MatchedApp {
  id: string;
  student_name: string;
  registration_number: string | null;
  class_grade: string | null;
  fees_per_term: number | null;
  school_id: string | null;
}

interface StudentLookup {
  loading: boolean;
  match: MatchedApp | null;
  searched: boolean;
}

interface SubmitResult {
  student_name: string;
  class_grade: string;
  match_status: "matched" | "no_details";
  registration_number: string;
  fees_currently_paying: number;
  expected_fees: number;
  is_new: boolean;
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
  const [students, setStudents] = useState<StudentEntry[]>([{ name: "", class_grade: "", fees_currently_paying: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<SubmitResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookups, setLookups] = useState<Record<number, StudentLookup>>({});

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

  const lookupStudent = useCallback(async (name: string, idx: number) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setLookups((prev) => ({ ...prev, [idx]: { loading: false, match: null, searched: false } }));
      return;
    }

    setLookups((prev) => ({ ...prev, [idx]: { loading: true, match: null, searched: false } }));

    const { data } = await supabase
      .from("applications")
      .select("id, student_name, registration_number, class_grade, fees_per_term, school_id")
      .eq("status", "approved")
      .ilike("student_name", `%${trimmed}%`)
      .limit(1);

    const match = data && data.length > 0 ? (data[0] as MatchedApp) : null;
    setLookups((prev) => ({ ...prev, [idx]: { loading: false, match, searched: true } }));

    // Auto-fill class if matched and empty
    if (match?.class_grade) {
      setStudents((prev) =>
        prev.map((s, i) => (i === idx && !s.class_grade ? { ...s, class_grade: match.class_grade || "" } : s))
      );
    }
  }, []);

  const addStudent = () => {
    setStudents((prev) => [...prev, { name: "", class_grade: "", fees_currently_paying: "" }]);
  };

  const removeStudent = (idx: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== idx));
    setLookups((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
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
      const { data, error } = await supabase.functions.invoke("submit-attendance", {
        body: {
          school_id: selectedSchoolId,
          term,
          year,
          reporter_name: reporterName.trim(),
          reporter_phone: reporterPhone.trim(),
          students: validStudents.map((s) => ({
            name: s.name.trim(),
            class_grade: s.class_grade,
            fees_currently_paying: s.fees_currently_paying,
          })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data.results as SubmitResult[]);
      const newCount = data.new_students || 0;
      toast.success(
        `${validStudents.length} student(s) reported. ${data.matched} matched, ${newCount} new student(s) added to the system.`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to submit attendance report");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStudents([{ name: "", class_grade: "", fees_currently_paying: "" }]);
    setResults(null);
    setLookups({});
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
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">⚠️ Official Portal</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is the official School Attendance Reporting Portal of <strong>The Nyunga Foundation</strong>, only accessible at{" "}
                  <strong className="text-foreground">nyungacip.lovable.app</strong>. Do not enter information on any other website claiming to be this portal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <School className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">For Partner Schools</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Report which students have arrived at your school this term. Students not found in the system will be automatically registered for admin review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  className={`p-3 rounded-lg border ${
                    r.match_status === "matched"
                      ? "border-green-500/30 bg-green-50 dark:bg-green-950/20"
                      : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {r.match_status === "matched" ? (
                        <UserCheck className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm text-foreground">{r.student_name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {r.class_grade && <span className="text-xs text-muted-foreground">{r.class_grade}</span>}
                          {r.registration_number && (
                            <span className="text-xs text-muted-foreground">Reg: {r.registration_number}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={
                          r.match_status === "matched"
                            ? "border-green-500/50 text-green-700 dark:text-green-400"
                            : "border-amber-500/50 text-amber-700 dark:text-amber-400"
                        }
                      >
                        {r.match_status === "matched" ? "Found ✓" : r.is_new ? "New — Added to System" : "Not Found"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-8 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      Paying: <strong className="text-foreground">UGX {r.fees_currently_paying.toLocaleString()}</strong>
                    </span>
                    {r.expected_fees > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          / Expected: <strong className="text-foreground">UGX {r.expected_fees.toLocaleString()}</strong>
                        </span>
                        {r.fees_currently_paying < r.expected_fees ? (
                          <Badge variant="outline" className="text-[10px] border-destructive/50 text-destructive">Underpaying</Badge>
                        ) : r.fees_currently_paying > r.expected_fees ? (
                          <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600">Overpaying</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-600">Correct ✓</Badge>
                        )}
                      </>
                    )}
                  </div>
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
                    <Input placeholder="e.g. Mr. Okello James" value={reporterName} onChange={(e) => setReporterName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Your Phone</Label>
                    <Input placeholder="e.g. 0771234567" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)} />
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Step 2: Enter Students at School
                </CardTitle>
                <CardDescription>
                  Type student names — the system will check if they exist. New students will be added automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {students.map((student, idx) => {
                  const lookup = lookups[idx];
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          {idx === 0 && <Label className="text-xs">Student Name</Label>}
                          <Input
                            placeholder="Full name e.g. Namukasa Grace"
                            value={student.name}
                            onChange={(e) => updateStudent(idx, "name", e.target.value)}
                            onBlur={() => lookupStudent(student.name, idx)}
                          />
                        </div>
                        <div className="w-24">
                          {idx === 0 && <Label className="text-xs">Class</Label>}
                          <Input
                            placeholder="e.g. S.2"
                            value={student.class_grade}
                            onChange={(e) => updateStudent(idx, "class_grade", e.target.value)}
                          />
                        </div>
                        <div className="w-32">
                          {idx === 0 && <Label className="text-xs">Fees (UGX)</Label>}
                          <Input
                            type="number"
                            placeholder="e.g. 350000"
                            value={student.fees_currently_paying}
                            onChange={(e) => updateStudent(idx, "fees_currently_paying", e.target.value)}
                          />
                        </div>
                        {students.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeStudent(idx)} className="shrink-0">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      {/* Live lookup result */}
                      {lookup?.loading && (
                        <div className="flex items-center gap-2 ml-1 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                        </div>
                      )}
                      {lookup?.searched && !lookup.loading && lookup.match && (
                        <div className="ml-1 p-2 rounded-md border border-green-500/30 bg-green-50 dark:bg-green-950/20 text-xs">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                            <span className="font-medium text-green-700 dark:text-green-400">Found in system</span>
                          </div>
                          <div className="ml-5 mt-1 text-muted-foreground space-y-0.5">
                            <p>Name: <strong className="text-foreground">{lookup.match.student_name}</strong></p>
                            {lookup.match.registration_number && <p>Reg No: <strong className="text-foreground">{lookup.match.registration_number}</strong></p>}
                            {lookup.match.class_grade && <p>Class: <strong className="text-foreground">{lookup.match.class_grade}</strong></p>}
                            {lookup.match.fees_per_term != null && lookup.match.fees_per_term > 0 && (
                              <p>Expected Fees: <strong className="text-foreground">UGX {lookup.match.fees_per_term.toLocaleString()}</strong></p>
                            )}
                          </div>
                        </div>
                      )}
                      {lookup?.searched && !lookup.loading && !lookup.match && student.name.trim().length >= 3 && (
                        <div className="ml-1 p-2 rounded-md border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-xs">
                          <div className="flex items-center gap-2">
                            <UserX className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span className="font-medium text-amber-700 dark:text-amber-400">
                              Not found — will be added to the system on submit
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button variant="outline" onClick={addStudent} className="w-full gap-2">
                  <Plus className="h-4 w-4" /> Add Another Student
                </Button>
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2" size="lg">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Attendance Report
            </Button>
          </>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nyunga Foundation. All rights reserved.
      </footer>
    </div>
  );
};

export default SchoolAttendancePortal;
