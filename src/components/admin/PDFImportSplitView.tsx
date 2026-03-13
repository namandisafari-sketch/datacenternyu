import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  RefreshCw,
  Inbox,
  Pencil,
  Check,
  X,
  School,
} from "lucide-react";
import PDFApplicationImportForm, {
  PDFImportFormData,
  emptyFormData,
} from "@/components/admin/PDFApplicationImportForm";
import PDFBlobPreview from "@/components/admin/PDFBlobPreview";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScannedDoc {
  id: string;
  application_number: string;
  original_filename: string;
  storage_path: string;
  application_id: string | null;
  created_at: string;
  school_id: string | null;
}

interface SchoolInfo {
  id: string;
  name: string;
}

interface Props {
  userId: string;
}

const PDFImportSplitView = ({ userId }: Props) => {
  const isMobile = useIsMobile();
  const [docs, setDocs] = useState<ScannedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [form, setForm] = useState<PDFImportFormData>({ ...emptyFormData });
  const [saving, setSaving] = useState(false);
  const [mobileView, setMobileView] = useState<"pdf" | "form">("form");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [editingAppNum, setEditingAppNum] = useState(false);
  const [editAppNumValue, setEditAppNumValue] = useState("");
  const [savingAppNum, setSavingAppNum] = useState(false);
  const [schoolNames, setSchoolNames] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("schools").select("id, name").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.id] = s.name; });
      setSchoolNames(map);
    });
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scanned_documents")
      .select("*")
      .is("application_id", null)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load documents");
      setLoading(false);
      return;
    }
    setDocs(data || []);
    setActiveIdx(0);
    setForm({ ...emptyFormData });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const activeDoc = docs[activeIdx] || null;

  useEffect(() => {
    if (!activeDoc) {
      setPdfBlob(null);
      return;
    }

    let active = true;

    const loadPdf = async () => {
      const { data, error } = await supabase.storage
        .from("scanned-documents")
        .download(activeDoc.storage_path);

      if (error || !data) {
        console.error("Failed to download PDF:", error?.message);
        if (active) setPdfBlob(null);
        return;
      }

      if (active) {
        setPdfBlob(data);
      }
    };

    void loadPdf();

    return () => {
      active = false;
    };
  }, [activeDoc?.id, activeDoc?.storage_path]);

  const updateField = (field: keyof PDFImportFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startEditAppNum = () => {
    if (!activeDoc) return;
    setEditAppNumValue(activeDoc.application_number);
    setEditingAppNum(true);
  };

  const cancelEditAppNum = () => {
    setEditingAppNum(false);
    setEditAppNumValue("");
  };

  const saveAppNum = async () => {
    if (!activeDoc || !editAppNumValue.trim()) return;
    setSavingAppNum(true);
    const { error } = await supabase
      .from("scanned_documents")
      .update({ application_number: editAppNumValue.trim() })
      .eq("id", activeDoc.id);

    if (error) {
      toast.error("Failed to update application number");
    } else {
      toast.success("Application number updated");
      setDocs((prev) =>
        prev.map((d) =>
          d.id === activeDoc.id ? { ...d, application_number: editAppNumValue.trim() } : d
        )
      );
    }
    setEditingAppNum(false);
    setSavingAppNum(false);
  };

  const goToIndex = (idx: number) => {
    if (idx < 0 || idx >= docs.length) return;
    setActiveIdx(idx);
    setForm({ ...emptyFormData });
    setEditingAppNum(false);
  };

  const handleSave = async () => {
    if (!activeDoc || !form.studentName) return;
    setSaving(true);
    try {
      const { data: appData, error: appErr } = await supabase
        .from("applications")
        .insert({
          user_id: userId,
          student_name: form.studentName,
          date_of_birth: form.dateOfBirth || null,
          gender: form.gender || null,
          nationality: form.nationality || null,
          religion: form.religion || null,
          tribe: form.tribe || null,
          nin: form.nin || null,
          registration_number: form.registrationNumber || activeDoc.application_number || null,
          education_level: form.educationLevel || "primary",
          class_grade: form.classGrade || null,
          current_school: form.currentSchool || null,
          school_type: form.schoolType || null,
          institution_name: form.institutionName || null,
          year_of_study: form.yearOfStudy || null,
          course_program: form.courseProgram || null,
          subject_combination: form.subjectCombination || null,
          district: form.district || null,
          sub_county: form.subCounty || null,
          parish: form.parish || null,
          village: form.village || null,
          lci_chairperson: form.lciChairperson || null,
          lci_contact: form.lciContact || null,
          orphan_status: form.orphanStatus || null,
          deceased_parent: form.deceasedParent || null,
          physical_defect: form.physicalDefect,
          physical_defect_details: form.physicalDefectDetails || null,
          chronic_disease: form.chronicDisease,
          chronic_disease_details: form.chronicDiseaseDetails || null,
          parent_name: form.parentName || "N/A",
          parent_phone: form.parentPhone || "N/A",
          parent_email: form.parentEmail || null,
          relationship: form.relationship || null,
          parent_occupation: form.parentOccupation || null,
          parent_monthly_income: form.parentMonthlyIncome || null,
          parent_nin: form.parentNin || null,
          children_in_school: form.childrenInSchool || 0,
          fees_per_term: form.feesPerTerm || 0,
          outstanding_balances: form.outstandingBalances || 0,
          previous_bursary: form.previousBursary,
          personal_statement: form.personalStatement || null,
          reason: form.reason || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (appErr) throw new Error("Failed to save application: " + appErr.message);

      // Link the scanned document to the new application
      const { error: linkErr } = await supabase
        .from("scanned_documents")
        .update({ application_id: appData.id })
        .eq("id", activeDoc.id);

      if (linkErr) throw new Error("Failed to link document: " + linkErr.message);

      toast.success(`Application saved for ${form.studentName}`);

      // Remove from list and advance
      setDocs((prev) => prev.filter((_, i) => i !== activeIdx));
      setForm({ ...emptyFormData });
      setActiveIdx((prev) => Math.min(prev, docs.length - 2));
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading batch-processed documents…
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <p className="font-medium text-foreground">No unlinked documents</p>
        <p className="text-sm text-muted-foreground">
          All batch-processed documents have been linked to applications, or none have been uploaded yet.
          <br />
          Use the <span className="font-semibold">Upload & Process</span> tab first to batch-upload scanned PDFs.
        </p>
        <Button variant="outline" size="sm" onClick={fetchDocs} className="gap-1.5 mt-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>
    );
  }

  const totalDone = docs.length; // remaining = unlinked
  const originalCount = docs.length;

  return (
    <div className="flex flex-col border border-border rounded-lg overflow-hidden h-full">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30 shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" onClick={fetchDocs} className="gap-1.5">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={activeIdx <= 0} onClick={() => goToIndex(activeIdx - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-foreground min-w-[80px] text-center">
            {activeIdx + 1} / {docs.length}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={activeIdx >= docs.length - 1} onClick={() => goToIndex(activeIdx + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant="secondary" className="text-xs gap-1">
          <FileText className="h-3 w-3" /> {docs.length} remaining
        </Badge>
        {isMobile && (
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setMobileView(mobileView === "pdf" ? "form" : "pdf")}>
            {mobileView === "pdf" ? "Show Form" : "Show PDF"}
          </Button>
        )}
      </div>

      {/* Application number bar */}
      {activeDoc && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-background shrink-0">
          <span className="text-xs text-muted-foreground font-medium">App #:</span>
          {editingAppNum ? (
            <div className="flex items-center gap-1">
              <Input
                value={editAppNumValue}
                onChange={(e) => setEditAppNumValue(e.target.value)}
                className="h-7 text-xs font-mono w-40"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveAppNum();
                  if (e.key === "Escape") cancelEditAppNum();
                }}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveAppNum} disabled={savingAppNum}>
                <Check className="h-3.5 w-3.5 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEditAppNum}>
                <X className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="font-mono font-semibold text-sm text-foreground">
                {activeDoc.application_number || "—"}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEditAppNum} title="Edit application number">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
            {activeDoc.original_filename}
          </span>
          {activeDoc.school_id && schoolNames[activeDoc.school_id] && (
            <Badge variant="outline" className="ml-auto text-[10px] gap-1">
              <School className="h-3 w-3" /> {schoolNames[activeDoc.school_id]}
            </Badge>
          )}
        </div>
      )}

      {/* Queue strip */}
      {docs.length > 1 && (
        <div className="flex gap-1 px-3 py-1.5 border-b border-border overflow-x-auto shrink-0 bg-background">
          {docs.map((item, i) => (
            <button
              key={item.id}
              onClick={() => goToIndex(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                i === activeIdx
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{item.application_number || item.original_filename.replace(".pdf", "")}</span>
            </button>
          ))}
        </div>
      )}

      {/* Split content */}
      <div className="flex-1 flex min-h-0">
        {/* PDF viewer */}
        <div className={`${isMobile ? (mobileView === "pdf" ? "w-full" : "hidden") : "w-3/5 border-r border-border"} bg-muted/20 flex flex-col min-h-0`}>
          <PDFBlobPreview key={activeDoc?.id || "no-doc"} pdfBlob={pdfBlob} />
        </div>

        {/* Form */}
        <div className={`${isMobile ? (mobileView === "form" ? "w-full" : "hidden") : "w-2/5"} min-h-0`}>
          <PDFApplicationImportForm
            form={form}
            onChange={updateField}
            onSubmit={handleSave}
            saving={saving}
            hasPdf={!!pdfBlob}
          />
        </div>
      </div>
    </div>
  );
};

export default PDFImportSplitView;
