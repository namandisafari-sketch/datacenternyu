import { useState, useRef, useCallback } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Users, CheckCircle, XCircle, Search, Eye, AlertTriangle,
  School, User, Phone, Mail, MapPin, BookOpen, FileText, ShieldAlert, PlusCircle, DollarSign, GraduationCap, ArrowRightLeft, Pencil, Printer,
} from "lucide-react";
import ApplicationFullDetail, { FullApplication } from "./ApplicationFullDetail";
import ApplicationEditForm from "./ApplicationEditForm";
import PrintableApplicationForm from "@/components/register/PrintableApplicationForm";
import { ApplicationForm } from "@/components/register/types";

type Application = FullApplication;

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
  const [reassignAppId, setReassignAppId] = useState<string | null>(null);
  const [reassignSchoolId, setReassignSchoolId] = useState("");
  const [editMode, setEditMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const mapAppToForm = useCallback((app: Application): ApplicationForm => {
    const fd = (app.father_details || {}) as any;
    const md = (app.mother_details || {}) as any;
    const gd = (app.guardian_details || {}) as any;
    const nk = (app.next_of_kin || {}) as any;
    const nr = (app.nearby_relative || {}) as any;
    const nn = (app.nearest_neighbor || {}) as any;
    const ar = (app.academic_results || {}) as any;
    const ps = (app.previous_schools || {}) as any;
    const sg = Array.isArray(app.subject_grades) ? (app.subject_grades as any[]).map((s: any) => ({ name: s.name || "", grade: s.grade || "" })) : [];
    const mkParent = (d: any) => ({ name: d?.name || "", occupation: d?.occupation || "", nin: d?.nin || "", residence: d?.residence || "", telephone: d?.telephone || "", religion: d?.religion || "", tribe: d?.tribe || "" });
    return {
      educationLevel: app.education_level as any,
      studentName: app.student_name,
      dateOfBirth: app.date_of_birth || "",
      gender: app.gender || "",
      religion: app.religion || "",
      nationality: app.nationality || "",
      tribe: app.tribe || "",
      nin: app.nin || "",
      classGrade: app.class_grade || "",
      subjectCombination: app.subject_combination || "",
      courseProgram: app.course_program || "",
      currentSchool: app.current_school || "",
      previousSchools: { primaryPle: ps?.primaryPle || "", secondaryUce: ps?.secondaryUce || "", secondaryUace: ps?.secondaryUace || "", universityInstitute: ps?.universityInstitute || "" },
      academicResults: { pleYear: ar?.pleYear || "", pleIndex: ar?.pleIndex || "", pleAggregates: ar?.pleAggregates || "", pleGrade: ar?.pleGrade || "", pleEnglish: ar?.pleEnglish || "", pleMath: ar?.pleMath || "", pleSst: ar?.pleSst || "", pleScience: ar?.pleScience || "", uceYear: ar?.uceYear || "", uceIndex: ar?.uceIndex || "", uceGrade: ar?.uceGrade || "", uaceYear: ar?.uaceYear || "", uaceIndex: ar?.uaceIndex || "", uacePoints: ar?.uacePoints || "", uaceCombination: ar?.uaceCombination || "" },
      subjectGrades: sg,
      district: app.district || "",
      village: app.village || "",
      parish: app.parish || "",
      subCounty: app.sub_county || "",
      lciChairperson: app.lci_chairperson || "",
      lciContact: app.lci_contact || "",
      orphanStatus: app.orphan_status || "",
      deceasedParent: app.deceased_parent || "",
      physicalDefect: app.physical_defect || false,
      physicalDefectDetails: app.physical_defect_details || "",
      chronicDisease: app.chronic_disease || false,
      chronicDiseaseDetails: app.chronic_disease_details || "",
      fatherDetails: mkParent(fd),
      motherDetails: mkParent(md),
      whoPaysFees: app.who_pays_fees || "",
      guardianDetails: { name: gd?.name || "", relationship: gd?.relationship || "", occupation: gd?.occupation || "", nin: gd?.nin || "", residence: gd?.residence || "", placeOfWork: gd?.placeOfWork || "", contact: gd?.contact || "" },
      nextOfKin: { name: nk?.name || "", residence: nk?.residence || "", relationship: nk?.relationship || "", telephone: nk?.telephone || "" },
      nearbyRelative: { name: nr?.name || "", address: nr?.address || "", contact: nr?.contact || "" },
      nearestNeighbor: { name: nn?.name || "", contacts: nn?.contacts || "" },
      previousFeesAmount: app.previous_fees_amount || 0,
      affordableFeesAmount: app.affordable_fees_amount || 0,
      parentName: app.parent_name,
      parentPhone: app.parent_phone,
      parentEmail: app.parent_email || "",
      parentNin: "",
      parentOccupation: "",
      relationship: app.relationship || "",
      personalStatement: "",
      declarationConsent: app.declaration_consent || false,
      declarationDate: app.declaration_date || "",
      parentIdUrl: "",
      birthCertificateUrl: "",
      reportCardUrl: "",
      proofOfNeedUrl: "",
      transcriptUrl: "",
      admissionLetterUrl: "",
      schoolId: app.school_id || "",
    } as ApplicationForm;
  }, []);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Please allow popups to print"); return; }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Bursary Application Form</title><style>@page{size:A4;margin:0}body{margin:0;padding:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${printRef.current.innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }, []);

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

  const reassignSchool = async () => {
    if (!reassignAppId || !reassignSchoolId) return;
    const { error } = await supabase.from("applications").update({ school_id: reassignSchoolId } as any).eq("id", reassignAppId);
    if (error) toast.error(error.message);
    else {
      toast.success("Student reassigned to new school");
      setReassignAppId(null);
      setReassignSchoolId("");
      onRefresh();
    }
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {/* Student card grid */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No sponsored students found.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => {
            const school = getSchool(app.school_id);
            const appExpenses = expenses.filter((e) => e.application_id === app.id);
            const appClaims = claims.filter((c) => c.application_id === app.id);
            const appReports = reportCards.filter((r) => r.application_id === app.id);
            const totalSpent = appExpenses.reduce((s, e) => s + e.amount, 0);
            const openClaimsCount = appClaims.filter((c) => c.status === "open").length;

            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">{app.student_name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{levelLabels[app.education_level] || app.education_level}</Badge>
                        {app.class_grade && <Badge variant="secondary" className="text-[10px]">Class {app.class_grade}</Badge>}
                      </div>
                    </div>
                    {openClaimsCount > 0 && (
                      <Badge variant="destructive" className="gap-1 text-[10px] shrink-0">
                        <AlertTriangle size={10} /> {openClaimsCount}
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {school && <p className="flex items-center gap-1 truncate"><School size={12} className="shrink-0" /> {school.name}</p>}
                    <p className="flex items-center gap-1 truncate"><User size={12} className="shrink-0" /> {app.parent_name}</p>
                    <p className="flex items-center gap-1"><Phone size={12} className="shrink-0" /> {app.parent_phone}</p>
                    {app.district && <p className="flex items-center gap-1"><MapPin size={12} className="shrink-0" /> {app.district}</p>}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-border pt-2">
                    <div><p className="font-semibold text-foreground">{formatUGX(totalSpent)}</p><p className="text-muted-foreground">Expenses</p></div>
                    <div><p className="font-semibold text-foreground">{appReports.length}</p><p className="text-muted-foreground">Reports</p></div>
                    <div><p className="font-semibold text-foreground">{appClaims.length}</p><p className="text-muted-foreground">Claims</p></div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-1 border-t border-border pt-2">
                    <Button size="sm" variant="ghost" className="gap-1 text-xs flex-1" onClick={() => { setSelectedApp(app); setDetailOpen(true); }}>
                      <Eye size={12} /> Details
                    </Button>
                    <Popover open={reassignAppId === app.id} onOpenChange={(open) => { setReassignAppId(open ? app.id : null); setReassignSchoolId(""); }}>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-1 text-xs">
                          <ArrowRightLeft size={12} /> Reassign
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 space-y-3" align="end">
                        <p className="text-sm font-medium">Reassign {app.student_name}</p>
                        <Select value={reassignSchoolId} onValueChange={setReassignSchoolId}>
                          <SelectTrigger><SelectValue placeholder="Select new school..." /></SelectTrigger>
                          <SelectContent>
                            {schools.filter((s) => s.id !== app.school_id).map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name} — {s.district}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="w-full" disabled={!reassignSchoolId} onClick={reassignSchool}>Confirm</Button>
                      </PopoverContent>
                    </Popover>
                    <Button size="sm" variant="destructive" className="gap-1 text-xs" onClick={() => stopSponsorship(app.id)}>
                      <XCircle size={12} /> Stop
                    </Button>
                  </div>

                  {/* Notes */}
                  {editNotesId === app.id ? (
                    <div className="space-y-2 border-t border-border pt-2">
                      <Textarea rows={2} value={editNotesValue} onChange={(e) => setEditNotesValue(e.target.value)} placeholder="Admin notes..." className="text-xs" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateNotes(app.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditNotesId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : app.admin_notes ? (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded cursor-pointer truncate" onClick={() => { setEditNotesId(app.id); setEditNotesValue(app.admin_notes || ""); }}>
                      📝 {app.admin_notes}
                    </p>
                  ) : (
                    <button className="text-xs text-primary hover:underline" onClick={() => { setEditNotesId(app.id); setEditNotesValue(""); }}>
                      + Add notes
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setEditMode(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedApp && (() => {
            const school = getSchool(selectedApp.school_id);
            const appExpenses = expenses.filter((e) => e.application_id === selectedApp.id);
            const appClaims = claims.filter((c) => c.application_id === selectedApp.id);
            const appReports = reportCards.filter((r) => r.application_id === selectedApp.id);
            const totalSpent = appExpenses.reduce((s, e) => s + e.amount, 0);

            if (editMode) {
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl">Edit: {selectedApp.student_name}</DialogTitle>
                  </DialogHeader>
                  <ApplicationEditForm
                    app={selectedApp}
                    onSaved={() => { setEditMode(false); setDetailOpen(false); onRefresh(); }}
                    onCancel={() => setEditMode(false)}
                  />
                </>
              );
            }

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl flex items-center gap-2">
                    {selectedApp.student_name}
                    <Badge variant="outline" className="ml-2">{levelLabels[selectedApp.education_level]}</Badge>
                    {selectedApp.class_grade && <Badge variant="secondary" className="text-xs">Class {selectedApp.class_grade}</Badge>}
                    <Button size="sm" variant="outline" className="ml-auto gap-1" onClick={handlePrint}>
                      <Printer size={14} /> Print Form
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditMode(true)}>
                      <Pencil size={14} /> Edit
                    </Button>
                  </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                    <TabsTrigger value="expenses" className="flex-1">Expenses ({appExpenses.length})</TabsTrigger>
                    <TabsTrigger value="reports" className="flex-1">Reports ({appReports.length})</TabsTrigger>
                    <TabsTrigger value="claims" className="flex-1">Claims ({appClaims.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="mt-4">
                    <ApplicationFullDetail app={selectedApp} schoolName={school?.name} />
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

      {/* Hidden printable form */}
      {selectedApp && (
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <PrintableApplicationForm
            ref={printRef}
            form={mapAppToForm(selectedApp)}
            applicationId={selectedApp.registration_number || selectedApp.id.slice(0, 8).toUpperCase()}
            passportPhotoUrl={selectedApp.passport_photo_url || undefined}
          />
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
