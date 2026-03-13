import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Search, FileText, Eye, Loader2, FileWarning, Pencil, Check, X, School } from "lucide-react";

interface ScannedDoc {
  id: string;
  application_number: string;
  original_filename: string;
  storage_path: string;
  ocr_confidence: number;
  created_at: string;
  application_id: string | null;
  school_id: string | null;
}

interface SchoolMap {
  [id: string]: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [schoolNames, setSchoolNames] = useState<SchoolMap>({});

  useEffect(() => {
    supabase.from("schools").select("id, name").then(({ data }) => {
      const map: SchoolMap = {};
      (data || []).forEach((s: any) => { map[s.id] = s.name; });
      setSchoolNames(map);
    });
  }, []);

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


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const saveEditAppNum = async (docId: string) => {
    if (!editValue.trim()) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("scanned_documents")
      .update({ application_number: editValue.trim() })
      .eq("id", docId);

    if (error) {
      toast.error("Failed to update application number");
    } else {
      toast.success("Application number updated");
      setResults((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, application_number: editValue.trim() } : d))
      );
    }
    setEditingId(null);
    setSavingEdit(false);
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setPreviewBlob(null);
    setPreviewLoading(false);
    setPreviewError(null);
  };

  const openPreview = async (doc: ScannedDoc) => {
    setPreviewDoc(doc);
    setPreviewBlob(null);
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

    setPreviewBlob(data);
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
                  {editingId === doc.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 text-xs font-mono w-32"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditAppNum(doc.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => saveEditAppNum(doc.id)} disabled={savingEdit}>
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-mono font-semibold text-sm">
                        #{doc.application_number}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => { setEditingId(doc.id); setEditValue(doc.application_number); }}
                        title="Edit application number"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </>
                  )}
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
                  {doc.school_id && schoolNames[doc.school_id] && (
                    <span className="inline-flex items-center gap-1 ml-2 text-primary">
                      <School className="h-3 w-3" /> {schoolNames[doc.school_id]}
                    </span>
                  )}
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
              <PDFBlobPreview key={previewDoc?.id || "preview-doc"} pdfBlob={previewBlob} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScannedDocumentSearch;
