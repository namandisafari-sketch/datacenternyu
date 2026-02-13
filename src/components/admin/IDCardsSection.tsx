import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Printer, CreditCard, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { differenceInYears } from "date-fns";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const approved = applications.filter((a) => a.status === "approved");
  const filtered = approved.filter((a) =>
    !search || a.student_name.toLowerCase().includes(search.toLowerCase())
  );

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

  const handleSaveAsJpg = async () => {
    if (!printRef.current || !selectedApp) return;
    try {
      await toPng(printRef.current, { quality: 1, pixelRatio: 3 });
      const dataUrl = await toPng(printRef.current, { quality: 1, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `${getFileName(selectedApp)}.jpg`;
      link.href = dataUrl;
      link.click();
      toast.success("ID card saved!");
    } catch {
      toast.error("Failed to save ID card image.");
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
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <CreditCard size={22} className="text-primary" /> Student ID Cards
      </h2>

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
              <Button variant="outline" onClick={handleSaveAsJpg} className="gap-2">
                <Download size={16} /> Save as JPG
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
