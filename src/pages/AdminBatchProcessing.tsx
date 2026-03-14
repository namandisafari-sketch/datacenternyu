import { useAuth } from "@/hooks/useAuth";
import { Layers, Upload, FileUp } from "lucide-react";
import BatchUploader from "@/components/admin/BatchUploader";
import ScannedDocumentSearch from "@/components/admin/ScannedDocumentSearch";
import PDFImportSplitView from "@/components/admin/PDFImportSplitView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminBatchProcessing = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-2 sm:p-3 w-full flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" /> Batch Processing
        </h1>
      </div>

      <Tabs defaultValue="upload" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0">
          <TabsTrigger value="upload" className="gap-1.5">
            <Upload className="h-4 w-4" /> Upload
          </TabsTrigger>
          <TabsTrigger value="sort" className="gap-1.5">
            <FileUp className="h-4 w-4" /> Sort & Link
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-1.5">
            Search Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-2 flex-1 min-h-0 overflow-auto">
          <BatchUploader userId={user.id} />
        </TabsContent>

        <TabsContent value="sort" className="mt-0 flex-1 min-h-0">
          <PDFImportSplitView userId={user.id} />
        </TabsContent>

        <TabsContent value="search" className="mt-2 flex-1 min-h-0 overflow-auto">
          <ScannedDocumentSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBatchProcessing;
