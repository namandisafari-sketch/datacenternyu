import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  School, Plus, Trash2, Send, CheckCircle2, AlertTriangle,
  GraduationCap, Loader2, Download, FileSpreadsheet, Upload,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import nyungaLogo from "@/assets/nyunga-foundation-logo.png";

interface SchoolOption {
  id: string;
  name: string;
  level: string;
  district: string;
}

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

const DEFAULT_SUBJECTS_PRIMARY = [
  "Mathematics", "English", "Science", "Social Studies", "Reading",
];
const DEFAULT_SUBJECTS_SECONDARY = [
  "Mathematics", "English", "Physics", "Chemistry", "Biology",
  "History", "Geography", "Commerce",
];

const createEmptyStudent = (subjects: string[]): StudentScoreEntry => ({
  name: "",
  class_grade: "",
  subjects: subjects.map((s) => ({ subject: s, marks: "" })),
  remarks: "",
});

const SchoolPerformancePortal = () => {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [term, setTerm] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("online");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [subjectList, setSubjectList] = useState<string[]>(DEFAULT_SUBJECTS_PRIMARY);
  const [customSubject, setCustomSubject] = useState("");
  const [students, setStudents] = useState<StudentScoreEntry[]>([
    createEmptyStudent(DEFAULT_SUBJECTS_PRIMARY),
  ]);

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

  useEffect(() => {
    if (selectedSchool) {
      const isSecondary = ["secondary_o", "secondary_a"].includes(selectedSchool.level);
      const newSubjects = isSecondary ? DEFAULT_SUBJECTS_SECONDARY : DEFAULT_SUBJECTS_PRIMARY;
      setSubjectList(newSubjects);
      setStudents([createEmptyStudent(newSubjects)]);
    }
  }, [selectedSchoolId]);

  const addSubject = () => {
    const name = customSubject.trim();
    if (!name || subjectList.includes(name)) return;
    const updated = [...subjectList, name];
    setSubjectList(updated);
    setStudents((prev) =>
      prev.map((s) => ({ ...s, subjects: [...s.subjects, { subject: name, marks: "" }] }))
    );
    setCustomSubject("");
  };

  const removeSubject = (subjectName: string) => {
    setSubjectList((prev) => prev.filter((s) => s !== subjectName));
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        subjects: s.subjects.filter((sub) => sub.subject !== subjectName),
      }))
    );
  };

  const addStudent = () => {
    setStudents((prev) => [...prev, createEmptyStudent(subjectList)]);
  };

  const removeStudent = (idx: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStudentField = (idx: number, field: "name" | "class_grade" | "remarks", value: string) => {
    setStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const updateMark = (studentIdx: number, subjectIdx: number, value: string) => {
    setStudents((prev) =>
      prev.map((s, i) =>
        i === studentIdx
          ? {
              ...s,
              subjects: s.subjects.map((sub, j) =>
                j === subjectIdx ? { ...sub, marks: value } : sub
              ),
            }
          : s
      )
    );
  };

  const handleOnlineSubmit = async () => {
    if (!selectedSchoolId) return toast.error("Please select your school");
    if (!reporterName.trim()) return toast.error("Please enter your name");
    if (!term) return toast.error("Please select the term");

    const validStudents = students.filter((s) => s.name.trim());
    if (validStudents.length === 0) return toast.error("Enter at least one student");

    setSubmitting(true);
    try {
      const { data: sheet, error: sheetErr } = await supabase
        .from("student_performance_sheets")
        .insert({
          school_id: selectedSchoolId,
          term,
          year,
          reporter_name: reporterName.trim(),
          reporter_phone: reporterPhone.trim(),
        } as any)
        .select("id")
        .single();

      if (sheetErr) throw sheetErr;

      const scores = validStudents.map((s) => {
        const subjectsWithMarks = s.subjects.filter((sub) => sub.marks);
        const total = subjectsWithMarks.reduce((sum, sub) => sum + (parseFloat(sub.marks) || 0), 0);
        const avg = subjectsWithMarks.length > 0 ? total / subjectsWithMarks.length : 0;
        return {
          sheet_id: (sheet as any).id,
          student_name: s.name.trim(),
          class_grade: s.class_grade,
          subjects: s.subjects,
          total_marks: total,
          average_marks: Math.round(avg * 10) / 10,
          remarks: s.remarks,
        };
      });

      const { error: scoresErr } = await supabase
        .from("student_performance_scores")
        .insert(scores as any);

      if (scoresErr) throw scoresErr;

      toast.success(`Performance data for ${validStudents.length} student(s) submitted successfully!`);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedSchoolId) return toast.error("Please select your school");
    if (!reporterName.trim()) return toast.error("Please enter your name");
    if (!term) return toast.error("Please select the term");
    if (!uploadFile) return toast.error("Please select a file to upload");

    setUploading(true);
    try {
      const ext = uploadFile.name.split(".").pop();
      const filePath = `performance-sheets/${selectedSchoolId}/${term}-${year}-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("application-documents")
        .upload(filePath, uploadFile);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("application-documents")
        .getPublicUrl(filePath);

      const { error: sheetErr } = await supabase
        .from("student_performance_sheets")
        .insert({
          school_id: selectedSchoolId,
          term,
          year,
          reporter_name: reporterName.trim(),
          reporter_phone: reporterPhone.trim(),
          file_url: urlData.publicUrl,
        } as any);

      if (sheetErr) throw sheetErr;

      toast.success("Score sheet uploaded successfully!");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const subjects = subjectList;
    const headers = ["No.", "Student Name", "Class/Grade", ...subjects, "Total", "Average", "Remarks"];
    const rows = Array.from({ length: 30 }, (_, i) => [
      (i + 1).toString(),
      "",
      "",
      ...subjects.map(() => ""),
      "",
      "",
      "",
    ]);

    const schoolName = selectedSchool?.name || "School";
    const csvContent = [
      `NYUNGA FOUNDATION - STUDENT PERFORMANCE SCORE SHEET`,
      `School: ${schoolName}`,
      `Term: ${term || "___"} | Year: ${year}`,
      `Submitted by: ${reporterName || "___"} | Phone: ${reporterPhone || "___"}`,
      ``,
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Nyunga_Performance_Sheet_${schoolName.replace(/\s/g, "_")}_${term || "Term"}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded! Fill it in and upload.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-muted/60">
        <header className="bg-card border-b border-border shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <img src={nyungaLogo} alt="Nyunga Foundation" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Nyunga Foundation</h1>
              <p className="text-xs text-muted-foreground">Student Performance Portal</p>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Submission Successful!</h2>
              <p className="text-muted-foreground">
                Performance data for <strong>{selectedSchool?.name}</strong> — {term} {year} has been received.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Submit Another
              </Button>
            </CardContent>
          </Card>
        </main>
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
            <p className="text-xs text-muted-foreground">Student Performance Monitoring Portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">End-of-Term Performance Reporting</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Schools are required to submit Nyunga Foundation students' score sheets at the end of each term.
                  You can fill in marks online or download a template, fill it offline, and upload.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School & Reporter Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              School & Reporter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>School *</Label>
              <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                <SelectTrigger><SelectValue placeholder="Select your school..." /></SelectTrigger>
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
                <Label>Your Name *</Label>
                <Input placeholder="e.g. Mr. Okello James" value={reporterName} onChange={(e) => setReporterName(e.target.value)} />
              </div>
              <div>
                <Label>Your Phone</Label>
                <Input placeholder="e.g. 0771234567" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Term *</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year *</Label>
                <Input value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Methods */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="online" className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Fill Online</TabsTrigger>
            <TabsTrigger value="upload" className="gap-2"><Upload className="h-4 w-4" /> Upload Sheet</TabsTrigger>
          </TabsList>

          <TabsContent value="online" className="mt-4 space-y-4">
            {/* Subject Management */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Subjects</CardTitle>
                <CardDescription className="text-xs">
                  Default subjects are pre-filled based on school level. Add or remove as needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {subjectList.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 pr-1">
                      {s}
                      <button onClick={() => removeSubject(s)} className="ml-1 hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom subject..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubject()}
                    className="max-w-xs"
                  />
                  <Button size="sm" variant="outline" onClick={addSubject}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Students Score Grid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Student Scores</CardTitle>
              </CardHeader>
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
                      {students.map((student, sIdx) => (
                        <tr key={sIdx} className="border-b border-border/50">
                          <td className="py-1 px-1">
                            <Input
                              placeholder="Full name"
                              value={student.name}
                              onChange={(e) => updateStudentField(sIdx, "name", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <Input
                              placeholder="S.2"
                              value={student.class_grade}
                              onChange={(e) => updateStudentField(sIdx, "class_grade", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </td>
                          {student.subjects.map((sub, subIdx) => (
                            <td key={subIdx} className="py-1 px-1">
                              <Input
                                type="number"
                                placeholder="—"
                                value={sub.marks}
                                onChange={(e) => updateMark(sIdx, subIdx, e.target.value)}
                                className="h-8 text-xs text-center w-14"
                                min="0"
                                max="100"
                              />
                            </td>
                          ))}
                          <td className="py-1 px-1">
                            <Input
                              placeholder="..."
                              value={student.remarks}
                              onChange={(e) => updateStudentField(sIdx, "remarks", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="py-1 px-1">
                            {students.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStudent(sIdx)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <Button variant="outline" size="sm" onClick={addStudent} className="gap-1">
                    <Plus className="h-4 w-4" /> Add Student
                  </Button>
                  <Button onClick={handleOnlineSubmit} disabled={submitting} className="gap-2">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? "Submitting..." : "Submit Scores"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Download Template & Upload</CardTitle>
                <CardDescription>
                  Download the score sheet template, fill it in offline (Excel, Google Sheets, etc.), then upload here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" onClick={downloadTemplate} className="gap-2 w-full">
                  <Download className="h-4 w-4" /> Download Score Sheet Template (CSV)
                </Button>

                <div className="border-t border-border pt-4 space-y-3">
                  <Label>Upload Completed Score Sheet *</Label>
                  <Input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Accepted: CSV, Excel, PDF, or scanned images (JPG, PNG)
                  </p>
                  {uploadFile && (
                    <Badge variant="secondary" className="gap-1">
                      <FileSpreadsheet className="h-3 w-3" /> {uploadFile.name}
                    </Badge>
                  )}
                </div>

                <Button
                  onClick={handleFileUpload}
                  disabled={uploading || !uploadFile}
                  className="w-full gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload Score Sheet"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SchoolPerformancePortal;
