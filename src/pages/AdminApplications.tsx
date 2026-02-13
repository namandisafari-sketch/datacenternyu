import { useEffect, useState } from "react";
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
  Users, CheckCircle, XCircle, PlusCircle, Search,
  Eye, AlertTriangle, School, User, Phone, Mail, MapPin, BookOpen, FileText, ShieldAlert,
} from "lucide-react";

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
  sub_county: string | null;
  parish: string | null;
  village: string | null;
  reason: string | null;
  school_id: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  passport_photo_url: string | null;
  registration_number: string | null;
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

const AdminApplications = () => {
  const { user } = useAuth();
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
    if (user) fetchData();
  }, [user]);

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

  const getSchool = (schoolId: string | null) => schools.find((s) => s.id === schoolId);
  const approvedApps = applications.filter((a) => a.status === "approved");

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  const filtered = applications.filter((a) => {
    const matchesFilter = filter === "all" || a.status === filter;
    const matchesSearch = !search || a.student_name.toLowerCase().includes(search.toLowerCase()) || a.parent_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" /> Applications
      </h1>

      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-3">
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
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setSelectedApp(app); setDetailOpen(true); }}>
                      <Eye size={14} /> View
                    </Button>
                  </div>
                </div>

                {(app.status === "pending" || app.status === "under_review") && (
                  <div className="border-t border-border pt-3 mt-3 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Admin Notes</Label>
                      <Textarea rows={2} value={reviewNotes[app.id] || ""} onChange={(e) => setReviewNotes((p) => ({ ...p, [app.id]: e.target.value }))} placeholder="Add notes..." />
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
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                    <TabsTrigger value="expenses" className="flex-1">Expenses ({appExpenses.length})</TabsTrigger>
                    <TabsTrigger value="reports" className="flex-1">Reports ({appReports.length})</TabsTrigger>
                    <TabsTrigger value="claims" className="flex-1">Claims ({appClaims.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-5 mt-4">
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2"><User size={16} /> Student</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedApp.student_name}</span></div>
                        <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium capitalize">{selectedApp.gender || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{selectedApp.date_of_birth ? new Date(selectedApp.date_of_birth).toLocaleDateString() : "N/A"}</span></div>
                        <div><span className="text-muted-foreground">Level:</span> <span className="font-medium">{levelLabels[selectedApp.education_level] || selectedApp.education_level}</span></div>
                        <div><span className="text-muted-foreground">Class:</span> <span className="font-medium">{selectedApp.class_grade || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">District:</span> <span className="font-medium">{selectedApp.district || "N/A"}</span></div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2"><Users size={16} /> Parent/Guardian</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2"><User size={14} className="text-muted-foreground" /> {selectedApp.parent_name}</div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-muted-foreground" /> {selectedApp.parent_phone}</div>
                        <div className="flex items-center gap-2"><Mail size={14} className="text-muted-foreground" /> {selectedApp.parent_email || "N/A"}</div>
                        <div><span className="text-muted-foreground">Relationship:</span> <span className="font-medium capitalize">{selectedApp.relationship || "Parent"}</span></div>
                      </div>
                    </div>
                    {school && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2"><School size={16} /> School</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-muted-foreground">School:</span> <span className="font-medium">{school.name}</span></div>
                            <div><span className="text-muted-foreground">Full Fees:</span> <span className="font-medium">{formatUGX(school.full_fees)}</span></div>
                            <div><span className="text-muted-foreground">Covered:</span> <span className="font-medium text-accent">{formatUGX(school.nyunga_covered_fees)}</span></div>
                            <div><span className="text-muted-foreground">Parent Pays:</span> <span className="font-medium text-secondary">{formatUGX(school.parent_pays || 0)}</span></div>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedApp.reason && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold text-sm text-primary mb-2">Reason for Support</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedApp.reason}</p>
                        </div>
                      </>
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
                        {appClaims.map((claim) => (
                          <Card key={claim.id}>
                            <CardContent className="py-3">
                              <div className="flex items-center justify-between">
                                <Badge variant={claim.status === "open" ? "destructive" : "outline"}>{claim.status}</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(claim.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm mt-2">{claim.description}</p>
                              {claim.action_taken && <p className="text-xs text-muted-foreground mt-1">Action: {claim.action_taken}</p>}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No claims filed.</p>
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

export default AdminApplications;
