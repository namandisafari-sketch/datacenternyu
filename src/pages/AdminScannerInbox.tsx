import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ScanLine,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import ScannerDropZone from "@/components/admin/ScannerDropZone";
import type { MergeResult } from "@/lib/pdfBookletMerge";

interface AppRow {
  id: string;
  student_name: string;
  parent_name: string;
  status: string;
  education_level: string;
  district: string | null;
  created_at: string;
}

const levelLabels: Record<string, string> = {
  nursery: "Nursery",
  primary: "Primary",
  secondary_o: "O-Level",
  secondary_a: "A-Level",
  vocational: "Vocational",
  university: "University",
};

const AdminScannerInbox = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Application form fields — editable copy for data entry
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, student_name, parent_name, status, education_level, district, created_at")
        .order("created_at", { ascending: false });
      setApplications((data as AppRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(
    () =>
      applications.filter(
        (a) =>
          a.student_name.toLowerCase().includes(search.toLowerCase()) ||
          a.parent_name.toLowerCase().includes(search.toLowerCase())
      ),
    [applications, search]
  );

  const selectedApp = applications.find((a) => a.id === selectedAppId);

  // When a merge completes, show the PDF
  const handleMerged = (_result: MergeResult, blobUrl: string, _fileName: string) => {
    setPdfUrl(blobUrl);
  };

  // Load full application data when selected for the right-side form
  useEffect(() => {
    if (!selectedAppId) return;
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("*")
        .eq("id", selectedAppId)
        .single();
      if (data) {
        const flat: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            flat[k] = String(v ?? "");
          }
        });
        setFormData(flat);
      }
    })();
  }, [selectedAppId]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveForm = async () => {
    if (!selectedAppId) return;
    // Only save safe text fields
    const allowedKeys = [
      "student_name", "parent_name", "parent_phone", "parent_email",
      "gender", "date_of_birth", "district", "sub_county", "parish", "village",
      "current_school", "class_grade", "reason", "nin", "religion", "tribe",
      "nationality", "parent_occupation", "parent_monthly_income", "parent_nin",
      "lci_chairperson", "lci_contact", "personal_statement",
      "orphan_status", "who_pays_fees", "admin_notes",
    ];
    const updates: Record<string, string> = {};
    allowedKeys.forEach((k) => {
      if (formData[k] !== undefined) updates[k] = formData[k];
    });
    const { error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", selectedAppId);
    if (error) {
      const { toast } = await import("sonner");
      toast.error("Save failed: " + error.message);
    } else {
      const { toast } = await import("sonner");
      toast.success("Application record updated!");
    }
  };

  const formFields = [
    { key: "student_name", label: "Student Name" },
    { key: "gender", label: "Gender" },
    { key: "date_of_birth", label: "Date of Birth" },
    { key: "nin", label: "NIN" },
    { key: "nationality", label: "Nationality" },
    { key: "religion", label: "Religion" },
    { key: "tribe", label: "Tribe" },
    { key: "district", label: "District" },
    { key: "sub_county", label: "Sub-county" },
    { key: "parish", label: "Parish" },
    { key: "village", label: "Village" },
    { key: "current_school", label: "Current School" },
    { key: "class_grade", label: "Class/Grade" },
    { key: "parent_name", label: "Parent/Guardian Name" },
    { key: "parent_phone", label: "Parent Phone" },
    { key: "parent_email", label: "Parent Email" },
    { key: "parent_occupation", label: "Parent Occupation" },
    { key: "parent_monthly_income", label: "Monthly Income" },
    { key: "parent_nin", label: "Parent NIN" },
    { key: "orphan_status", label: "Orphan Status" },
    { key: "who_pays_fees", label: "Who Pays Fees" },
    { key: "lci_chairperson", label: "LCI Chairperson" },
    { key: "lci_contact", label: "LCI Contact" },
    { key: "reason", label: "Reason for Bursary" },
    { key: "personal_statement", label: "Personal Statement" },
    { key: "admin_notes", label: "Admin Notes" },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <ScanLine className="h-6 w-6 text-primary" /> Scanner Inbox
      </h1>
      <p className="text-sm text-muted-foreground">
        Drop scanned booklet PDFs, merge them, then type data into the form side-by-side.
      </p>

      {/* Application selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student or parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedAppId} onValueChange={setSelectedAppId}>
          <SelectTrigger className="w-full sm:w-[340px]">
            <SelectValue placeholder="Link to application..." />
          </SelectTrigger>
          <SelectContent>
            {filtered.slice(0, 50).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.student_name} — {levelLabels[a.education_level] || a.education_level} ({a.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scanner drop zone */}
      <ScannerDropZone onMerged={handleMerged} applicationId={selectedAppId || undefined} />

      {/* Split view: PDF left, Form right */}
      {pdfUrl && selectedAppId && (
        <ResizablePanelGroup direction="horizontal" className="min-h-[70vh] rounded-lg border">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Scanned PDF Viewer</span>
              </div>
              <iframe
                src={pdfUrl}
                className="flex-1 w-full"
                title="Merged PDF"
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
                <span className="text-sm font-medium">
                  Digital Form — {selectedApp?.student_name}
                </span>
                <Button size="sm" onClick={handleSaveForm}>
                  Save Changes
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {formFields.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {label}
                    </label>
                    {key === "reason" || key === "personal_statement" || key === "admin_notes" ? (
                      <textarea
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                        value={formData[key] || ""}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      />
                    ) : (
                      <Input
                        value={formData[key] || ""}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

export default AdminScannerInbox;
