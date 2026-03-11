import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  RefreshCw,
  Inbox,
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

  const goToIndex = (idx: number) => {
    if (idx < 0 || idx >= docs.length) return;
    setActiveIdx(idx);
    setForm({ ...emptyFormData });
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
    <div className="flex flex-col border border-border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 260px)" }}>
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
        <div className={`${isMobile ? (mobileView === "pdf" ? "w-full" : "hidden") : "w-1/2 border-r border-border"} bg-muted/20 flex flex-col min-h-0`}>
          <PDFBlobPreview key={activeDoc?.id || "no-doc"} pdfBlob={pdfBlob} />
        </div>

        {/* Form */}
        <div className={`${isMobile ? (mobileView === "form" ? "w-full" : "hidden") : "w-1/2"} min-h-0`}>
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
