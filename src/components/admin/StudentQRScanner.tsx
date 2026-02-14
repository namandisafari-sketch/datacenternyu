import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Camera, CameraOff, Search, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface StudentInfo {
  id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  education_level: string;
}

interface StudentQRScannerProps {
  onStudentFound: (applicationId: string, student: StudentInfo) => void;
  selectedStudent: StudentInfo | null;
}

const StudentQRScanner = ({ onStudentFound, selectedStudent }: StudentQRScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [searching, setSearching] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const lookupStudent = async (applicationId: string) => {
    setSearching(true);
    const { data, error } = await supabase
      .from("applications")
      .select("id, student_name, parent_name, parent_phone, education_level")
      .eq("id", applicationId)
      .maybeSingle();

    if (error || !data) {
      toast.error("Student not found. Check the ID and try again.");
      setSearching(false);
      return;
    }

    onStudentFound(data.id, data as StudentInfo);
    setSearching(false);
    toast.success(`Found: ${data.student_name}`);
  };

  const extractApplicationId = (scannedValue: string): string | null => {
    // QR codes encode URLs like: https://nyungani.lovable.app/lost-id?id=UUID
    try {
      const url = new URL(scannedValue);
      const id = url.searchParams.get("id");
      if (id) return id;
    } catch {
      // Not a URL — check if it's a raw UUID
    }

    // Check if it's a raw UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(scannedValue.trim())) {
      return scannedValue.trim();
    }

    return null;
  };

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const appId = extractApplicationId(decodedText);
          if (appId) {
            stopScanner();
            lookupStudent(appId);
          } else {
            toast.error("Invalid QR code. Please scan a student ID card.");
          }
        },
        () => {} // ignore errors during scanning
      );

      setScanning(true);
    } catch (err) {
      toast.error("Could not access camera. Please check permissions.");
      console.error("Scanner error:", err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleManualSearch = () => {
    const trimmed = manualId.trim();
    if (!trimmed) {
      toast.error("Enter a student ID");
      return;
    }

    // Check if it's a UUID directly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmed)) {
      lookupStudent(trimmed);
      return;
    }

    // Try to extract UUID from sponsorship number format NYG-YEAR-SHORTID
    // The short ID is the first 8 chars of UUID, so we need to search by prefix
    const sponMatch = trimmed.match(/^NYG-\d{4}-([A-F0-9]{8})$/i);
    if (sponMatch) {
      searchByIdPrefix(sponMatch[1]);
      return;
    }

    // Try searching by name
    searchByName(trimmed);
  };

  const searchByIdPrefix = async (prefix: string) => {
    setSearching(true);
    const { data, error } = await supabase
      .from("applications")
      .select("id, student_name, parent_name, parent_phone, education_level")
      .ilike("id", `${prefix}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast.error("No student found with that sponsorship number.");
      setSearching(false);
      return;
    }

    onStudentFound(data.id, data as StudentInfo);
    setSearching(false);
    toast.success(`Found: ${data.student_name}`);
  };

  const searchByName = async (name: string) => {
    setSearching(true);
    const { data, error } = await supabase
      .from("applications")
      .select("id, student_name, parent_name, parent_phone, education_level")
      .ilike("student_name", `%${name}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast.error("No student found with that name.");
      setSearching(false);
      return;
    }

    onStudentFound(data.id, data as StudentInfo);
    setSearching(false);
    toast.success(`Found: ${data.student_name}`);
  };

  if (selectedStudent) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{selectedStudent.student_name}</p>
            <p className="text-xs text-muted-foreground">Parent: {selectedStudent.parent_name} • {selectedStudent.parent_phone}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onStudentFound("", null as any);
              setManualId("");
            }}
            className="text-xs shrink-0"
          >
            Change
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <QrCode size={16} />
        Identify Student
      </Label>

      {/* QR Scanner */}
      <div className="space-y-2">
        <div
          id="qr-reader"
          ref={containerRef}
          className={`rounded-lg overflow-hidden bg-muted ${scanning ? "h-[250px]" : "h-0"}`}
        />
        <Button
          type="button"
          variant={scanning ? "destructive" : "outline"}
          onClick={scanning ? stopScanner : startScanner}
          className="w-full gap-2"
          size="sm"
        >
          {scanning ? (
            <>
              <CameraOff size={16} /> Stop Camera
            </>
          ) : (
            <>
              <Camera size={16} /> Scan Student ID QR Code
            </>
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or enter manually</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Manual entry */}
      <div className="flex gap-2">
        <Input
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
          placeholder="NYG-2026-A1B2C3D4 or student name"
          className="font-mono text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleManualSearch}
          disabled={searching}
          size="icon"
          className="shrink-0"
        >
          <Search size={16} />
        </Button>
      </div>
    </div>
  );
};

export default StudentQRScanner;
