import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  applicationId: string;
}

interface ScannedDoc {
  id: string;
  application_number: string;
  original_filename: string;
  storage_path: string;
  created_at: string;
}

const LinkedScannedDocuments = ({ applicationId }: Props) => {
  const [docs, setDocs] = useState<ScannedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("scanned_documents")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });
      setDocs(data || []);
      setLoading(false);
    };
    fetch();
  }, [applicationId]);

  const openDoc = async (storagePath: string) => {
    const { data } = await supabase.storage
      .from("scanned-documents")
      .createSignedUrl(storagePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading documents…
      </div>
    );
  }

  if (docs.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" /> Scanned Documents ({docs.length})
      </p>
      <div className="space-y-1">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-2 text-sm bg-muted/30 rounded px-2.5 py-1.5">
            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate flex-1 text-foreground">
              {doc.application_number || doc.original_filename}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => openDoc(doc.storage_path)}>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LinkedScannedDocuments;
