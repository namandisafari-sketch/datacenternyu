import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { mergeBooklet, type MergeResult } from "@/lib/pdfBookletMerge";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  FileUp,
  Download,
  Save,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface ScannerDropZoneProps {
  onMerged?: (result: MergeResult, blobUrl: string, fileName: string) => void;
  applicationId?: string;
}

const ScannerDropZone = ({ onMerged, applicationId }: ScannerDropZoneProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [swapped, setSwapped] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MergeResult | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [appNumber, setAppNumber] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const buildFileName = (name: string, num: string) => {
    const clean = name.trim().replace(/\s+/g, "_").toUpperCase();
    const n = num.trim();
    if (clean && n) return `${clean}_${n}.pdf`;
    if (clean) return `${clean}.pdf`;
    return `merged-application-${Date.now()}.pdf`;
  };

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === "application/pdf"
    );
    if (pdfs.length < 2) {
      toast.error("Please drop exactly 2 PDF files (File A & File B).");
      return;
    }
    setFiles(pdfs.slice(0, 2));
    setResult(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setFileName("");
  }, [blobUrl]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const buffers = await Promise.all(
        files.map((f) => f.arrayBuffer().then((ab) => new Uint8Array(ab)))
      );
      const fileA = swapped ? buffers[1] : buffers[0];
      const fileB = swapped ? buffers[0] : buffers[1];
      const res = await mergeBooklet(fileA, fileB);
      const blob = new Blob([res.pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const name = buildFileName(studentName, appNumber);
      setResult(res);
      setBlobUrl(url);
      setFileName(name);
      onMerged?.(res, url, name);
      toast.success("Booklet merged — 4 pages in correct order!");
    } catch (err: any) {
      toast.error("Merge failed: " + (err.message || "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName || `merged-application-${Date.now()}.pdf`;
    a.click();
  };

  const handleSave = async () => {
    if (!result || !applicationId) {
      toast.error("Select an application record first.");
      return;
    }
    setSaving(true);
    try {
      const saveName = fileName || `${Date.now()}.pdf`;
      const path = `${applicationId}/scanned-forms/${saveName}`;
      const { error } = await supabase.storage
        .from("application-documents")
        .upload(path, result.pdfBytes, { contentType: "application/pdf" });
      if (error) throw error;
      toast.success("Saved to application record!");
    } catch (err: any) {
      toast.error("Save failed: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setFileName("");
  };

  const fileAIdx = swapped ? 1 : 0;
  const fileBIdx = swapped ? 0 : 1;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" /> Booklet Scanner Merge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Student name + app number for file naming */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Label htmlFor="sn" className="text-xs text-muted-foreground">Student Name (for filename)</Label>
            <Input id="sn" placeholder="e.g. Ojambo Mukisa" value={studentName} onChange={e => setStudentName(e.target.value)} />
          </div>
          <div className="w-full sm:w-40">
            <Label htmlFor="an" className="text-xs text-muted-foreground">App Number</Label>
            <Input id="an" placeholder="e.g. 21143" value={appNumber} onChange={e => setAppNumber(e.target.value)} />
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors
            ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
          `}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            {files.length === 2
              ? "2 files loaded — ready to merge"
              : "Drop 2 scanned A3 PDFs here (File A & File B)"}
          </p>
          <p className="text-xs text-muted-foreground/70 text-center">
            File A: Right half = Page 1, Left half = Page 4 &nbsp;|&nbsp; File B: Left half = Page 2, Right half = Page 3
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* File list + swap toggle */}
        {files.length === 2 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-primary">File A (P1 & P4):</span>
              <span className="truncate text-muted-foreground">{files[fileAIdx].name}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="font-medium text-primary">File B (P2 & P3):</span>
              <span className="truncate text-muted-foreground">{files[fileBIdx].name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="swap" checked={swapped} onCheckedChange={setSwapped} />
              <Label htmlFor="swap" className="text-xs text-muted-foreground">
                Swap File A ↔ File B assignment
              </Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleMerge} disabled={processing} size="sm">
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Merging...</>
                ) : (
                  "Merge Booklet"
                )}
              </Button>
              <Button onClick={reset} variant="outline" size="sm">
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            </div>
          </div>
        )}

        {/* Result actions */}
        {result && blobUrl && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Output: <span className="font-medium text-foreground">{fileName}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownload} variant="secondary" size="sm">
                <Download className="h-4 w-4" /> Download Merged PDF
              </Button>
              <Button
                onClick={handleSave}
                variant="default"
                size="sm"
                disabled={saving || !applicationId}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save to Application</>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScannerDropZone;
