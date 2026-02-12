import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, ShieldAlert, FileText, Upload, Search, User, BookOpen, GraduationCap,
} from "lucide-react";

interface Application {
  id: string;
  student_name: string;
  education_level: string;
  class_grade: string | null;
  gender: string | null;
  date_of_birth: string | null;
  parent_name: string;
  parent_phone: string;
  status: string;
  school_id: string | null;
}

interface Claim {
  id: string;
  application_id: string;
  claim_type: string;
  description: string;
  action_taken: string | null;
  status: string;
  created_at: string;
}

interface ReportCard {
  id: string;
  application_id: string;
  term: string;
  year: string;
  file_url: string;
  notes: string | null;
  created_at: string;
}

const claimTypes = [
  { value: "disciplinary", label: "Disciplinary Issue" },
  { value: "attendance", label: "Poor Attendance" },
  { value: "performance", label: "Poor Performance" },
  { value: "misconduct", label: "Misconduct" },
  { value: "dropout", label: "Dropout Risk" },
  { value: "general", label: "General Report" },
];

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const SchoolDashboard = () => {
  const { user, isSchool, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Application[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [claimForm, setClaimForm] = useState({ applicationId: "", claimType: "general", description: "" });
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  const [reportForm, setReportForm] = useState({ applicationId: "", term: "", year: "", notes: "" });
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isSchool)) navigate("/auth");
  }, [user, isSchool, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    // Get school link
    const { data: schoolLink } = await supabase
      .from("school_users")
      .select("school_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!schoolLink) { setLoading(false); return; }

    const { data: school } = await supabase
      .from("schools")
      .select("id, name")
      .eq("id", schoolLink.school_id)
      .maybeSingle();

    setSchoolInfo(school as any);

    const [appsRes, claimsRes, reportsRes] = await Promise.all([
      supabase.from("applications").select("*").eq("school_id", schoolLink.school_id).eq("status", "approved"),
      supabase.from("student_claims").select("*").order("created_at", { ascending: false }),
      supabase.from("report_cards").select("*").order("created_at", { ascending: false }),
    ]);

    setStudents((appsRes.data as unknown as Application[]) || []);
    setClaims((claimsRes.data as unknown as Claim[]) || []);
    setReportCards((reportsRes.data as unknown as ReportCard[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user && isSchool) fetchData();
  }, [user, isSchool]);

  const submitClaim = async () => {
    if (!claimForm.applicationId || !claimForm.description) {
      toast.error("Select a student and describe the issue"); return;
    }
    const { error } = await supabase.from("student_claims").insert({
      application_id: claimForm.applicationId,
      school_id: schoolInfo?.id || null,
      claim_type: claimForm.claimType,
      description: claimForm.description,
      created_by: user!.id,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Claim filed successfully");
      setClaimForm({ applicationId: "", claimType: "general", description: "" });
      setClaimDialogOpen(false);
      fetchData();
    }
  };

  const uploadReport = async () => {
    if (!reportForm.applicationId || !reportFile || !reportForm.term || !reportForm.year) {
      toast.error("Fill in all required fields and select a file"); return;
    }
    setUploading(true);

    const fileExt = reportFile.name.split(".").pop();
    const filePath = `${reportForm.applicationId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("report-cards")
      .upload(filePath, reportFile);

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("report-cards").getPublicUrl(filePath);

    const { error } = await supabase.from("report_cards").insert({
      application_id: reportForm.applicationId,
      school_id: schoolInfo?.id || null,
      term: reportForm.term,
      year: reportForm.year,
      file_url: urlData.publicUrl,
      notes: reportForm.notes,
      uploaded_by: user!.id,
    } as any);

    setUploading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Report card uploaded");
      setReportForm({ applicationId: "", term: "", year: "", notes: "" });
      setReportFile(null);
      setReportDialogOpen(false);
      fetchData();
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const filtered = students.filter(
    (s) => !search || s.student_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-10 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-primary">School Portal</h1>
          {schoolInfo && <p className="text-muted-foreground mt-1">{schoolInfo.name}</p>}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-5 flex items-center gap-4">
              <Users size={28} className="text-primary" />
              <div>
                <p className="text-xl font-bold text-foreground">{students.length}</p>
                <p className="text-xs text-muted-foreground">Nyunga Students</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 flex items-center gap-4">
              <ShieldAlert size={28} className="text-destructive" />
              <div>
                <p className="text-xl font-bold text-foreground">{claims.filter((c) => c.status === "open").length}</p>
                <p className="text-xs text-muted-foreground">Open Claims</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 flex items-center gap-4">
              <FileText size={28} className="text-secondary" />
              <div>
                <p className="text-xl font-bold text-foreground">{reportCards.length}</p>
                <p className="text-xs text-muted-foreground">Report Cards Uploaded</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." className="pl-9" />
          </div>

          <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2"><ShieldAlert size={18} /> File Claim</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">File a Claim</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={claimForm.applicationId} onValueChange={(v) => setClaimForm((p) => ({ ...p, applicationId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.student_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Claim Type</Label>
                  <Select value={claimForm.claimType} onValueChange={(v) => setClaimForm((p) => ({ ...p, claimType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{claimTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea rows={3} value={claimForm.description} onChange={(e) => setClaimForm((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the issue..." />
                </div>
                <Button onClick={submitClaim} className="w-full" variant="destructive">Submit Claim</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"><Upload size={18} /> Upload Report Card</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Upload Report Card</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Student *</Label>
                  <Select value={reportForm.applicationId} onValueChange={(v) => setReportForm((p) => ({ ...p, applicationId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                    <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.student_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Term *</Label>
                    <Select value={reportForm.term} onValueChange={(v) => setReportForm((p) => ({ ...p, term: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year *</Label>
                    <Input value={reportForm.year} onChange={(e) => setReportForm((p) => ({ ...p, year: e.target.value }))} placeholder="2026" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Report Card File *</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setReportFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground">PDF or image (JPG, PNG)</p>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea rows={2} value={reportForm.notes} onChange={(e) => setReportForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any comments about performance..." />
                </div>
                <Button onClick={uploadReport} disabled={uploading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {uploading ? "Uploading..." : "Upload Report Card"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Students List */}
        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="claims">Claims ({claims.length})</TabsTrigger>
            <TabsTrigger value="reports">Report Cards ({reportCards.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-4 space-y-3">
            {filtered.map((s) => {
              const studentReports = reportCards.filter((r) => r.application_id === s.id);
              const studentClaims = claims.filter((c) => c.application_id === s.id);
              return (
                <Card key={s.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <User size={16} /> {s.student_name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="inline-flex items-center gap-1"><BookOpen size={12} /> {levelLabels[s.education_level] || s.education_level}</span>
                          {s.class_grade && <span className="mx-1">• Class: {s.class_grade}</span>}
                          {s.gender && <span className="mx-1">• {s.gender}</span>}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="outline">{studentReports.length} reports</Badge>
                        {studentClaims.filter((c) => c.status === "open").length > 0 && (
                          <Badge variant="destructive">{studentClaims.filter((c) => c.status === "open").length} open claims</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No students found.</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="claims" className="mt-4 space-y-3">
            {claims.map((claim) => {
              const student = students.find((s) => s.id === claim.application_id);
              return (
                <Card key={claim.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={claim.status === "open" ? "destructive" : "outline"}>{claim.status}</Badge>
                        <span className="text-sm font-medium capitalize">{claimTypes.find((t) => t.value === claim.claim_type)?.label || claim.claim_type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(claim.created_at).toLocaleDateString()}</span>
                    </div>
                    {student && <p className="text-sm text-muted-foreground mb-1">Student: {student.student_name}</p>}
                    <p className="text-sm">{claim.description}</p>
                    {claim.action_taken && <p className="text-xs text-muted-foreground mt-1">Action: {claim.action_taken}</p>}
                  </CardContent>
                </Card>
              );
            })}
            {claims.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No claims filed.</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-4 space-y-3">
            {reportCards.map((report) => {
              const student = students.find((s) => s.id === report.application_id);
              return (
                <Card key={report.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          <GraduationCap size={16} /> {student?.student_name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">{report.term} {report.year}</p>
                        {report.notes && <p className="text-xs text-muted-foreground mt-1">{report.notes}</p>}
                      </div>
                      <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1"><FileText size={14} /> View</Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {reportCards.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No report cards uploaded yet.</CardContent></Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SchoolDashboard;
