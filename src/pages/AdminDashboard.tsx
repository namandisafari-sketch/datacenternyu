import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users, CheckCircle, XCircle, Clock, DollarSign, PlusCircle, Search,
  Eye, AlertTriangle, School, User, Phone, Mail, MapPin, BookOpen, FileText, ShieldAlert, GraduationCap,
} from "lucide-react";
import AdminStats from "@/components/admin/AdminStats";
import SchoolAccountsSection from "@/components/admin/SchoolAccountsSection";
import StudentManagement from "@/components/admin/StudentManagement";

interface Application {
  id: string;
  user_id: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  relationship: string | null;
  student_name: string;
  education_level: string;
  class_grade: string | null;
  date_of_birth: string | null;
  gender: string | null;
  current_school: string | null;
  district: string | null;
  reason: string | null;
  school_id: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface SchoolRow {
  id: string;
  name: string;
  level: string;
  district: string;
  requirements: string | null;
  full_fees: number;
  nyunga_covered_fees: number;
  parent_pays: number | null;
  boarding_available: boolean | null;
}

interface Expense {
  id: string;
  application_id: string;
  description: string;
  amount: number;
  category: string;
  term: string;
  created_at: string;
}

interface Claim {
  id: string;
  application_id: string;
  school_id: string | null;
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

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const claimTypes = [
  { value: "disciplinary", label: "Disciplinary Issue" },
  { value: "attendance", label: "Poor Attendance" },
  { value: "performance", label: "Poor Performance" },
  { value: "misconduct", label: "Misconduct" },
  { value: "dropout", label: "Dropout Risk" },
  { value: "general", label: "General Report" },
];

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expenseForm, setExpenseForm] = useState({ applicationId: "", description: "", amount: "", category: "tuition", term: "" });
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({ applicationId: "", schoolId: "", claimType: "general", description: "", actionTaken: "" });
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    const [appsRes, expsRes, schoolsRes, claimsRes, reportsRes] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("schools").select("*"),
      supabase.from("student_claims").select("*").order("created_at", { ascending: false }),
      supabase.from("report_cards").select("*").order("created_at", { ascending: false }),
    ]);
    setApplications((appsRes.data as unknown as Application[]) || []);
    setExpenses((expsRes.data as unknown as Expense[]) || []);
    setSchools((schoolsRes.data as unknown as SchoolRow[]) || []);
    setClaims((claimsRes.data as unknown as Claim[]) || []);
    setReportCards((reportsRes.data as unknown as ReportCard[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  const updateStatus = async (appId: string, status: string) => {
    const notes = reviewNotes[appId] || "";
    const { error } = await supabase
      .from("applications")
      .update({ status, admin_notes: notes, reviewed_at: new Date().toISOString(), reviewed_by: user!.id } as any)
      .eq("id", appId);
    if (error) toast.error(error.message);
    else { toast.success(`Application ${status}`); fetchData(); }
  };

  const addExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.applicationId) {
      toast.error("Fill in all fields"); return;
    }
    const { error } = await supabase.from("expenses").insert({
      application_id: expenseForm.applicationId,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      term: expenseForm.term,
      recorded_by: user!.id,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Expense recorded");
      setExpenseForm({ applicationId: "", description: "", amount: "", category: "tuition", term: "" });
      setExpenseDialogOpen(false);
      fetchData();
    }
  };

  const addClaim = async () => {
    if (!claimForm.applicationId || !claimForm.description) {
      toast.error("Select a student and describe the issue"); return;
    }
    const { error } = await supabase.from("student_claims").insert({
      application_id: claimForm.applicationId,
      school_id: claimForm.schoolId || null,
      claim_type: claimForm.claimType,
      description: claimForm.description,
      action_taken: claimForm.actionTaken,
      created_by: user!.id,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Claim recorded");
      setClaimForm({ applicationId: "", schoolId: "", claimType: "general", description: "", actionTaken: "" });
      setClaimDialogOpen(false);
      fetchData();
    }
  };

  const resolveClaim = async (claimId: string, actionTaken: string) => {
    const { error } = await supabase.from("student_claims").update({
      status: "resolved",
      action_taken: actionTaken,
      resolved_by: user!.id,
      resolved_at: new Date().toISOString(),
    } as any).eq("id", claimId);
    if (error) toast.error(error.message);
    else { toast.success("Claim resolved"); fetchData(); }
  };

  const getSchool = (schoolId: string | null) => schools.find((s) => s.id === schoolId);

  const openDetail = (app: Application) => {
    setSelectedApp(app);
    setDetailOpen(true);
  };

  if (authLoading || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const filtered = applications.filter((a) => {
    const matchesFilter = filter === "all" || a.status === filter;
    const matchesSearch = !search || a.student_name.toLowerCase().includes(search.toLowerCase()) || a.parent_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    totalSpent: expenses.reduce((s, e) => s + e.amount, 0),
    openClaims: claims.filter((c) => c.status === "open").length,
  };

  const approvedApps = applications.filter((a) => a.status === "approved");

  return (
    <div className="py-10 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>

        <AdminStats {...counts} formatUGX={formatUGX} />

        {/* Main tabs */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="w-full max-w-xl">
            <TabsTrigger value="applications" className="flex-1 gap-1"><FileText size={16} /> Applications</TabsTrigger>
            <TabsTrigger value="students" className="flex-1 gap-1"><GraduationCap size={16} /> Students</TabsTrigger>
            <TabsTrigger value="schools" className="flex-1 gap-1"><School size={16} /> Schools</TabsTrigger>
          </TabsList>

          {/* ===== APPLICATIONS TAB ===== */}
          <TabsContent value="applications">
            {/* Filters & Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or parent..." className="pl-9" />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Record Expense */}
              <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                    <PlusCircle size={18} /> Record Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">Record Expense</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Student (Approved)</Label>
                      <Select value={expenseForm.applicationId} onValueChange={(v) => setExpenseForm((p) => ({ ...p, applicationId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                        <SelectContent>{approvedApps.map((a) => <SelectItem key={a.id} value={a.id}>{a.student_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} placeholder="e.g. Tuition Term 1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Amount (UGX)</Label>
                        <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Term</Label>
                        <Input value={expenseForm.term} onChange={(e) => setExpenseForm((p) => ({ ...p, term: e.target.value }))} placeholder="Term 1 2025" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm((p) => ({ ...p, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tuition">Tuition</SelectItem>
                          <SelectItem value="materials">Scholastic Materials</SelectItem>
                          <SelectItem value="uniform">Uniform</SelectItem>
                          <SelectItem value="boarding">Boarding</SelectItem>
                          <SelectItem value="examination">Examination Fees</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addExpense} className="w-full bg-primary text-primary-foreground">Save Expense</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* File Claim */}
              <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <ShieldAlert size={18} /> File Claim
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">File a Claim on Student</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Student</Label>
                      <Select value={claimForm.applicationId} onValueChange={(v) => setClaimForm((p) => ({ ...p, applicationId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                        <SelectContent>{approvedApps.map((a) => <SelectItem key={a.id} value={a.id}>{a.student_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reporting School (optional)</Label>
                      <Select value={claimForm.schoolId} onValueChange={(v) => setClaimForm((p) => ({ ...p, schoolId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select school..." /></SelectTrigger>
                        <SelectContent>{schools.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
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
                    <div className="space-y-2">
                      <Label>Action Taken (optional)</Label>
                      <Input value={claimForm.actionTaken} onChange={(e) => setClaimForm((p) => ({ ...p, actionTaken: e.target.value }))} placeholder="e.g. Sponsorship suspended" />
                    </div>
                    <Button onClick={addClaim} className="w-full" variant="destructive">Submit Claim</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Applications list */}
            <div className="space-y-4">
              {filtered.map((app) => {
                const appExpenses = expenses.filter((e) => e.application_id === app.id);
                const appClaims = claims.filter((c) => c.application_id === app.id);
                const totalSpent = appExpenses.reduce((s, e) => s + e.amount, 0);
                const school = getSchool(app.school_id);
                const openClaimsCount = appClaims.filter((c) => c.status === "open").length;

                return (
                  <Card key={app.id}>
                    <CardContent className="py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg text-foreground">{app.student_name}</h3>
                            {openClaimsCount > 0 && (
                              <Badge variant="destructive" className="gap-1 text-xs">
                                <AlertTriangle size={12} /> {openClaimsCount} claim{openClaimsCount > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><User size={12} /> {app.parent_name}</span>
                            <span className="mx-1">•</span>
                            <span className="inline-flex items-center gap-1"><Phone size={12} /> {app.parent_phone}</span>
                            <span className="mx-1">•</span>
                            <span className="inline-flex items-center gap-1"><BookOpen size={12} /> {levelLabels[app.education_level] || app.education_level}</span>
                            {app.class_grade && <span className="mx-1">• Class: {app.class_grade}</span>}
                            {school && <><span className="mx-1">•</span><span className="inline-flex items-center gap-1"><School size={12} /> {school.name}</span></>}
                            {app.district && <><span className="mx-1">•</span><span className="inline-flex items-center gap-1"><MapPin size={12} /> {app.district}</span></>}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{app.status}</Badge>
                          <Button size="sm" variant="ghost" className="gap-1" onClick={() => openDetail(app)}>
                            <Eye size={14} /> View
                          </Button>
                        </div>
                      </div>

                      {(app.status === "pending" || app.status === "under_review") && (
                        <div className="border-t border-border pt-3 mt-3 space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Admin Notes</Label>
                            <Textarea
                              rows={2}
                              value={reviewNotes[app.id] || ""}
                              onChange={(e) => setReviewNotes((p) => ({ ...p, [app.id]: e.target.value }))}
                              placeholder="Add notes about this application..."
                            />
                          </div>
                          <div className="flex gap-2">
                            {app.status === "pending" && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, "under_review")}>Mark Under Review</Button>
                            )}
                            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1" onClick={() => updateStatus(app.id, "approved")}>
                              <CheckCircle size={14} /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateStatus(app.id, "rejected")}>
                              <XCircle size={14} /> Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {app.status === "approved" && appExpenses.length > 0 && (
                        <div className="border-t border-border pt-3 mt-3">
                          <div className="flex justify-between mb-1">
                            <p className="text-sm font-medium">Expenses</p>
                            <p className="text-sm font-semibold text-secondary">Total: {formatUGX(totalSpent)}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {filtered.length === 0 && (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No applications found.</CardContent></Card>
              )}
            </div>
          </TabsContent>

          {/* ===== STUDENTS TAB ===== */}
          <TabsContent value="students">
            <StudentManagement
              applications={applications}
              schools={schools}
              expenses={expenses}
              claims={claims}
              reportCards={reportCards}
              userId={user!.id}
              formatUGX={formatUGX}
              onRefresh={fetchData}
            />
          </TabsContent>

          {/* ===== SCHOOLS TAB ===== */}
          <TabsContent value="schools">
            <SchoolAccountsSection schools={schools} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedApp && (() => {
            const school = getSchool(selectedApp.school_id);
            const appExpenses = expenses.filter((e) => e.application_id === selectedApp.id);
            const appClaims = claims.filter((c) => c.application_id === selectedApp.id);
            const appReports = reportCards.filter((r) => r.application_id === selectedApp.id);
            const totalSpent = appExpenses.reduce((s, e) => s + e.amount, 0);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl flex items-center gap-2">
                    {selectedApp.student_name}
                    <Badge variant="outline" className="ml-2">{selectedApp.status}</Badge>
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1">Full Info</TabsTrigger>
                    <TabsTrigger value="requirements" className="flex-1">Requirements</TabsTrigger>
                    <TabsTrigger value="expenses" className="flex-1">Expenses ({appExpenses.length})</TabsTrigger>
                    <TabsTrigger value="reports" className="flex-1">Reports ({appReports.length})</TabsTrigger>
                    <TabsTrigger value="claims" className="flex-1">Claims ({appClaims.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-5 mt-4">
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2"><User size={16} /> Student Information</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Full Name:</span> <span className="font-medium">{selectedApp.student_name}</span></div>
                        <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium capitalize">{selectedApp.gender || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">Date of Birth:</span> <span className="font-medium">{selectedApp.date_of_birth ? new Date(selectedApp.date_of_birth).toLocaleDateString() : "N/A"}</span></div>
                        <div><span className="text-muted-foreground">Education Level:</span> <span className="font-medium">{levelLabels[selectedApp.education_level] || selectedApp.education_level}</span></div>
                        <div><span className="text-muted-foreground">Class / Grade:</span> <span className="font-medium">{selectedApp.class_grade || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">District:</span> <span className="font-medium">{selectedApp.district || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">Current School:</span> <span className="font-medium">{selectedApp.current_school || "N/A"}</span></div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2"><Users size={16} /> Parent / Guardian Information</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2"><User size={14} className="text-muted-foreground" /> <span className="font-medium">{selectedApp.parent_name}</span></div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-muted-foreground" /> <span className="font-medium">{selectedApp.parent_phone}</span></div>
                        <div className="flex items-center gap-2"><Mail size={14} className="text-muted-foreground" /> <span className="font-medium">{selectedApp.parent_email || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">Relationship:</span> <span className="font-medium capitalize">{selectedApp.relationship || "Parent"}</span></div>
                      </div>
                    </div>
                    <Separator />
                    {school && (
                      <div>
                        <h4 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2"><School size={16} /> School Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-muted-foreground">School:</span> <span className="font-medium">{school.name}</span></div>
                          <div><span className="text-muted-foreground">District:</span> <span className="font-medium">{school.district}</span></div>
                          <div><span className="text-muted-foreground">Full Fees:</span> <span className="font-medium">{formatUGX(school.full_fees)}</span></div>
                          <div><span className="text-muted-foreground">Nyunga Covers:</span> <span className="font-medium text-accent">{formatUGX(school.nyunga_covered_fees)}</span></div>
                          <div><span className="text-muted-foreground">Parent Pays:</span> <span className="font-medium text-secondary">{formatUGX(school.parent_pays || 0)}</span></div>
                          <div><span className="text-muted-foreground">Boarding:</span> <span className="font-medium">{school.boarding_available ? "Yes" : "No"}</span></div>
                        </div>
                      </div>
                    )}
                    {selectedApp.reason && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2"><FileText size={16} /> Reason for Support</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedApp.reason}</p>
                        </div>
                      </>
                    )}
                    {selectedApp.admin_notes && (
                      <div>
                        <h4 className="font-semibold text-sm text-primary mb-2">Admin Notes</h4>
                        <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedApp.admin_notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="requirements" className="mt-4">
                    {school?.requirements ? (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm">School Requirements for {school.name}</h4>
                        <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">{school.requirements}</div>
                        <Separator />
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Student Checklist</h4>
                          <div className="space-y-2 text-sm">
                            {[
                              { ok: !!selectedApp.date_of_birth, label: "Date of birth provided" },
                              { ok: !!selectedApp.gender, label: "Gender specified" },
                              { ok: !!selectedApp.district, label: "District provided" },
                              { ok: !!selectedApp.parent_phone, label: "Parent contact available" },
                              { ok: !!selectedApp.reason, label: "Reason for support provided" },
                            ].map((item) => (
                              <div key={item.label} className="flex items-center gap-2">
                                {item.ok ? <CheckCircle size={16} className="text-accent" /> : <XCircle size={16} className="text-destructive" />}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No specific requirements set for this school.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="expenses" className="mt-4">
                    {appExpenses.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <p className="font-semibold text-sm">All Expenses</p>
                          <p className="font-semibold text-sm text-secondary">Total: {formatUGX(totalSpent)}</p>
                        </div>
                        {appExpenses.map((exp) => (
                          <div key={exp.id} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                            <div>
                              <span className="font-medium">{exp.description}</span>
                              {exp.term && <span className="text-muted-foreground ml-2">({exp.term})</span>}
                              <span className="text-xs text-muted-foreground ml-2 capitalize">{exp.category}</span>
                            </div>
                            <span className="font-semibold">{formatUGX(exp.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No expenses recorded yet.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="reports" className="mt-4">
                    {appReports.length > 0 ? (
                      <div className="space-y-3">
                        {appReports.map((report) => (
                          <div key={report.id} className="flex justify-between items-center text-sm p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium">{report.term} {report.year}</p>
                              {report.notes && <p className="text-xs text-muted-foreground mt-1">{report.notes}</p>}
                              <p className="text-xs text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</p>
                            </div>
                            <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1"><FileText size={14} /> View</Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No report cards uploaded yet.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="claims" className="mt-4">
                    {appClaims.length > 0 ? (
                      <div className="space-y-3">
                        {appClaims.map((claim) => {
                          const claimSchool = getSchool(claim.school_id);
                          return (
                            <Card key={claim.id}>
                              <CardContent className="py-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={claim.status === "open" ? "destructive" : "outline"} className="text-xs">{claim.status}</Badge>
                                    <span className="text-xs font-medium capitalize">{claimTypes.find((t) => t.value === claim.claim_type)?.label || claim.claim_type}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{new Date(claim.created_at).toLocaleDateString()}</span>
                                </div>
                                {claimSchool && <p className="text-xs text-muted-foreground">Reported by: {claimSchool.name}</p>}
                                <p className="text-sm">{claim.description}</p>
                                {claim.action_taken && <p className="text-xs text-muted-foreground">Action: {claim.action_taken}</p>}
                                {claim.status === "open" && (
                                  <div className="pt-2 flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => resolveClaim(claim.id, "Sponsorship continues with warning")}>
                                      Resolve with Warning
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => {
                                      resolveClaim(claim.id, "Sponsorship suspended");
                                      updateStatus(selectedApp.id, "rejected");
                                    }}>
                                      Stop Sponsorship
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No claims filed for this student.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
