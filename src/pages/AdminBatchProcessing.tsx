import { useAuth } from "@/hooks/useAuth";
import { Layers } from "lucide-react";
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
          <Layers className="h-5 w-5 text-primary" /> Sort Applications
        </h1>
      </div>

      <Tabs defaultValue="sort" className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0">
          <TabsTrigger value="sort" className="gap-1.5">
            Sort & Link
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-1.5">
            Search Documents
          </TabsTrigger>
        </TabsList>

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
