import { useState, useRef, useCallback, useMemo, useEffect } from "react";
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
  School, User, Phone, Mail, MapPin, BookOpen, FileText, ShieldAlert, PlusCircle, DollarSign, GraduationCap, ArrowRightLeft, Pencil, Printer, Scale, ExternalLink, Loader2,
} from "lucide-react";
import ApplicationFullDetail, { FullApplication } from "./ApplicationFullDetail";
import ApplicationEditForm from "./ApplicationEditForm";
import PrintableApplicationForm from "@/components/register/PrintableApplicationForm";
import LawyerFormsTab from "./LawyerFormsTab";
import PDFBlobPreview from "./PDFBlobPreview";
import PDFApplicationImportForm, { PDFImportFormData, emptyFormData } from "./PDFApplicationImportForm";

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

interface ScannedDocument {
  id: string;
  application_id: string | null;
  application_number: string;
  original_filename: string;
  storage_path: string;
  created_at: string;
}

interface StudentManagementProps {
  applications: Application[];
  schools: SchoolRow[];
  expenses: Expense[];
  claims: Claim[];
  reportCards: ReportCard[];
  scannedDocuments: ScannedDocument[];
  lawyerSubmissions: any[];
  lawyerTemplates: any[];
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

const StudentManagement = ({ applications, schools, expenses, claims, reportCards, scannedDocuments, lawyerSubmissions, lawyerTemplates, userId, formatUGX, onRefresh }: StudentManagementProps) => {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editNotesId, setEditNotesId] = useState<string | null>(null);
  const [editNotesValue, setEditNotesValue] = useState("");
  const [reassignAppId, setReassignAppId] = useState<string | null>(null);
  const [reassignSchoolId, setReassignSchoolId] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [pdfPreviewDoc, setPdfPreviewDoc] = useState<ScannedDocument | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [pdfPreviewStudent, setPdfPreviewStudent] = useState<Application | null>(null);
  const [pdfImportForm, setPdfImportForm] = useState<PDFImportFormData>({ ...emptyFormData });
  const [pdfImportSaving, setPdfImportSaving] = useState(false);
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

  const normalizeApplicationNumber = (value: string | null | undefined) =>
    (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const docsByApplicationId = useMemo(() => {
    const map = new Map<string, ScannedDocument[]>();
    scannedDocuments.forEach((doc) => {
      if (!doc.application_id) return;
      const existing = map.get(doc.application_id) || [];
      existing.push(doc);
      map.set(doc.application_id, existing);
    });
    return map;
  }, [scannedDocuments]);

  const docsByNumber = useMemo(() => {
    const map = new Map<string, ScannedDocument[]>();
    scannedDocuments.forEach((doc) => {
      const key = normalizeApplicationNumber(doc.application_number);
      if (!key) return;
      const existing = map.get(key) || [];
      existing.push(doc);
      map.set(key, existing);
    });
    return map;
  }, [scannedDocuments]);

  const getDocsForApp = useCallback((app: Application) => {
    const merged = new Map<string, ScannedDocument>();
    (docsByApplicationId.get(app.id) || []).forEach((doc) => merged.set(doc.id, doc));

    const regKey = normalizeApplicationNumber(app.registration_number);
    if (regKey) {
      (docsByNumber.get(regKey) || []).forEach((doc) => merged.set(doc.id, doc));
    }

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [docsByApplicationId, docsByNumber]);

  const searchQuery = search.trim().toLowerCase();
  const normalizedSearchQuery = normalizeApplicationNumber(searchQuery);
  const hasSearchQuery = searchQuery.length > 0;
  const visibleApplications = hasSearchQuery ? applications : sponsoredStudents;

  const filtered = visibleApplications.filter((a) => {
    const appDocs = getDocsForApp(a);
    const normalizedRegistrationNumber = normalizeApplicationNumber(a.registration_number);

    const matchesSearch =
      !hasSearchQuery ||
      a.student_name.toLowerCase().includes(searchQuery) ||
      a.parent_name.toLowerCase().includes(searchQuery) ||
      a.id.toLowerCase().startsWith(searchQuery) ||
      (a.registration_number && (
        a.registration_number.toLowerCase().includes(searchQuery) ||
        (!!normalizedSearchQuery && normalizedRegistrationNumber.includes(normalizedSearchQuery))
      )) ||
      appDocs.some((doc) => {
        const rawDocNumber = doc.application_number.toLowerCase();
        const normalizedDocNumber = normalizeApplicationNumber(doc.application_number);
        return rawDocNumber.includes(searchQuery) || (!!normalizedSearchQuery && normalizedDocNumber.includes(normalizedSearchQuery));
      });

    const matchesLevel = levelFilter === "all" || a.education_level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const unmatchedScannedDocuments = useMemo(() => {
    if (!hasSearchQuery) return [] as ScannedDocument[];

    return scannedDocuments.filter((doc) => {
      const normalizedDocNumber = normalizeApplicationNumber(doc.application_number);
      const matchesDocNumber =
        doc.application_number.toLowerCase().includes(searchQuery) ||
        (!!normalizedSearchQuery && normalizedDocNumber.includes(normalizedSearchQuery));

      if (!matchesDocNumber || !normalizedDocNumber) return false;

      if (doc.application_id && applications.some((app) => app.id === doc.application_id)) {
        return false;
      }

      const hasRegisteredApp = applications.some((app) => {
        const normalizedRegistrationNumber = normalizeApplicationNumber(app.registration_number);
        return normalizedRegistrationNumber.length > 0 && normalizedRegistrationNumber === normalizedDocNumber;
      });

      return !hasRegisteredApp;
    });
  }, [applications, scannedDocuments, searchQuery, normalizedSearchQuery, hasSearchQuery]);

  const openPdfPreview = useCallback(async (doc: ScannedDocument, student?: Application | null) => {
    setPdfPreviewDoc(doc);
    setPdfPreviewStudent(student || null);
    setPdfPreviewBlob(null);
    setPdfPreviewLoading(true);
    setPdfImportForm({ ...emptyFormData, registrationNumber: doc.application_number || "" });
    setPdfImportSaving(false);

    const { data, error } = await supabase.storage
      .from("scanned-documents")
      .download(doc.storage_path);

    if (error || !data) {
      toast.error("Failed to load scanned PDF");
      setPdfPreviewLoading(false);
      return;
    }

    setPdfPreviewBlob(data);
    setPdfPreviewLoading(false);
  }, []);

  const closePdfPreview = useCallback(() => {
    setPdfPreviewDoc(null);
    setPdfPreviewBlob(null);
    setPdfPreviewLoading(false);
    setPdfPreviewStudent(null);
    setPdfImportForm({ ...emptyFormData });
    setPdfImportSaving(false);
  }, []);

  const updateImportField = (field: keyof PDFImportFormData, value: any) => {
    setPdfImportForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePdfImportSave = useCallback(async () => {
    if (!pdfPreviewDoc || !pdfImportForm.studentName) return;
    setPdfImportSaving(true);
    try {
      const { data: appData, error: appErr } = await supabase
        .from("applications")
        .insert({
          user_id: userId,
          student_name: pdfImportForm.studentName,
          date_of_birth: pdfImportForm.dateOfBirth || null,
          gender: pdfImportForm.gender || null,
          nationality: pdfImportForm.nationality || null,
          religion: pdfImportForm.religion || null,
          tribe: pdfImportForm.tribe || null,
          nin: pdfImportForm.nin || null,
          registration_number: pdfImportForm.registrationNumber || pdfPreviewDoc.application_number || null,
          education_level: pdfImportForm.educationLevel || "primary",
          class_grade: pdfImportForm.classGrade || null,
          current_school: pdfImportForm.currentSchool || null,
          school_type: pdfImportForm.schoolType || null,
          institution_name: pdfImportForm.institutionName || null,
          year_of_study: pdfImportForm.yearOfStudy || null,
          course_program: pdfImportForm.courseProgram || null,
          subject_combination: pdfImportForm.subjectCombination || null,
          district: pdfImportForm.district || null,
          sub_county: pdfImportForm.subCounty || null,
          parish: pdfImportForm.parish || null,
          village: pdfImportForm.village || null,
          lci_chairperson: pdfImportForm.lciChairperson || null,
          lci_contact: pdfImportForm.lciContact || null,
          orphan_status: pdfImportForm.orphanStatus || null,
          deceased_parent: pdfImportForm.deceasedParent || null,
          physical_defect: pdfImportForm.physicalDefect,
          physical_defect_details: pdfImportForm.physicalDefectDetails || null,
          chronic_disease: pdfImportForm.chronicDisease,
          chronic_disease_details: pdfImportForm.chronicDiseaseDetails || null,
          parent_name: pdfImportForm.parentName || "N/A",
          parent_phone: pdfImportForm.parentPhone || "N/A",
          parent_email: pdfImportForm.parentEmail || null,
          relationship: pdfImportForm.relationship || null,
          parent_occupation: pdfImportForm.parentOccupation || null,
          parent_monthly_income: pdfImportForm.parentMonthlyIncome || null,
          parent_nin: pdfImportForm.parentNin || null,
          children_in_school: pdfImportForm.childrenInSchool || 0,
          fees_per_term: pdfImportForm.feesPerTerm || 0,
          outstanding_balances: pdfImportForm.outstandingBalances || 0,
          previous_bursary: pdfImportForm.previousBursary,
          personal_statement: pdfImportForm.personalStatement || null,
          reason: pdfImportForm.reason || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (appErr) throw new Error("Failed to save application: " + appErr.message);

      const { error: linkErr } = await supabase
        .from("scanned_documents")
        .update({ application_id: appData.id })
        .eq("id", pdfPreviewDoc.id);

      if (linkErr) throw new Error("Failed to link document: " + linkErr.message);

      toast.success(`Application saved for ${pdfImportForm.studentName}`);
      closePdfPreview();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setPdfImportSaving(false);
    }
  }, [pdfPreviewDoc, pdfImportForm, userId, closePdfPreview, onRefresh]);

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

  const queuedPdfStudentsCount = useMemo(() => {
    const registeredNumbers = new Set(
      applications
        .map((app) => normalizeApplicationNumber(app.registration_number))
        .filter(Boolean)
    );

    const queuedNumbers = new Set<string>();
    scannedDocuments.forEach((doc) => {
      if (doc.application_id) return;
      const normalizedDocNumber = normalizeApplicationNumber(doc.application_number);
      if (!normalizedDocNumber) return;
      if (registeredNumbers.has(normalizedDocNumber)) return;
      queuedNumbers.add(normalizedDocNumber);
    });

    return queuedNumbers.size;
  }, [applications, scannedDocuments]);

  const totalStudentsCount = applications.length + queuedPdfStudentsCount;

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
      {/* Filing Cabinet Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary rounded-md p-2.5">
          <GraduationCap size={22} className="text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Student Filing Cabinet</h2>
          <p className="text-xs text-muted-foreground">All student folders &amp; records in one place</p>
        </div>
      </div>

      {/* Quick stats — styled as filing cabinet drawer labels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Users, value: totalStudentsCount, label: "Total Folders", color: "bg-primary text-primary-foreground" },
          { icon: School, value: Object.keys(schoolBreakdown).length, label: "Partner Schools", color: "bg-accent text-accent-foreground" },
          { icon: DollarSign, value: formatUGX(totalInvestment), label: "Total Invested", color: "bg-secondary text-secondary-foreground" },
          { icon: AlertTriangle, value: claims.filter((c) => c.status === "open" && sponsoredStudents.some((a) => a.id === c.application_id)).length, label: "Open Claims", color: "bg-destructive text-destructive-foreground" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border border-border bg-card p-3 shadow-sm">
            <div className={`rounded p-1.5 ${stat.color}`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* School breakdown — drawer index */}
      {Object.keys(schoolBreakdown).length > 0 && (
        <div className="rounded-md border border-border bg-card p-3">
          <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Index — Students per School</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(schoolBreakdown).map(([name, count]) => (
              <span key={name} className="inline-flex items-center gap-1.5 rounded bg-folder-manila px-2.5 py-1 text-xs font-medium text-foreground border border-folder-manila-dark/40">
                {name} <span className="font-bold text-primary">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters — search drawer */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, parent, or application number..." className="pl-9" />
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

      {/* Folder Rack — The main grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-border bg-folder-rack p-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No matching student folders found.
        </div>
      ) : (
        <div className="rounded-xl bg-folder-rack border border-border p-3 sm:p-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-3">
            {filtered.map((app) => {
              const school = getSchool(app.school_id);
              const appExpenses = expenses.filter((e) => e.application_id === app.id);
              const appClaims = claims.filter((c) => c.application_id === app.id);
              const appReports = reportCards.filter((r) => r.application_id === app.id);
              const appDocs = getDocsForApp(app);
              const totalSpent = appExpenses.reduce((s, e) => s + e.amount, 0);
              const openClaimsCount = appClaims.filter((c) => c.status === "open").length;
              const displayApplicationNumber = app.registration_number || appDocs[0]?.application_number || null;

              return (
                <div key={app.id} className="group cursor-pointer" onClick={() => { setSelectedApp(app); setDetailOpen(true); }}>
                  {/* Folder shape container */}
                  <div className="relative">
                    {/* Folder back tab — the tab sticking up behind */}
                    <div
                      className="absolute -top-3 left-2 right-[45%] h-5 rounded-t-lg"
                      style={{
                        background: "linear-gradient(180deg, hsl(var(--folder-tab)) 0%, hsl(var(--folder-body)) 100%)",
                        boxShadow: "0 -1px 3px hsl(var(--folder-shadow) / 0.15)",
                      }}
                    >
                      {/* Inner paper peek */}
                      <div className="absolute bottom-0 left-1 right-1 h-1 rounded-t-sm bg-folder-inner opacity-60" />
                    </div>

                    {/* Folder body — main card */}
                    <div
                      className="relative rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
                      style={{
                        background: "linear-gradient(170deg, hsl(var(--folder-body-light)) 0%, hsl(var(--folder-body)) 40%, hsl(var(--folder-tab)) 100%)",
                        boxShadow: "0 4px 12px -2px hsl(var(--folder-shadow) / 0.25), 0 1px 3px hsl(var(--folder-shadow) / 0.15), inset 0 1px 0 hsl(var(--folder-body-light) / 0.5)",
                      }}
                    >
                      {/* Status indicator strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        app.status === "approved" ? "bg-accent" :
                        app.status === "rejected" ? "bg-destructive" :
                        app.status === "pending" ? "bg-secondary" :
                        "bg-muted-foreground"
                      }`} />

                      {openClaimsCount > 0 && (
                        <Badge variant="destructive" className="gap-0.5 text-[10px] shrink-0 absolute top-2 right-2 z-10">
                          <AlertTriangle size={9} /> {openClaimsCount}
                        </Badge>
                      )}

                      <div className="pl-5 pr-3 py-3 space-y-2">
                        {/* Student name + photo */}
                        <div className="flex items-start gap-2 sm:gap-3">
                          {app.passport_photo_url ? (
                            <img src={app.passport_photo_url} alt="" className="h-11 w-9 sm:h-12 sm:w-10 rounded object-cover border-2 border-folder-inner/80 shadow-sm shrink-0" />
                          ) : (
                            <div className="h-11 w-9 sm:h-12 sm:w-10 rounded bg-folder-inner border-2 border-folder-inner/80 flex items-center justify-center shrink-0 shadow-sm">
                              <User size={14} className="text-folder-shadow" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-[13px] sm:text-sm text-primary-foreground dark:text-foreground truncate leading-tight drop-shadow-sm">{app.student_name}</h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="outline" className="text-[9px] py-0 h-4 bg-folder-inner/50 border-folder-shadow/30 text-primary-foreground dark:text-foreground">{levelLabels[app.education_level] || app.education_level}</Badge>
                              {app.class_grade && <Badge className="text-[9px] py-0 h-4 bg-folder-inner/60 text-primary-foreground dark:text-foreground border-0">Class {app.class_grade}</Badge>}
                              {displayApplicationNumber && <Badge className="text-[9px] py-0 h-4 font-mono bg-folder-shadow/20 text-primary-foreground dark:text-foreground border-0">#{displayApplicationNumber}</Badge>}
                            </div>
                          </div>
                        </div>

                        {/* Info printed on folder label */}
                        <div className="space-y-0.5 text-[11px] text-primary-foreground/75 dark:text-foreground/80">
                          {school && <p className="flex items-center gap-1.5 truncate"><School size={11} className="shrink-0 opacity-60" /> {school.name}</p>}
                          <p className="flex items-center gap-1.5 truncate"><Users size={11} className="shrink-0 opacity-60" /> {app.parent_name}</p>
                          {app.district && <p className="flex items-center gap-1.5"><MapPin size={11} className="shrink-0 opacity-60" /> {app.district}</p>}
                        </div>

                        {/* Stamped stats */}
                        <div className="grid grid-cols-3 gap-px text-center text-[10px] rounded overflow-hidden bg-folder-shadow/10">
                          <div className="bg-folder-inner/40 py-1"><p className="font-bold text-primary-foreground/90 dark:text-foreground/90">{formatUGX(totalSpent)}</p><p className="text-primary-foreground/60 dark:text-foreground/60">Spent</p></div>
                          <div className="bg-folder-inner/40 py-1"><p className="font-bold text-primary-foreground/90 dark:text-foreground/90">{appReports.length}</p><p className="text-primary-foreground/60 dark:text-foreground/60">Reports</p></div>
                          <div className="bg-folder-inner/40 py-1"><p className="font-bold text-primary-foreground/90 dark:text-foreground/90">{appDocs.length}</p><p className="text-primary-foreground/60 dark:text-foreground/60">Files</p></div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="gap-1 text-[11px] flex-1 h-7 sm:h-6 text-primary-foreground/80 dark:text-foreground/80 hover:text-primary-foreground dark:hover:text-foreground hover:bg-folder-inner/50" onClick={() => { setSelectedApp(app); setDetailOpen(true); }}>
                            <Eye size={11} /> Open
                          </Button>
                          {appDocs[0] && (
                            <Button size="sm" variant="ghost" className="gap-1 text-[11px] h-7 sm:h-6 text-primary-foreground/80 dark:text-foreground/80 hover:bg-folder-inner/50" onClick={() => openPdfPreview(appDocs[0], app)}>
                              <FileText size={11} /> PDF
                            </Button>
                          )}
                          <Popover open={reassignAppId === app.id} onOpenChange={(open) => { setReassignAppId(open ? app.id : null); setReassignSchoolId(""); }}>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-[11px] h-7 sm:h-6 text-primary-foreground/80 dark:text-foreground/80 hover:bg-folder-inner/50 px-1.5">
                                <ArrowRightLeft size={11} />
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
                          <Button size="sm" variant="ghost" className="text-[11px] h-7 sm:h-6 text-destructive hover:bg-destructive/10 px-1.5" onClick={() => stopSponsorship(app.id)}>
                            <XCircle size={11} />
                          </Button>
                        </div>

                        {/* Sticky note */}
                        {editNotesId === app.id ? (
                          <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            <Textarea rows={2} value={editNotesValue} onChange={(e) => setEditNotesValue(e.target.value)} placeholder="Admin notes..." className="text-xs bg-folder-inner/60 border-folder-shadow/20" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateNotes(app.id)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditNotesId(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : app.admin_notes ? (
                          <p className="text-[10px] text-primary-foreground/70 dark:text-foreground/70 bg-folder-inner/50 p-1.5 rounded cursor-pointer truncate" onClick={(e) => { e.stopPropagation(); setEditNotesId(app.id); setEditNotesValue(app.admin_notes || ""); }}>
                            📝 {app.admin_notes}
                          </p>
                        ) : (
                          <button className="text-[10px] text-primary-foreground/60 dark:text-foreground/60 hover:text-primary-foreground dark:hover:text-foreground" onClick={(e) => { e.stopPropagation(); setEditNotesId(app.id); setEditNotesValue(""); }}>
                            + Add notes
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {searchQuery && unmatchedScannedDocuments.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Matching scanned PDFs without saved student details</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {unmatchedScannedDocuments.slice(0, 12).map((doc) => (
                <div key={doc.id} className="rounded-md border border-border bg-muted/20 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-foreground truncate">#{doc.application_number}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{doc.original_filename}</p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openPdfPreview(doc)}>
                    <Eye size={12} /> PDF
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setEditMode(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedApp && (() => {
            const school = getSchool(selectedApp.school_id);
            const appExpenses = expenses.filter((e) => e.application_id === selectedApp.id);
            const appClaims = claims.filter((c) => c.application_id === selectedApp.id);
            const appReports = reportCards.filter((r) => r.application_id === selectedApp.id);
            const appLawyerSubs = lawyerSubmissions.filter((s: any) => s.application_id === selectedApp.id);
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
                  <TabsList className="w-full flex-wrap">
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                    <TabsTrigger value="expenses" className="flex-1">Expenses ({appExpenses.length})</TabsTrigger>
                    <TabsTrigger value="reports" className="flex-1">Reports ({appReports.length})</TabsTrigger>
                    <TabsTrigger value="claims" className="flex-1">Claims ({appClaims.length})</TabsTrigger>
                    <TabsTrigger value="legal" className="flex-1 gap-1"><Scale size={12} /> Legal ({appLawyerSubs.length})</TabsTrigger>
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

                  <TabsContent value="legal" className="mt-4">
                    <LawyerFormsTab
                      applicationId={selectedApp.id}
                      userId={selectedApp.user_id}
                      submissions={appLawyerSubs}
                      templates={lawyerTemplates}
                      onRefresh={onRefresh}
                    />
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog - Split View */}
      <Dialog open={!!pdfPreviewDoc} onOpenChange={(open) => !open && closePdfPreview()}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              Application #{pdfPreviewDoc?.application_number}
              {pdfPreviewStudent && (
                <Badge variant="secondary" className="text-xs">{pdfPreviewStudent.student_name}</Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{pdfPreviewDoc?.original_filename}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex min-h-0">
            {/* PDF Viewer - Left */}
            <div className="w-3/5 min-h-0 bg-muted/10 border-r border-border">
              {pdfPreviewLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF…
                </div>
              ) : (
                <PDFBlobPreview key={pdfPreviewDoc?.id || "no-doc"} pdfBlob={pdfPreviewBlob} />
              )}
            </div>

            {/* Application Form - Right */}
            <div className="w-2/5 min-h-0">
              {pdfPreviewStudent ? (
                <div className="p-4 overflow-y-auto h-full">
                  <ApplicationFullDetail app={pdfPreviewStudent} schoolName={getSchool(pdfPreviewStudent.school_id)?.name} />
                </div>
              ) : (
                <PDFApplicationImportForm
                  form={pdfImportForm}
                  onChange={updateImportField}
                  onSubmit={handlePdfImportSave}
                  saving={pdfImportSaving}
                  hasPdf={!!pdfPreviewBlob}
                />
              )}
            </div>
          </div>
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
            parentPassportPhotoUrl={(selectedApp as any).parent_passport_photo_url || undefined}
            studentSignatureUrl={(selectedApp as any).student_signature_url || undefined}
            parentSignatureUrl={(selectedApp as any).parent_signature_url || undefined}
          />
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
