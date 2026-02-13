import { useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Printer, CreditCard, Download, Archive, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { differenceInYears } from "date-fns";
import JSZip from "jszip";
import StudentIDCard from "./StudentIDCard";

interface Application {
  id: string;
  student_name: string;
  date_of_birth: string | null;
  passport_photo_url: string | null;
  education_level: string;
  class_grade: string | null;
  registration_number: string | null;
  school_id: string | null;
  status: string;
  created_at: string;
}

interface SchoolRow {
  id: string;
  name: string;
}

interface IDCardsSectionProps {
  applications: Application[];
  schools: SchoolRow[];
}

const IDCardsSection = ({ applications, schools }: IDCardsSectionProps) => {
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const printRef = useRef<HTMLDivElement>(null);

  const approved = applications.filter((a) => a.status === "approved");
  const filtered = approved.filter((a) => {
    const matchesSearch = !search || a.student_name.toLowerCase().includes(search.toLowerCase());
    const matchesSchool = schoolFilter === "all" || a.school_id === schoolFilter;
    return matchesSearch && matchesSchool;
  });

  const getSchoolName = (schoolId: string | null) =>
    schools.find((s) => s.id === schoolId)?.name || "Unassigned";

  const generateSponsorshipNumber = (app: Application) => {
    const year = new Date(app.created_at).getFullYear();
    const short = app.id.substring(0, 6).toUpperCase();
    return `NYG-${year}-${short}`;
  };

  const getFileName = (app: Application) => {
    const name = app.student_name.replace(/\s+/g, "_");
    const age = app.date_of_birth
      ? differenceInYears(new Date(), new Date(app.date_of_birth))
      : "unknown";
    return `${name}_age${age}`;
  };

  const renderCardSideToImage = useCallback(async (app: Application, side: "front" | "back"): Promise<string> => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      <StudentIDCard
        application={app}
        schoolName={getSchoolName(app.school_id)}
        sponsorshipNumber={generateSponsorshipNumber(app)}
        side={side}
      />
    );

    await new Promise((r) => setTimeout(r, 500));

    try {
      await toPng(container, { quality: 1, pixelRatio: 3 });
      const dataUrl = await toPng(container, { quality: 1, pixelRatio: 3 });
      return dataUrl;
    } finally {
      root.unmount();
      document.body.removeChild(container);
    }
  }, [schools]);

  const handleBatchDownload = async () => {
    if (approved.length === 0) {
      toast.error("No approved students to download.");
      return;
    }

    setBatchDownloading(true);
    setBatchProgress({ current: 0, total: approved.length });
    const zip = new JSZip();

    try {
      for (let i = 0; i < approved.length; i++) {
        const app = approved[i];
        setBatchProgress({ current: i + 1, total: approved.length });
        const fileName = getFileName(app);

        const frontUrl = await renderCardSideToImage(app, "front");
        const frontBase64 = frontUrl.split(",")[1];
        zip.file(`${fileName}_front.png`, frontBase64, { base64: true });

        const backUrl = await renderCardSideToImage(app, "back");
        const backBase64 = backUrl.split(",")[1];
        zip.file(`${fileName}_back.png`, backBase64, { base64: true });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Student_ID_Cards_${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${approved.length} ID cards downloaded!`);
    } catch {
      toast.error("Failed to generate batch download.");
    } finally {
      setBatchDownloading(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const handleSaveFront = async () => {
    if (!selectedApp) return;
    try {
      const dataUrl = await renderCardSideToImage(selectedApp, "front");
      const link = document.createElement("a");
      link.download = `${getFileName(selectedApp)}_front.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Front side saved!");
    } catch {
      toast.error("Failed to save front side.");
    }
  };

  const handleSaveBack = async () => {
    if (!selectedApp) return;
    try {
      const dataUrl = await renderCardSideToImage(selectedApp, "back");
      const link = document.createElement("a");
      link.download = `${getFileName(selectedApp)}_back.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Back side saved!");
    } catch {
      toast.error("Failed to save back side.");
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Student ID Card</title>
          <style>
            body { margin: 0; padding: 20px; font-family: 'Source Sans 3', sans-serif; }
            .card-container { display: flex; gap: 24px; }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const selectedApp = selectedId ? approved.find((a) => a.id === selectedId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <CreditCard size={22} className="text-primary" /> Student ID Cards
        </h2>
        <Button
          variant="outline"
          onClick={handleBatchDownload}
          disabled={batchDownloading || approved.length === 0}
          className="gap-2"
        >
          {batchDownloading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Downloading {batchProgress.current}/{batchProgress.total}...
            </>
          ) : (
            <>
              <Archive size={16} /> Download All as ZIP ({approved.length})
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approved student..."
            className="pl-9"
          />
        </div>
        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by school" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {schools.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Student selector */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((app) => (
          <Card
            key={app.id}
            className={`cursor-pointer transition-all hover:border-primary ${selectedId === app.id ? "border-primary ring-2 ring-primary/20" : ""}`}
            onClick={() => setSelectedId(app.id)}
          >
            <CardContent className="py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {app.passport_photo_url ? (
                  <img src={app.passport_photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-muted-foreground text-xs">📷</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{app.student_name}</p>
                <p className="text-xs text-muted-foreground truncate">{getSchoolName(app.school_id)}</p>
              </div>
              {selectedId === app.id && <Badge className="ml-auto shrink-0">Selected</Badge>}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-4">No approved students found.</p>
        )}
      </div>

      {/* ID Card Preview */}
      {selectedApp && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">ID Card Preview</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveFront} className="gap-2">
                <Download size={16} /> Save Front
              </Button>
              <Button variant="outline" onClick={handleSaveBack} className="gap-2">
                <Download size={16} /> Save Back
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer size={16} /> Print Card
              </Button>
            </div>
          </div>
          <div ref={printRef} className="card-container">
            <StudentIDCard
              application={selectedApp}
              schoolName={getSchoolName(selectedApp.school_id)}
              sponsorshipNumber={generateSponsorshipNumber(selectedApp)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default IDCardsSection;
