import { useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Image,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  FolderOpen,
  Zap,
} from "lucide-react";

interface PairItem {
  pdf: File;
  png: File;
  baseName: string;
  status: "pending" | "processing" | "done" | "error";
  applicationNumber?: string;
  confidence?: number;
  error?: string;
}

interface BatchUploaderProps {
  userId: string;
}

const MAX_CONCURRENCY = 4;
const MIN_CONCURRENCY = 1;
const MAX_RETRIES = 6;
const BASE_DELAY_MS = 2500;
const MAX_DELAY_MS = 30000;
const OCR_MIN_SPACING_MS = 900;
const RAMP_UP_AFTER_SUCCESSES = 5; // consecutive successes before increasing concurrency

// Adaptive concurrency state (shared across workers)
let activeConcurrency = 2;
let consecutiveSuccesses = 0;
let consecutiveThrottles = 0;

let nextOCRAllowedAt = 0;

function pairFiles(files: File[]): { pairs: PairItem[]; orphans: File[] } {
  const pdfMap = new Map<string, File>();
  const pngMap = new Map<string, File>();

  for (const f of files) {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    const nameOnly = f.name.includes("/") ? f.name.split("/").pop()! : f.name;
    const base = nameOnly.replace(/\.[^.]+$/, "");

    if (ext === "pdf") pdfMap.set(base, f);
    else if (["png", "jpg", "jpeg"].includes(ext)) pngMap.set(base, f);
  }

  const pairs: PairItem[] = [];
  const orphans: File[] = [];

  for (const [base, pdf] of pdfMap) {
    const png = pngMap.get(base);
    if (png) {
      pairs.push({ pdf, png, baseName: base, status: "pending" });
      pngMap.delete(base);
    } else {
      orphans.push(pdf);
    }
  }

  for (const f of pngMap.values()) orphans.push(f);

  return { pairs, orphans };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorStatusCode(error: any): number | null {
  const status = error?.context?.status ?? error?.status ?? null;
  return typeof status === "number" ? status : null;
}

function isRateLimitedResponse(data: any, error: any): boolean {
  const statusCode = getErrorStatusCode(error);
  const errorMessage = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  const dataError = typeof data?.error === "string" ? data.error.toLowerCase() : "";

  return (
    statusCode === 429 ||
    errorMessage.includes("429") ||
    errorMessage.includes("rate limit") ||
    dataError.includes("rate limited")
  );
}

function getServerRetryMs(data: any): number | null {
  const retryAfter = data?.retry_after_ms;
  return typeof retryAfter === "number" && Number.isFinite(retryAfter) && retryAfter > 0
    ? retryAfter
    : null;
}

async function waitForOCRSlot() {
  const now = Date.now();
  if (now < nextOCRAllowedAt) {
    await delay(nextOCRAllowedAt - now);
  }
  nextOCRAllowedAt = Date.now() + OCR_MIN_SPACING_MS;
}

async function invokeOCRWithRetry(imageBase64: string): Promise<{ data: any; error: any }> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForOCRSlot();

    const { data, error } = await supabase.functions.invoke("ocr-application-number", {
      body: { imageBase64 },
    });

    if (isRateLimitedResponse(data, error)) {
      if (attempt < MAX_RETRIES) {
        const serverRetryMs = getServerRetryMs(data) ?? 0;
        const backoffMs = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt)) + Math.random() * 1200;
        const waitMs = Math.max(serverRetryMs, backoffMs);

        nextOCRAllowedAt = Math.max(nextOCRAllowedAt, Date.now() + waitMs);

        console.log(
          `Rate limited, retrying in ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`
        );

        await delay(waitMs);
        continue;
      }

      return { data: null, error: { message: "Rate limited after maximum retries" } };
    }

    if (error) return { data, error };
    if (data?.error) return { data: null, error: { message: data.error } };

    return { data, error: null };
  }

  return { data: null, error: { message: "Max retries exceeded due to rate limiting" } };
}

function onOCRSuccess() {
  consecutiveThrottles = 0;
  consecutiveSuccesses++;
  if (consecutiveSuccesses >= RAMP_UP_AFTER_SUCCESSES && activeConcurrency < MAX_CONCURRENCY) {
    activeConcurrency++;
    consecutiveSuccesses = 0;
    console.log(`Concurrency ramped up to ${activeConcurrency}`);
  }
}

function onOCRThrottle() {
  consecutiveSuccesses = 0;
  consecutiveThrottles++;
  if (consecutiveThrottles >= 2 && activeConcurrency > MIN_CONCURRENCY) {
    activeConcurrency = MIN_CONCURRENCY;
    console.log(`Heavy throttling detected, concurrency dropped to ${activeConcurrency}`);
  }
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

async function processOnePair(item: PairItem, userId: string): Promise<PairItem> {
  try {
    // Check for duplicate file already processed
    const isDuplicate = await checkDuplicateFile(item.pdf.name);
    if (isDuplicate) {
      return { ...item, status: "error", error: "Already processed (duplicate)" };
    }

    const imageBase64 = await fileToBase64(item.png);
    const { data: ocrData, error: ocrError } = await invokeOCRWithRetry(imageBase64);

    if (ocrError) {
      if (ocrError.message?.toLowerCase().includes("rate limit")) {
        onOCRThrottle();
      }
      throw new Error(ocrError.message || "OCR failed");
    }
    if (ocrData?.error) throw new Error(ocrData.error);

    onOCRSuccess();

    const appNum = ocrData.application_number;
    const confidence = ocrData.confidence || 0;

    if (!appNum || appNum === "UNREADABLE") {
      return { ...item, status: "error", error: "Could not read application number", confidence };
    }

    item.applicationNumber = appNum;
    item.confidence = confidence;

    const storagePath = `applications/${appNum}/${appNum}.pdf`;
    const pdfBytes = await item.pdf.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("scanned-documents")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw new Error("Upload failed: " + uploadError.message);

    const { data: appMatch } = await supabase
      .from("applications")
      .select("id")
      .or(`registration_number.eq.${appNum},nin.eq.${appNum}`)
      .limit(1)
      .maybeSingle();

    const { error: insertError } = await supabase
      .from("scanned_documents")
      .insert({
        application_number: appNum,
        application_id: appMatch?.id || null,
        original_filename: item.pdf.name,
        storage_path: storagePath,
        ocr_confidence: confidence,
      });

    if (insertError) throw new Error("DB insert failed: " + insertError.message);

    return { ...item, status: "done", applicationNumber: appNum, confidence };
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

const VISIBLE_WINDOW = 200; // only render this many items around scroll position

const BatchUploader = ({ userId }: BatchUploaderProps) => {
  const [pairs, setPairs] = useState<PairItem[]>([]);
  const [orphans, setOrphans] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [errCount, setErrCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalCount = pairs.length;
  const progress = totalCount > 0 ? Math.round(((doneCount + errCount) / totalCount) * 100) : 0;

  const handleFiles = useCallback((files: File[]) => {
    const { pairs: p, orphans: o } = pairFiles(files);
    setPairs(p);
    setOrphans(o);
    setDoneCount(0);
    setErrCount(0);
    if (p.length === 0) {
      toast.error("No matching PDF+PNG pairs found.");
    } else {
      toast.success(`Found ${p.length} document pairs ready to process.`);
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
      // Fallback
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles]
  );

  const processBatch = async () => {
    if (pairs.length === 0) return;
    setProcessing(true);
    abortRef.current = false;
    setDoneCount(0);
    setErrCount(0);

    // Reset adaptive concurrency
    activeConcurrency = 2;
    consecutiveSuccesses = 0;
    consecutiveThrottles = 0;

    const queue = [...pairs.map((_, i) => i)]; // indices
    const results = [...pairs];
    let done = 0;
    let errs = 0;

    // Mark all as pending
    for (const r of results) r.status = "pending";
    setPairs([...results]);

    const worker = async () => {
      while (queue.length > 0 && !abortRef.current) {
        const idx = queue.shift()!;
        results[idx] = { ...results[idx], status: "processing" };
        // Batch state updates every few items for perf
        setPairs([...results]);

        const result = await processOnePair(results[idx], userId);
        results[idx] = result;
        if (result.status === "done") {
          done++;
          setDoneCount(done);
        } else {
          errs++;
          setErrCount(errs);
        }

        // Update UI periodically (every item for small batches, every 3 for large)
        if (totalCount < 100 || (done + errs) % 3 === 0 || queue.length === 0) {
          setPairs([...results]);
        }
      }
    };

    // Launch initial workers with adaptive concurrency
    const spawnWorker = () => {
      const p = worker();
      p.then(() => {
        // When a worker finishes, spawn another if concurrency allows and queue has items
        if (queue.length > 0 && !abortRef.current && activeWorkerCount() < activeConcurrency) {
          workerPromises.push(spawnWorker());
        }
      });
      return p;
    };

    const workerPromises: Promise<void>[] = [];
    const activeWorkerCount = () => workerPromises.filter(p => {
      // Simple tracking: we just use initial count
      return true;
    }).length;

    const initialWorkers = Math.min(activeConcurrency, pairs.length);
    for (let i = 0; i < initialWorkers; i++) {
      workerPromises.push(worker());
    }
    await Promise.all(workerPromises);

    setPairs([...results]);
    setProcessing(false);
    toast.success(`Batch complete: ${done} processed, ${errs} errors.`);
  };

  const stopProcessing = () => {
    abortRef.current = true;
    toast.info("Stopping after current items finish...");
  };

  const clearAll = () => {
    setPairs([]);
    setOrphans([]);
    setDoneCount(0);
    setErrCount(0);
  };

  // Virtual scrolling for large lists
  const ITEM_HEIGHT = 52;
  const containerHeight = Math.min(pairs.length * ITEM_HEIGHT, 500);
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5);
  const endIdx = Math.min(pairs.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + 5);
  const visiblePairs = pairs.slice(startIdx, endIdx);

  const statusIcon = (s: PairItem["status"]) => {
    switch (s) {
      case "pending": return <FileText className="h-4 w-4 text-muted-foreground" />;
      case "processing": return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "done": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const stats = useMemo(() => {
    if (pairs.length === 0) return null;
    return { total: pairs.length, done: doneCount, errors: errCount, pending: pairs.length - doneCount - errCount };
  }, [pairs.length, doneCount, errCount]);

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
          Drop files or folders here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Each PDF must have a matching PNG with the same filename (e.g. 005124.pdf + 005124.png)
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" /> Select Files
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
          accept=".pdf,.png,.jpg,.jpeg"
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

      {/* Orphans warning */}
      {orphans.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-xs text-destructive">
            <strong>{orphans.length} unmatched file(s)</strong>
            {orphans.length <= 20 && (
              <span>: {orphans.map((f) => f.name).join(", ")}</span>
            )}
          </div>
        </div>
      )}

      {/* Pairs list */}
      {pairs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                {stats?.total} Document Pair{(stats?.total || 0) > 1 ? "s" : ""}
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
                    <Zap className="h-3.5 w-3.5 mr-1" /> Process All (adaptive parallel)
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
              <div style={{ height: pairs.length * ITEM_HEIGHT, position: "relative" }}>
                {visiblePairs.map((p, vi) => {
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
                      {statusIcon(p.status)}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block text-sm">{p.baseName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <FileText className="h-3 w-3" /> {(p.pdf.size / 1024).toFixed(0)}KB
                          <Image className="h-3 w-3 ml-1" /> {(p.png.size / 1024).toFixed(0)}KB
                        </span>
                      </div>
                      {p.applicationNumber && (
                        <Badge variant="secondary" className="font-mono text-xs">
                          #{p.applicationNumber}
                        </Badge>
                      )}
                      {p.confidence !== undefined && p.status !== "pending" && (
                        <span className="text-xs text-muted-foreground">{p.confidence}%</span>
                      )}
                      {p.error && (
                        <span className="text-xs text-destructive max-w-[200px] truncate" title={p.error}>
                          {p.error}
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
