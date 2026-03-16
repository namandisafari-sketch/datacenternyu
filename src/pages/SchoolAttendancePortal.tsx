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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileSpreadsheet,
  Upload,
  Download,
  BarChart3,
} from "lucide-react";
import nyungaLogo from "@/assets/nyunga-foundation-logo.png";
import kabejjaLogo from "@/assets/kabejja-logo.png";

interface SchoolOption {
  id: string;
  name: string;
  level: string;
  district: string;
}

// ---- Attendance types ----
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

// ---- Performance types ----
interface SubjectScore {
  subject: string;
  marks: string;
}

interface StudentScoreEntry {
  name: string;
  class_grade: string;
  subjects: SubjectScore[];
  remarks: string;
}

const TERMS = ["Term 1", "Term 2", "Term 3"];
const CURRENT_YEAR = new Date().getFullYear().toString();

const SUBJECTS_BY_LEVEL: Record<string, string[]> = {
  nursery: ["Reading", "Writing", "Numeracy", "Oral Work", "Creative Arts", "Physical Education"],
  primary: ["Mathematics", "English", "Science", "Social Studies", "Reading", "Writing", "Luganda", "Religious Education"],
  secondary_o: ["Mathematics", "English", "Physics", "Chemistry", "Biology", "History", "Geography", "Commerce", "Computer Studies", "Agriculture"],
  secondary_a: ["General Paper", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Entrepreneurship", "Computer Science"],
  vocational: ["Technical Drawing", "Workshop Practice", "Mathematics", "English", "Entrepreneurship", "ICT", "Theory Subject 1", "Theory Subject 2"],
  university: ["Course Unit 1", "Course Unit 2", "Course Unit 3", "Course Unit 4", "Course Unit 5", "Course Unit 6"],
};

const createEmptyStudent = (subjects: string[]): StudentScoreEntry => ({
  name: "",
  class_grade: "",
  subjects: subjects.map((s) => ({ subject: s, marks: "" })),
  remarks: "",
});

const SchoolAttendancePortal = () => {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState("attendance");

  // Shared fields
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);

  // ---- Attendance state ----
  const [students, setStudents] = useState<StudentEntry[]>([{ name: "", class_grade: "", fees_currently_paying: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<SubmitResult[] | null>(null);
  const [lookups, setLookups] = useState<Record<number, StudentLookup>>({});

  // ---- Performance state ----
  const [subjectList, setSubjectList] = useState<string[]>(SUBJECTS_BY_LEVEL.primary);
  const [customSubject, setCustomSubject] = useState("");
  const [perfStudents, setPerfStudents] = useState<StudentScoreEntry[]>([createEmptyStudent(SUBJECTS_BY_LEVEL.primary)]);
  const [perfSubmitting, setPerfSubmitting] = useState(false);
  const [perfSubmitted, setPerfSubmitted] = useState(false);
  const [perfTab, setPerfTab] = useState("online");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

  // Update subjects when school changes
  useEffect(() => {
    if (selectedSchool) {
      const newSubjects = SUBJECTS_BY_LEVEL[selectedSchool.level] || SUBJECTS_BY_LEVEL.primary;
      setSubjectList(newSubjects);
      setPerfStudents([createEmptyStudent(newSubjects)]);
    }
  }, [selectedSchoolId]);

  // ============ ATTENDANCE LOGIC ============
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
    if (match?.class_grade) {
      setStudents((prev) =>
        prev.map((s, i) => (i === idx && !s.class_grade ? { ...s, class_grade: match.class_grade || "" } : s))
      );
    }
  }, []);

  const addAttStudent = () => setStudents((prev) => [...prev, { name: "", class_grade: "", fees_currently_paying: "" }]);
  const removeAttStudent = (idx: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== idx));
    setLookups((prev) => { const next = { ...prev }; delete next[idx]; return next; });
  };
  const updateAttStudent = (idx: number, field: keyof StudentEntry, value: string) => {
    setStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const handleAttSubmit = async () => {
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
          school_id: selectedSchoolId, term, year,
          reporter_name: reporterName.trim(), reporter_phone: reporterPhone.trim(),
          students: validStudents.map((s) => ({ name: s.name.trim(), class_grade: s.class_grade, fees_currently_paying: s.fees_currently_paying })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.results as SubmitResult[]);
      toast.success(`${validStudents.length} student(s) reported. ${data.matched} matched, ${data.new_students || 0} new.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAttForm = () => {
    setStudents([{ name: "", class_grade: "", fees_currently_paying: "" }]);
    setResults(null);
    setLookups({});
  };

  // ============ PERFORMANCE LOGIC ============
  const addSubject = () => {
    const name = customSubject.trim();
    if (!name || subjectList.includes(name)) return;
    setSubjectList((prev) => [...prev, name]);
    setPerfStudents((prev) => prev.map((s) => ({ ...s, subjects: [...s.subjects, { subject: name, marks: "" }] })));
    setCustomSubject("");
  };

  const removeSubject = (subjectName: string) => {
    setSubjectList((prev) => prev.filter((s) => s !== subjectName));
    setPerfStudents((prev) => prev.map((s) => ({ ...s, subjects: s.subjects.filter((sub) => sub.subject !== subjectName) })));
  };

  const addPerfStudent = () => setPerfStudents((prev) => [...prev, createEmptyStudent(subjectList)]);
  const removePerfStudent = (idx: number) => setPerfStudents((prev) => prev.filter((_, i) => i !== idx));

  const updatePerfField = (idx: number, field: "name" | "class_grade" | "remarks", value: string) => {
    setPerfStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const updateMark = (sIdx: number, subIdx: number, value: string) => {
    setPerfStudents((prev) =>
      prev.map((s, i) =>
        i === sIdx ? { ...s, subjects: s.subjects.map((sub, j) => (j === subIdx ? { ...sub, marks: value } : sub)) } : s
      )
    );
  };

  const handlePerfSubmit = async () => {
    if (!selectedSchoolId) return toast.error("Please select your school");
    if (!reporterName.trim()) return toast.error("Please enter your name");
    if (!term) return toast.error("Please select the term");
    const valid = perfStudents.filter((s) => s.name.trim());
    if (valid.length === 0) return toast.error("Enter at least one student");
    setPerfSubmitting(true);
    try {
      const { data: sheet, error: sheetErr } = await supabase
        .from("student_performance_sheets")
        .insert({ school_id: selectedSchoolId, term, year, reporter_name: reporterName.trim(), reporter_phone: reporterPhone.trim() } as any)
        .select("id").single();
      if (sheetErr) throw sheetErr;
      const scores = valid.map((s) => {
        const filled = s.subjects.filter((sub) => sub.marks);
        const total = filled.reduce((sum, sub) => sum + (parseFloat(sub.marks) || 0), 0);
        const avg = filled.length > 0 ? total / filled.length : 0;
        return { sheet_id: (sheet as any).id, student_name: s.name.trim(), class_grade: s.class_grade, subjects: s.subjects, total_marks: total, average_marks: Math.round(avg * 10) / 10, remarks: s.remarks };
      });
      const { error: scoresErr } = await supabase.from("student_performance_scores").insert(scores as any);
      if (scoresErr) throw scoresErr;
      toast.success(`Performance data for ${valid.length} student(s) submitted!`);
      setPerfSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setPerfSubmitting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedSchoolId) return toast.error("Please select your school");
    if (!reporterName.trim()) return toast.error("Please enter your name");
    if (!term) return toast.error("Please select the term");
    if (!uploadFile) return toast.error("Please select a file");
    setUploading(true);
    try {
      const ext = uploadFile.name.split(".").pop();
      const filePath = `performance-sheets/${selectedSchoolId}/${term}-${year}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("application-documents").upload(filePath, uploadFile);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("application-documents").getPublicUrl(filePath);
      const { error: sheetErr } = await supabase.from("student_performance_sheets")
        .insert({ school_id: selectedSchoolId, term, year, reporter_name: reporterName.trim(), reporter_phone: reporterPhone.trim(), file_url: urlData.publicUrl } as any);
      if (sheetErr) throw sheetErr;
      toast.success("Score sheet uploaded!");
      setPerfSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ["No.", "Student Name", "Class/Grade", ...subjectList, "Total", "Average", "Remarks"];
    const rows = Array.from({ length: 30 }, (_, i) => [(i + 1).toString(), "", "", ...subjectList.map(() => ""), "", "", ""]);
    const schoolName = selectedSchool?.name || "School";
    const csv = [
      `NYUNGA FOUNDATION - STUDENT PERFORMANCE SCORE SHEET`,
      `School: ${schoolName}`,
      `Term: ${term || "___"} | Year: ${year}`,
      `Submitted by: ${reporterName || "___"} | Phone: ${reporterPhone || "___"}`,
      ``,
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Nyunga_Performance_${schoolName.replace(/\s/g, "_")}_${term || "Term"}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={nyungaLogo} alt="Nyunga Foundation" className="h-10 w-10 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Nyunga Foundation</h1>
            <p className="text-xs text-muted-foreground">School Reporting Portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">⚠️ Official Portal</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is the official School Reporting Portal of <strong>The Nyunga Foundation</strong>, only accessible at{" "}
                  <strong className="text-foreground">nyungacip.lovable.app</strong>. Do not enter information on any other website claiming to be this portal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shared School & Reporter Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              School &amp; Reporter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>School *</Label>
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger><SelectValue placeholder="Select your school..." /></SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.district} ({s.level})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Your Name *</Label>
                <Input placeholder="e.g. Mr. Okello James" value={reporterName} onChange={(e) => setReporterName(e.target.value)} />
              </div>
              <div>
                <Label>Your Phone *</Label>
                <Input placeholder="e.g. 0771234567" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Term *</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>{TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="attendance" className="gap-2"><School className="h-4 w-4" /> Attendance Report</TabsTrigger>
            <TabsTrigger value="performance" className="gap-2"><BarChart3 className="h-4 w-4" /> Performance Scores</TabsTrigger>
          </TabsList>

          {/* ===== ATTENDANCE TAB ===== */}
          <TabsContent value="attendance" className="mt-4 space-y-6">
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
                  <CardDescription>{selectedSchool?.name} — {term} {year}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {results.map((r, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${r.match_status === "matched" ? "border-green-500/30 bg-green-50 dark:bg-green-950/20" : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {r.match_status === "matched" ? <UserCheck className="h-5 w-5 text-green-600 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
                          <div>
                            <p className="font-medium text-sm text-foreground">{r.student_name}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {r.class_grade && <span className="text-xs text-muted-foreground">{r.class_grade}</span>}
                              {r.registration_number && <span className="text-xs text-muted-foreground">Reg: {r.registration_number}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={r.match_status === "matched" ? "border-green-500/50 text-green-700 dark:text-green-400" : "border-amber-500/50 text-amber-700 dark:text-amber-400"}>
                          {r.match_status === "matched" ? "Found ✓" : r.is_new ? "New — Added" : "Not Found"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 ml-8 flex-wrap">
                        <span className="text-xs text-muted-foreground">Paying: <strong className="text-foreground">UGX {r.fees_currently_paying.toLocaleString()}</strong></span>
                        {r.expected_fees > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground">/ Expected: <strong className="text-foreground">UGX {r.expected_fees.toLocaleString()}</strong></span>
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
                    <Button onClick={resetAttForm} variant="outline" className="flex-1">Report More</Button>
                    <Button onClick={() => window.location.reload()} variant="secondary" className="flex-1">Start Over</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      Enter Students at School
                    </CardTitle>
                    <CardDescription>Type student names — the system will check if they exist.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {students.map((student, idx) => {
                      const lookup = lookups[idx];
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              {idx === 0 && <Label className="text-xs">Student Name</Label>}
                              <Input placeholder="Full name" value={student.name} onChange={(e) => updateAttStudent(idx, "name", e.target.value)} onBlur={() => lookupStudent(student.name, idx)} />
                            </div>
                            <div className="w-24">
                              {idx === 0 && <Label className="text-xs">Class</Label>}
                              <Input placeholder="e.g. S.2" value={student.class_grade} onChange={(e) => updateAttStudent(idx, "class_grade", e.target.value)} />
                            </div>
                            <div className="w-32">
                              {idx === 0 && <Label className="text-xs">Fees (UGX)</Label>}
                              <Input type="number" placeholder="e.g. 350000" value={student.fees_currently_paying} onChange={(e) => updateAttStudent(idx, "fees_currently_paying", e.target.value)} />
                            </div>
                            {students.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeAttStudent(idx)} className="shrink-0">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          {lookup?.loading && (
                            <div className="flex items-center gap-2 ml-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Searching...</div>
                          )}
                          {lookup?.searched && !lookup.loading && lookup.match && (
                            <div className="ml-1 p-2 rounded-md border border-green-500/30 bg-green-50 dark:bg-green-950/20 text-xs">
                              <div className="flex items-center gap-2"><UserCheck className="h-3.5 w-3.5 text-green-600 shrink-0" /><span className="font-medium text-green-700 dark:text-green-400">Found in system</span></div>
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
                              <div className="flex items-center gap-2"><UserX className="h-3.5 w-3.5 text-amber-600 shrink-0" /><span className="font-medium text-amber-700 dark:text-amber-400">Not found — will be added on submit</span></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <Button variant="outline" onClick={addAttStudent} className="w-full gap-2"><Plus className="h-4 w-4" /> Add Another Student</Button>
                  </CardContent>
                </Card>
                <Button onClick={handleAttSubmit} disabled={submitting} className="w-full gap-2" size="lg">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Attendance Report
                </Button>
              </>
            )}
          </TabsContent>

          {/* ===== PERFORMANCE TAB ===== */}
          <TabsContent value="performance" className="mt-4 space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">End-of-Term Performance Reporting</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submit Nyunga Foundation students' score sheets at the end of each term. Fill online or download a template, fill offline, and upload.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {perfSubmitted ? (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                  <h2 className="text-xl font-bold text-foreground">Submission Successful!</h2>
                  <p className="text-muted-foreground">
                    Performance data for <strong>{selectedSchool?.name}</strong> — {term} {year} has been received.
                  </p>
                  <Button onClick={() => { setPerfSubmitted(false); setPerfStudents([createEmptyStudent(subjectList)]); setUploadFile(null); }}>
                    Submit Another
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={perfTab} onValueChange={setPerfTab}>
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="online" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Fill Online</TabsTrigger>
                  <TabsTrigger value="upload" className="gap-2"><Upload className="h-4 w-4" /> Upload Sheet</TabsTrigger>
                </TabsList>

                <TabsContent value="online" className="mt-4 space-y-4">
                  {/* Subjects */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Subjects</CardTitle>
                      <CardDescription className="text-xs">Default subjects pre-filled by school level. Add or remove as needed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {subjectList.map((s) => (
                          <Badge key={s} variant="secondary" className="gap-1 pr-1">
                            {s}
                            <button onClick={() => removeSubject(s)} className="ml-1 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Add custom subject..." value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubject()} className="max-w-xs" />
                        <Button size="sm" variant="outline" onClick={addSubject}><Plus className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Score Grid */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Student Scores</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-1 font-medium text-muted-foreground min-w-[150px]">Student Name</th>
                              <th className="text-left py-2 px-1 font-medium text-muted-foreground w-20">Class</th>
                              {subjectList.map((s) => (
                                <th key={s} className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[60px] text-xs">
                                  {s.length > 6 ? s.substring(0, 5) + "." : s}
                                </th>
                              ))}
                              <th className="text-left py-2 px-1 font-medium text-muted-foreground w-24">Remarks</th>
                              <th className="w-8"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {perfStudents.map((student, sIdx) => (
                              <tr key={sIdx} className="border-b border-border/50">
                                <td className="py-1 px-1"><Input placeholder="Full name" value={student.name} onChange={(e) => updatePerfField(sIdx, "name", e.target.value)} className="h-8 text-xs" /></td>
                                <td className="py-1 px-1"><Input placeholder="S.2" value={student.class_grade} onChange={(e) => updatePerfField(sIdx, "class_grade", e.target.value)} className="h-8 text-xs" /></td>
                                {student.subjects.map((sub, subIdx) => (
                                  <td key={subIdx} className="py-1 px-1"><Input type="number" placeholder="—" value={sub.marks} onChange={(e) => updateMark(sIdx, subIdx, e.target.value)} className="h-8 text-xs text-center w-14" min="0" max="100" /></td>
                                ))}
                                <td className="py-1 px-1"><Input placeholder="..." value={student.remarks} onChange={(e) => updatePerfField(sIdx, "remarks", e.target.value)} className="h-8 text-xs" /></td>
                                <td className="py-1 px-1">
                                  {perfStudents.length > 1 && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePerfStudent(sIdx)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <Button variant="outline" size="sm" onClick={addPerfStudent} className="gap-1"><Plus className="h-4 w-4" /> Add Student</Button>
                        <Button onClick={handlePerfSubmit} disabled={perfSubmitting} className="gap-2">
                          {perfSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          {perfSubmitting ? "Submitting..." : "Submit Scores"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="upload" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Download Template &amp; Upload</CardTitle>
                      <CardDescription>Download the template, fill offline, then upload here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" onClick={downloadTemplate} className="gap-2 w-full"><Download className="h-4 w-4" /> Download Score Sheet Template (CSV)</Button>
                      <div className="border-t border-border pt-4 space-y-3">
                        <Label>Upload Completed Score Sheet *</Label>
                        <Input type="file" accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                        <p className="text-xs text-muted-foreground">Accepted: CSV, Excel, PDF, or scanned images</p>
                        {uploadFile && <Badge variant="secondary" className="gap-1"><FileSpreadsheet className="h-3 w-3" /> {uploadFile.name}</Badge>}
                      </div>
                      <Button onClick={handleFileUpload} disabled={uploading || !uploadFile} className="w-full gap-2">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploading ? "Uploading..." : "Upload Score Sheet"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="text-center py-6 space-y-3">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nyunga Foundation. All rights reserved.</p>
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/70">
          <img src={kabejjaLogo} alt="Kabejja Systems" className="h-6 w-6 rounded object-contain" />
          <span>
            Developed &amp; protected by <strong className="text-foreground/60">Kabejja Systems</strong> · <a href="tel:+256745368426" className="underline">+256745368426</a> · <a href="https://www.kabejjasystems.store" target="_blank" rel="noopener noreferrer" className="underline">www.kabejjasystems.store</a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default SchoolAttendancePortal;
