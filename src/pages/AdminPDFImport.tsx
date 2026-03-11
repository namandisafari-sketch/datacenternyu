import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  Upload,
  RotateCcw,
} from "lucide-react";
import PDFApplicationImportForm, {
  PDFImportFormData,
  emptyFormData,
} from "@/components/admin/PDFApplicationImportForm";
import { useIsMobile } from "@/hooks/use-mobile";

interface QueuedPDF {
  file: File;
  objectUrl: string;
  status: "pending" | "active" | "done";
  savedAppId?: string;
}

const AdminPDFImport = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [pdfQueue, setPdfQueue] = useState<QueuedPDF[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [form, setForm] = useState<PDFImportFormData>({ ...emptyFormData });
  const [saving, setSaving] = useState(false);
  const [mobileView, setMobileView] = useState<"pdf" | "form">("form");
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const activePdf = pdfQueue[activeIdx] || null;

  const handleFiles = useCallback((files: File[]) => {
    const pdfs = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length === 0) {
      toast.error("No PDF files found in the selection.");
      return;
    }

    const items: QueuedPDF[] = pdfs.map((f) => ({
      file: f,
      objectUrl: URL.createObjectURL(f),
      status: "pending" as const,
    }));

    // Mark first as active
    items[0].status = "active";

    setPdfQueue(items);
    setActiveIdx(0);
    setForm({ ...emptyFormData });
    toast.success(`${pdfs.length} PDF(s) loaded. Fill in details for each.`);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles]
  );

  const updateField = (field: keyof PDFImportFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const goToIndex = (idx: number) => {
    if (idx < 0 || idx >= pdfQueue.length) return;
    setActiveIdx(idx);
    setForm({ ...emptyFormData });
    setPdfQueue((prev) =>
      prev.map((p, i) =>
        i === idx && p.status === "pending" ? { ...p, status: "active" } : p
      )
    );
  };

  const handleSave = async () => {
    if (!activePdf || !form.studentName) return;
    setSaving(true);

    try {
      // Upload PDF to storage
      const appNum = form.registrationNumber || `IMPORT-${Date.now()}`;
      const storagePath = `applications/${appNum}/${activePdf.file.name}`;
      const pdfBytes = await activePdf.file.arrayBuffer();

      const { error: uploadErr } = await supabase.storage
        .from("scanned-documents")
        .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

      if (uploadErr) throw new Error("PDF upload failed: " + uploadErr.message);

      // Insert application record
      const { data: appData, error: appErr } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          student_name: form.studentName,
          date_of_birth: form.dateOfBirth || null,
          gender: form.gender || null,
          nationality: form.nationality || null,
          religion: form.religion || null,
          tribe: form.tribe || null,
          nin: form.nin || null,
          registration_number: form.registrationNumber || null,
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

      // Link scanned document record
      await supabase.from("scanned_documents").insert({
        application_number: appNum,
        application_id: appData.id,
        original_filename: activePdf.file.name,
        storage_path: storagePath,
        ocr_confidence: 100,
      });

      // Mark as done
      setPdfQueue((prev) =>
        prev.map((p, i) =>
          i === activeIdx ? { ...p, status: "done", savedAppId: appData.id } : p
        )
      );

      toast.success(`Application saved for ${form.studentName}`);

      // Auto-advance to next pending
      const nextIdx = pdfQueue.findIndex((p, i) => i > activeIdx && p.status === "pending");
      if (nextIdx >= 0) {
        setActiveIdx(nextIdx);
        setForm({ ...emptyFormData });
        setPdfQueue((prev) =>
          prev.map((p, i) =>
            i === nextIdx ? { ...p, status: "active" } : p
          )
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const doneCount = pdfQueue.filter((p) => p.status === "done").length;

  // No files loaded yet — show upload zone
  if (pdfQueue.length === 0) {
    return (
      <div className="p-4 sm:p-6 w-full space-y-4">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <FileUp className="h-6 w-6 text-primary" /> PDF Application Import
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Upload application PDFs (one per student). For each PDF you'll see a split view: the PDF on the left and a form on the right to fill in or correct the student's details.
        </p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-primary/40 rounded-xl p-12 text-center hover:border-primary/70 hover:bg-primary/5 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-primary/50" />
          <p className="font-medium text-foreground">Drop PDFs here or click to select</p>
          <p className="text-xs text-muted-foreground mt-2">
            Each PDF represents one student's application form
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="gap-1.5">
              <FileText className="h-4 w-4" /> Select Files
            </Button>
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); folderRef.current?.click(); }} className="gap-1.5">
              <FileUp className="h-4 w-4" /> Select Folder
            </Button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        />
        <input
          ref={folderRef}
          type="file"
          multiple
          className="hidden"
          {...({ webkitdirectory: "", directory: "" } as any)}
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        />
      </div>
    );
  }

  // Split view
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => { setPdfQueue([]); setForm({ ...emptyFormData }); }}>
          <RotateCcw className="h-4 w-4 mr-1" /> New Batch
        </Button>
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={activeIdx <= 0} onClick={() => goToIndex(activeIdx - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium text-foreground min-w-[80px] text-center">
            {activeIdx + 1} / {pdfQueue.length}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={activeIdx >= pdfQueue.length - 1} onClick={() => goToIndex(activeIdx + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant="secondary" className="ml-2 text-xs gap-1">
          <CheckCircle className="h-3 w-3" /> {doneCount}/{pdfQueue.length} done
        </Badge>
        {isMobile && (
          <Button variant="outline" size="sm" className="ml-2 text-xs" onClick={() => setMobileView(mobileView === "pdf" ? "form" : "pdf")}>
            {mobileView === "pdf" ? "Show Form" : "Show PDF"}
          </Button>
        )}
      </div>

      {/* Queue strip (scrollable thumbnails) */}
      {pdfQueue.length > 1 && (
        <div className="flex gap-1 px-4 py-1.5 border-b border-border overflow-x-auto shrink-0 bg-background">
          {pdfQueue.map((item, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                i === activeIdx
                  ? "bg-primary text-primary-foreground"
                  : item.status === "done"
                  ? "bg-muted text-muted-foreground"
                  : "bg-muted/50 text-foreground hover:bg-muted"
              }`}
            >
              {item.status === "done" && <CheckCircle className="h-3 w-3" />}
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{item.file.name.replace(".pdf", "")}</span>
            </button>
          ))}
        </div>
      )}

      {/* Split content */}
      <div className="flex-1 flex min-h-0">
        {/* PDF viewer */}
        <div
          className={`${
            isMobile
              ? mobileView === "pdf"
                ? "w-full"
                : "hidden"
              : "w-1/2 border-r border-border"
          } bg-muted/20 flex flex-col min-h-0`}
        >
          {activePdf ? (
            <iframe
              key={activePdf.objectUrl}
              src={activePdf.objectUrl}
              className="flex-1 w-full"
              title="PDF Preview"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No PDF selected
            </div>
          )}
        </div>

        {/* Form */}
        <div
          className={`${
            isMobile
              ? mobileView === "form"
                ? "w-full"
                : "hidden"
              : "w-1/2"
          } min-h-0`}
        >
          <PDFApplicationImportForm
            form={form}
            onChange={updateField}
            onSubmit={handleSave}
            saving={saving}
            hasPdf={!!activePdf}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPDFImport;
