import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users, CheckCircle, XCircle, Search, Eye, AlertTriangle,
  School, User, Phone, Mail, MapPin, BookOpen, FileText, ShieldAlert, PlusCircle, DollarSign, GraduationCap,
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

interface StudentManagementProps {
  applications: Application[];
  schools: SchoolRow[];
  expenses: Expense[];
  claims: Claim[];
  reportCards: ReportCard[];
  userId: string;
  formatUGX: (n: number) => string;
  onRefresh: () => void;
}

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

const StudentManagement = ({ applications, schools, expenses, claims, reportCards, userId, formatUGX, onRefresh }: StudentManagementProps) => {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editNotesId, setEditNotesId] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState("");

  const sponsoredStudents = applications.filter((a) => a.status === "approved");
  const getSchool = (schoolId: string | null) => schools.find((s) => s.id === schoolId);

  const filtered = sponsoredStudents.filter((a) => {
    const matchesSearch = !search || a.student_name.toLowerCase().includes(search.toLowerCase()) || a.parent_name.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || a.education_level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const updateNotes = async (appId: string) => {
    const { error } = await supabase.from("applications").update({ admin_notes: editNotesValue } as any).eq("id", appId);
    if (error) toast.error(error.message);
    else {
      toast.success("Notes updated");
      setEditNotesId(null);
      onRefresh();
    }
  };

  const stopSponsorship = async (appId: string) => {
    const { error } = await supabase.from("applications").update({ status: "rejected", admin_notes: "Sponsorship stopped by admin", reviewed_at: new Date().toISOString(), reviewed_by: userId } as any).eq("id", appId);
    if (error) toast.error(error.message);
    else { toast.success("Sponsorship stopped"); onRefresh(); }
  };

  const totalInvestment = sponsoredStudents.reduce((sum, a) => {
    const studentExpenses = expenses.filter((e) => e.application_id === a.id);
    return sum + studentExpenses.reduce((s, e) => s + e.amount, 0);
  }, 0);

  const schoolBreakdown = sponsoredStudents.reduce((acc, a) => {
    const school = getSchool(a.school_id);
    const name = school?.name || "Unassigned";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <GraduationCap size={22} className="text-primary" /> Student Management
      </h2>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Users size={24} className="text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{sponsoredStudents.length}</p>
              <p className="text-xs text-muted-foreground">Sponsored Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <School size={24} className="text-accent" />
            <div>
              <p className="text-lg font-bold text-foreground">{Object.keys(schoolBreakdown).length}</p>
              <p className="text-xs text-muted-foreground">Partner Schools</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <DollarSign size={24} className="text-secondary" />
            <div>
              <p className="text-lg font-bold text-foreground">{formatUGX(totalInvestment)}</p>
              <p className="text-xs text-muted-foreground">Total Invested</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle size={24} className="text-destructive" />
            <div>
              <p className="text-lg font-bold text-foreground">{claims.filter((c) => c.status === "open" && sponsoredStudents.some((a) => a.id === c.application_id)).length}</p>
              <p className="text-xs text-muted-foreground">Open Claims</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School breakdown */}
      {Object.keys(schoolBreakdown).length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm font-semibold mb-2 text-muted-foreground">Students per School</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(schoolBreakdown).map(([name, count]) => (
                <Badge key={name} variant="outline" className="text-sm py-1 px-3">
                  {name}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or parent..." className="pl-9" />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {Object.entries(levelLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Student list */}
      <div className="space-y-3">
        {filtered.map((app) => {
          const school = getSchool(app.school_id);
          const appExpenses = expenses.filter((e) => e.application_id === app.id);
          const appClaims = claims.filter((c) => c.application_id === app.id);
          const appReports = reportCards.filter((r) => r.application_id === app.id);
          const totalSpent = appExpenses.reduce((s, e) => s + e.amount, 0);
          const openClaimsCount = appClaims.filter((c) => c.status === "open").length;

          return (
            <Card key={app.id}>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{app.student_name}</h3>
                      <Badge variant="outline" className="text-xs">{levelLabels[app.education_level] || app.education_level}</Badge>
                      {app.class_grade && <Badge variant="secondary" className="text-xs">Class {app.class_grade}</Badge>}
                      {openClaimsCount > 0 && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle size={12} /> {openClaimsCount} claim{openClaimsCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      {school && <span className="inline-flex items-center gap-1"><School size={12} /> {school.name}</span>}
                      <span className="inline-flex items-center gap-1"><User size={12} /> {app.parent_name}</span>
                      <span className="inline-flex items-center gap-1"><Phone size={12} /> {app.parent_phone}</span>
                      {app.district && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {app.district}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground mt-1">
                      <span>Expenses: {formatUGX(totalSpent)}</span>
                      <span>Reports: {appReports.length}</span>
                      <span>Claims: {appClaims.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setSelectedApp(app); setDetailOpen(true); }}>
                      <Eye size={14} /> Details
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => stopSponsorship(app.id)}>
                      <XCircle size={14} /> Stop
                    </Button>
                  </div>
                </div>

                {/* Inline notes */}
                {editNotesId === app.id ? (
                  <div className="mt-3 border-t border-border pt-3 space-y-2">
                    <Textarea rows={2} value={editNotesValue} onChange={(e) => setEditNotesValue(e.target.value)} placeholder="Admin notes..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateNotes(app.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditNotesId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  app.admin_notes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded cursor-pointer" onClick={() => { setEditNotesId(app.id); setEditNotesValue(app.admin_notes || ""); }}>
                      📝 {app.admin_notes}
                    </p>
                  )
                )}
                {!app.admin_notes && editNotesId !== app.id && (
                  <button className="text-xs text-primary mt-2 hover:underline" onClick={() => { setEditNotesId(app.id); setEditNotesValue(""); }}>
                    + Add notes
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No sponsored students found.</CardContent></Card>
        )}
      </div>

      {/* Detail Dialog */}
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
                    <Badge variant="outline" className="ml-2">{levelLabels[selectedApp.education_level]}</Badge>
                    {selectedApp.class_grade && <Badge variant="secondary" className="text-xs">Class {selectedApp.class_grade}</Badge>}
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                    <TabsTrigger value="expenses" className="flex-1">Expenses ({appExpenses.length})</TabsTrigger>
                    <TabsTrigger value="reports" className="flex-1">Reports ({appReports.length})</TabsTrigger>
                    <TabsTrigger value="claims" className="flex-1">Claims ({appClaims.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium capitalize">{selectedApp.gender || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{selectedApp.date_of_birth ? new Date(selectedApp.date_of_birth).toLocaleDateString() : "N/A"}</span></div>
                      <div><span className="text-muted-foreground">District:</span> <span className="font-medium">{selectedApp.district || "N/A"}</span></div>
                      <div><span className="text-muted-foreground">Current School:</span> <span className="font-medium">{selectedApp.current_school || "N/A"}</span></div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2"><User size={14} className="text-muted-foreground" /> {selectedApp.parent_name}</div>
                      <div className="flex items-center gap-2"><Phone size={14} className="text-muted-foreground" /> {selectedApp.parent_phone}</div>
                      <div className="flex items-center gap-2"><Mail size={14} className="text-muted-foreground" /> {selectedApp.parent_email || "N/A"}</div>
                      <div><span className="text-muted-foreground">Relationship:</span> <span className="capitalize">{selectedApp.relationship || "Parent"}</span></div>
                    </div>
                    {school && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-muted-foreground">School:</span> <span className="font-medium">{school.name}</span></div>
                          <div><span className="text-muted-foreground">Full Fees:</span> <span className="font-medium">{formatUGX(school.full_fees)}</span></div>
                          <div><span className="text-muted-foreground">Nyunga Covers:</span> <span className="font-medium text-accent">{formatUGX(school.nyunga_covered_fees)}</span></div>
                          <div><span className="text-muted-foreground">Parent Pays:</span> <span className="font-medium text-secondary">{formatUGX(school.parent_pays || 0)}</span></div>
                        </div>
                      </>
                    )}
                    {selectedApp.reason && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-1">Reason for Support</p>
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
                              <span className="text-xs text-muted-foreground ml-2 capitalize">{exp.category}</span>
                            </div>
                            <span className="font-semibold">{formatUGX(exp.amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">No expenses recorded.</p>
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
                      <p className="text-sm text-muted-foreground py-4 text-center">No report cards uploaded.</p>
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
                              </CardContent>
                            </Card>
                          );
                        })}
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

export default StudentManagement;
