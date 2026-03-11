import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Layers, Upload, FileUp } from "lucide-react";
import BatchUploader from "@/components/admin/BatchUploader";
import ScannedDocumentSearch from "@/components/admin/ScannedDocumentSearch";
import PDFImportSplitView from "@/components/admin/PDFImportSplitView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminBatchProcessing = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 w-full space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <Layers className="h-6 w-6 text-primary" /> Batch Document Processing
      </h1>
      <p className="text-sm text-muted-foreground">
        Upload scanned application PDFs with their ID snippets, or import individual PDFs with manual data entry.
      </p>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload" className="gap-1.5">
            <Upload className="h-4 w-4" /> Upload & Process
          </TabsTrigger>
          <TabsTrigger value="pdf-import" className="gap-1.5">
            <FileUp className="h-4 w-4" /> PDF Import
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-1.5">
            Search Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <BatchUploader userId={user.id} />
        </TabsContent>

        <TabsContent value="pdf-import" className="mt-4">
          <PDFImportSplitView userId={user.id} />
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          <ScannedDocumentSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBatchProcessing;
