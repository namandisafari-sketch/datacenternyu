import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  FolderOpen,
  Zap,
  School,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QueueItem {
  file: File;
  appNumber: string;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

interface SchoolOption {
  id: string;
  name: string;
}

interface BatchUploaderProps {
  userId: string;
}

const CONCURRENCY = 3;

function extractAppNumber(filename: string): string {
  // Strip path, extension, and return the base name as the application number
  const nameOnly = filename.includes("/") ? filename.split("/").pop()! : filename;
  return nameOnly.replace(/\.[^.]+$/, "").trim();
}

async function checkDuplicateFile(originalFilename: string): Promise<boolean> {
  const { data } = await supabase
    .from("scanned_documents")
    .select("id")
    .eq("original_filename", originalFilename)
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function processOneFile(item: QueueItem, userId: string, schoolId?: string): Promise<QueueItem> {
  try {
    const isDuplicate = await checkDuplicateFile(item.file.name);
    if (isDuplicate) {
      return { ...item, status: "error", error: "Already uploaded (duplicate)" };
    }

    const storagePath = `applications/${item.appNumber}/${item.appNumber}.pdf`;
    const pdfBytes = await item.file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("scanned-documents")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw new Error("Upload failed: " + uploadError.message);

    // Try to auto-link to an existing application
    const { data: appMatch } = await supabase
      .from("applications")
      .select("id")
      .or(`registration_number.eq.${item.appNumber},nin.eq.${item.appNumber}`)
      .limit(1)
      .maybeSingle();

    const { error: insertError } = await supabase
      .from("scanned_documents")
      .insert({
        application_number: item.appNumber,
        application_id: appMatch?.id || null,
        original_filename: item.file.name,
        storage_path: storagePath,
        school_id: schoolId || null,
      } as any);

    if (insertError) throw new Error("DB insert failed: " + insertError.message);

    return { ...item, status: "done" };
  } catch (err: any) {
    return { ...item, status: "error", error: err.message || "Unknown error" };
  }
}

// Collect files from dropped folder entries recursively
async function readAllEntries(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file((f) => resolve([f]));
    });
  }
  if (entry.isDirectory) {
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const files: File[] = [];
    let batch: FileSystemEntry[];
    do {
      batch = await new Promise((resolve, reject) =>
        dirReader.readEntries(resolve, reject)
      );
      for (const e of batch) {
        const subFiles = await readAllEntries(e);
        files.push(...subFiles);
      }
    } while (batch.length > 0);
    return files;
  }
  return [];
}

const ITEM_HEIGHT = 44;

const BatchUploader = ({ userId }: BatchUploaderProps) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [nonPdfs, setNonPdfs] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [errCount, setErrCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");

  useEffect(() => {
    supabase.from("schools").select("id, name").order("name").then(({ data }) => {
      setSchools((data as SchoolOption[]) || []);
    });
  }, []);

  const totalCount = queue.length;
  const progress = totalCount > 0 ? Math.round(((doneCount + errCount) / totalCount) * 100) : 0;

  const handleFiles = useCallback((files: File[]) => {
    const pdfs: QueueItem[] = [];
    const others: File[] = [];

    for (const f of files) {
      const ext = f.name.split(".").pop()?.toLowerCase() || "";
      if (ext === "pdf") {
        pdfs.push({
          file: f,
          appNumber: extractAppNumber(f.name),
          status: "pending",
        });
      } else {
        others.push(f);
      }
    }

    setQueue(pdfs);
    setNonPdfs(others);
    setDoneCount(0);
    setErrCount(0);

    if (pdfs.length === 0) {
      toast.error("No PDF files found.");
    } else {
      toast.success(`Found ${pdfs.length} PDF(s) ready to upload.`);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        const allFiles: File[] = [];
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }
        if (entries.length > 0) {
          for (const entry of entries) {
            const files = await readAllEntries(entry);
            allFiles.push(...files);
          }
          handleFiles(allFiles);
          return;
        }
      }
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles]
  );

  const processBatch = async () => {
    if (queue.length === 0) return;
    setProcessing(true);
    abortRef.current = false;
    setDoneCount(0);
    setErrCount(0);

    const indices = queue.map((_, i) => i);
    const results = [...queue];
    let done = 0;
    let errs = 0;

    for (const r of results) r.status = "pending";
    setQueue([...results]);

    const worker = async () => {
      while (indices.length > 0 && !abortRef.current) {
        const idx = indices.shift()!;
        results[idx] = { ...results[idx], status: "processing" };
        setQueue([...results]);

        const result = await processOneFile(
          results[idx],
          userId,
          selectedSchoolId && selectedSchoolId !== "none" ? selectedSchoolId : undefined
        );
        results[idx] = result;
        if (result.status === "done") {
          done++;
          setDoneCount(done);
        } else {
          errs++;
          setErrCount(errs);
        }
        setQueue([...results]);
      }
    };

    const workers = Math.min(CONCURRENCY, queue.length);
    await Promise.all(Array.from({ length: workers }, () => worker()));

    setQueue([...results]);
    setProcessing(false);
    toast.success(`Upload complete: ${done} saved, ${errs} errors.`);
  };

  const stopProcessing = () => {
    abortRef.current = true;
    toast.info("Stopping after current items finish...");
  };

  const clearAll = () => {
    setQueue([]);
    setNonPdfs([]);
    setDoneCount(0);
    setErrCount(0);
  };

  // Virtual scrolling
  const containerHeight = Math.min(queue.length * ITEM_HEIGHT, 500);
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5);
  const endIdx = Math.min(queue.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + 5);
  const visibleItems = queue.slice(startIdx, endIdx);

  const statusIcon = (s: QueueItem["status"]) => {
    switch (s) {
      case "pending": return <FileText className="h-4 w-4 text-muted-foreground" />;
      case "processing": return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "done": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const stats = useMemo(() => {
    if (queue.length === 0) return null;
    return { total: queue.length, done: doneCount, errors: errCount, pending: queue.length - doneCount - errCount };
  }, [queue.length, doneCount, errCount]);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:border-primary/70 hover:bg-primary/5 transition-colors"
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-primary/60" />
        <p className="text-sm font-medium text-foreground">
          Drop a folder of pre-named PDFs here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Each PDF filename is used as the application number (e.g. <span className="font-mono">20176.pdf</span> → App #20176)
        </p>
        <div className="flex items-center gap-2 justify-center mt-3">
          <School className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select source school (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No school selected</SelectItem>
              {schools.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 justify-center mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" /> Select PDFs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => folderRef.current?.click()}
            className="gap-1.5"
          >
            <FolderOpen className="h-4 w-4" /> Select Folder
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        />
        {/* @ts-ignore - webkitdirectory is valid but not in React types */}
        <input
          ref={folderRef}
          type="file"
          multiple
          className="hidden"
          {...({ webkitdirectory: "", directory: "" } as any)}
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        />
      </div>

      {/* Non-PDF warning */}
      {nonPdfs.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-xs text-destructive">
            <strong>{nonPdfs.length} non-PDF file(s) skipped</strong>
            {nonPdfs.length <= 10 && (
              <span>: {nonPdfs.map((f) => f.name).join(", ")}</span>
            )}
          </div>
        </div>
      )}

      {/* Queue list */}
      {queue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                {stats?.total} PDF{(stats?.total || 0) > 1 ? "s" : ""}
                {stats && processing && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({stats.done} done, {stats.errors} errors, {stats.pending} remaining)
                  </span>
                )}
                {stats && !processing && stats.done > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    — {stats.done} ✓ {stats.errors > 0 ? `${stats.errors} ✗` : ""}
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearAll} disabled={processing}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
                {processing ? (
                  <Button size="sm" variant="destructive" onClick={stopProcessing}>
                    Stop
                  </Button>
                ) : (
                  <Button size="sm" onClick={processBatch}>
                    <Zap className="h-3.5 w-3.5 mr-1" /> Upload All
                  </Button>
                )}
              </div>
            </div>
            {(processing || progress > 0) && (
              <div className="mt-2 space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{progress}%</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div
              ref={listRef}
              className="overflow-y-auto"
              style={{ maxHeight: `${containerHeight}px` }}
              onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
            >
              <div style={{ height: queue.length * ITEM_HEIGHT, position: "relative" }}>
                {visibleItems.map((item, vi) => {
                  const i = startIdx + vi;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 text-sm border-b border-border/30"
                      style={{
                        position: "absolute",
                        top: i * ITEM_HEIGHT,
                        height: ITEM_HEIGHT,
                        left: 0,
                        right: 0,
                      }}
                    >
                      {statusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block text-sm">{item.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(item.file.size / 1024).toFixed(0)}KB
                        </span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        #{item.appNumber}
                      </Badge>
                      {item.error && (
                        <span className="text-xs text-destructive max-w-[200px] truncate" title={item.error}>
                          {item.error}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchUploader;
