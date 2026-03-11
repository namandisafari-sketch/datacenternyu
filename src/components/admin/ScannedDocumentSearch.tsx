import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PDFBlobPreview from "@/components/admin/PDFBlobPreview";
import { Search, FileText, Eye, Loader2, FileWarning } from "lucide-react";

interface ScannedDoc {
  id: string;
  application_number: string;
  original_filename: string;
  storage_path: string;
  ocr_confidence: number;
  created_at: string;
  application_id: string | null;
}

const normalizeStoragePath = (path: string) => {
  const cleaned = (path || "").trim();
  if (!cleaned) return "";

  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const parsed = new URL(cleaned);
      const marker = "/scanned-documents/";
      const idx = parsed.pathname.toLowerCase().indexOf(marker);
      if (idx >= 0) {
        return decodeURIComponent(parsed.pathname.slice(idx + marker.length)).replace(/^\/+/, "");
      }
    } catch {
      return cleaned;
    }
  }

  return cleaned.replace(/^\/?scanned-documents\//i, "").replace(/^\/+/, "");
};

const ScannedDocumentSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScannedDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ScannedDoc | null>(null);

  const search = async (q: string) => {
    setLoading(true);
    let req = supabase
      .from("scanned_documents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (q.trim()) {
      req = req.ilike("application_number", `%${q.trim()}%`);
    }

    const { data } = await req;
    setResults((data as ScannedDoc[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    search("");
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const closePreview = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewDoc(null);
    setPreviewUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
  };

  const openPreview = async (doc: ScannedDoc) => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewDoc(doc);
    setPreviewUrl(null);
    setPreviewError(null);
    setPreviewLoading(true);

    const normalizedPath = normalizeStoragePath(doc.storage_path);
    if (!normalizedPath) {
      setPreviewError("Invalid file path for this PDF.");
      setPreviewLoading(false);
      return;
    }

    const { data, error } = await supabase.storage
      .from("scanned-documents")
      .download(normalizedPath);

    if (error || !data) {
      setPreviewError(error?.message || "Could not load PDF file.");
      setPreviewLoading(false);
      return;
    }

    setPreviewUrl(URL.createObjectURL(data));
    setPreviewLoading(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by application number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading}>
          Search
        </Button>
      </form>

      {results.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No scanned documents found.
        </p>
      )}

      <div className="grid gap-2">
        {results.map((doc) => (
          <Card key={doc.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="flex items-center gap-3 p-3">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">
                    #{doc.application_number}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {doc.ocr_confidence}% conf.
                  </Badge>
                  {doc.application_id && (
                    <Badge className="text-[10px] bg-green-500/10 text-green-700 border-green-500/30">
                      Linked
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {doc.original_filename} · {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void openPreview(doc)}>
                <Eye className="h-4 w-4 mr-1" /> Preview
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Application #{previewDoc?.application_number}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/20">
            {previewLoading ? (
              <div className="h-full min-h-[320px] flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading preview...
              </div>
            ) : previewError ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <FileWarning className="h-6 w-6" />
                <span>{previewError}</span>
              </div>
            ) : (
              <PDFBlobPreview key={previewDoc?.id || "preview-doc"} pdfUrl={previewUrl} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScannedDocumentSearch;
