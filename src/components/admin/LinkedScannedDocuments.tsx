import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  applicationId: string;
  registrationNumber?: string | null;
}

interface ScannedDoc {
  id: string;
  application_id: string | null;
  application_number: string;
  original_filename: string;
  storage_path: string;
  created_at: string;
}

const normalizeApplicationNumber = (value: string | null | undefined) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const LinkedScannedDocuments = ({ applicationId, registrationNumber }: Props) => {
  const [docs, setDocs] = useState<ScannedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      try {
        const registrationNo = registrationNumber?.trim() || "";
        const normalizedRegistrationNo = normalizeApplicationNumber(registrationNo);
        const registrationSearchTokens = Array.from(
          new Set(
            [registrationNo, normalizedRegistrationNo]
              .map((token) => token.trim().toLowerCase().replace(/[%_,]/g, ""))
              .filter(Boolean)
          )
        );
        const baseSelect = "id, application_id, application_number, original_filename, storage_path, created_at";

        const byAppIdPromise = supabase
          .from("scanned_documents")
          .select(baseSelect)
          .eq("application_id", applicationId)
          .order("created_at", { ascending: true });

        const byRegNoPromise = registrationSearchTokens.length
          ? supabase
              .from("scanned_documents")
              .select(baseSelect)
              .or(registrationSearchTokens.map((token) => `application_number.ilike.%${token}%`).join(","))
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [] as ScannedDoc[], error: null });

        const [{ data: byAppId, error: byAppIdErr }, { data: byRegNo, error: byRegNoErr }] = await Promise.all([
          byAppIdPromise,
          byRegNoPromise,
        ]);

        if (byAppIdErr || byRegNoErr) {
          setDocs([]);
          return;
        }

        const mergedMap = new Map<string, ScannedDoc>();
        [...(byAppId || []), ...(byRegNo || [])].forEach((doc) => {
          const shouldInclude =
            doc.application_id === applicationId ||
            !normalizedRegistrationNo ||
            normalizeApplicationNumber(doc.application_number) === normalizedRegistrationNo;

          if (shouldInclude) mergedMap.set(doc.id, doc);
        });

        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        setDocs(merged);

        if (normalizedRegistrationNo) {
          const needsLinking = merged.filter(
            (doc) => !doc.application_id && normalizeApplicationNumber(doc.application_number) === normalizedRegistrationNo
          );

          if (needsLinking.length > 0) {
            const idsToLink = needsLinking.map((doc) => doc.id);
            await supabase
              .from("scanned_documents")
              .update({ application_id: applicationId })
              .in("id", idsToLink);

            setDocs((prev) =>
              prev.map((doc) =>
                idsToLink.includes(doc.id) ? { ...doc, application_id: applicationId } : doc
              )
            );
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [applicationId, registrationNumber]);

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
              Application #{doc.application_number}
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
