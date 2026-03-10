import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  X,
  RotateCcw,
} from "lucide-react";

interface ScannerDropZoneProps {
  onMerged?: (result: MergeResult, blobUrl: string) => void;
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === "application/pdf"
    );
    if (pdfs.length < 2) {
      toast.error("Please drop exactly 2 PDF files (Outer & Inner).");
      return;
    }
    setFiles(pdfs.slice(0, 2));
    setResult(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
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
      const outer = swapped ? buffers[1] : buffers[0];
      const inner = swapped ? buffers[0] : buffers[1];
      const res = await mergeBooklet(outer, inner);
      const blob = new Blob([res.pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResult(res);
      setBlobUrl(url);
      onMerged?.(res, url);
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
    a.download = `merged-application-${Date.now()}.pdf`;
    a.click();
  };

  const handleSave = async () => {
    if (!result || !applicationId) {
      toast.error("Select an application record first.");
      return;
    }
    setSaving(true);
    try {
      const path = `${applicationId}/scanned-forms/${Date.now()}.pdf`;
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
  };

  const outerIdx = swapped ? 1 : 0;
  const innerIdx = swapped ? 0 : 1;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" /> Booklet Scanner Merge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
              : "Drop 2 scanned PDFs here (Outer & Inner)"}
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
              <span className="font-medium text-primary">Outer (1&4):</span>
              <span className="truncate text-muted-foreground">{files[outerIdx].name}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="font-medium text-primary">Inner (2&3):</span>
              <span className="truncate text-muted-foreground">{files[innerIdx].name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="swap" checked={swapped} onCheckedChange={setSwapped} />
              <Label htmlFor="swap" className="text-xs text-muted-foreground">
                Swap Outer ↔ Inner assignment
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
          <div className="flex flex-wrap gap-2 pt-2 border-t">
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
        )}
      </CardContent>
    </Card>
  );
};

export default ScannerDropZone;
