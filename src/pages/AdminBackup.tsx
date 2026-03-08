import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Download, Upload, Loader2, HardDrive, ShieldCheck, AlertTriangle, CheckCircle2, FileJson } from "lucide-react";

const ALL_TABLES = [
  "applications", "schools", "expenses", "parent_payments", "payment_codes",
  "accounting_transactions", "budget_allocations", "petty_cash",
  "material_categories", "material_distributions", "appointments",
  "bursary_request_links", "bursary_requests", "student_claims",
  "report_cards", "lawyer_form_templates", "lawyer_form_submissions",
  "staff_profiles", "attendance_records", "audit_logs", "access_logs",
  "profiles", "user_roles", "app_settings", "lost_id_reports",
  "school_users", "trusted_devices", "webauthn_credentials",
];

interface ImportResult {
  success: boolean;
  imported_at: string;
  imported_by: string;
  source_export: string;
  mode: string;
  total_inserted: number;
  total_errors: number;
  details: Record<string, { inserted: number; errors: string[] }>;
}

interface BackupMetadata {
  exported_at: string;
  exported_by: string;
  version: string;
  tables: string[];
  row_counts: Record<string, number>;
  total_rows: number;
}

const AdminBackup = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>(ALL_TABLES);
  const [importMode, setImportMode] = useState("upsert");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewMeta, setPreviewMeta] = useState<BackupMetadata | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTable = (table: string) => {
    setSelectedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  const selectAll = () => setSelectedTables(ALL_TABLES);
  const selectNone = () => setSelectedTables([]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }

      const res = await supabase.functions.invoke("backup-export", {
        body: { tables: selectedTables },
      });

      if (res.error) throw new Error(res.error.message);

      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kabejja-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Backup exported: ${res.data.metadata.total_rows} total rows`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.metadata || !json.data) {
          toast.error("Invalid backup file format");
          return;
        }
        setPreviewMeta(json.metadata);
        setPendingFile(file);
        setImportResult(null);
      } catch {
        toast.error("Could not parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!pendingFile) return;
    setImporting(true);
    try {
      const text = await pendingFile.text();
      const json = JSON.parse(text);

      const res = await supabase.functions.invoke("backup-import", {
        body: { ...json, mode: importMode },
      });

      if (res.error) throw new Error(res.error.message);

      setImportResult(res.data);
      if (res.data.total_errors === 0) {
        toast.success(`Import complete: ${res.data.total_inserted} rows restored`);
      } else {
        toast.warning(`Import done with ${res.data.total_errors} errors`);
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Backup & Restore</h1>
        <p className="text-sm text-muted-foreground">Export all records as JSON and restore from backup files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5 text-primary" />
              Export Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Select tables to export:</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>All</Button>
                <Button variant="ghost" size="sm" onClick={selectNone}>None</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto border rounded-md p-3">
              {ALL_TABLES.map((table) => (
                <label key={table} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-1.5 py-1">
                  <Checkbox
                    checked={selectedTables.includes(table)}
                    onCheckedChange={() => toggleTable(table)}
                  />
                  <span className="truncate">{table.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>

            <Badge variant="secondary" className="text-xs">
              {selectedTables.length} / {ALL_TABLES.length} tables selected
            </Badge>

            <Button
              onClick={handleExport}
              disabled={exporting || selectedTables.length === 0}
              className="w-full bg-primary text-primary-foreground"
            >
              {exporting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Exporting...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Export Backup</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5 text-primary" />
              Restore from Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">Caution</AlertTitle>
              <AlertDescription className="text-xs">
                Importing will overwrite existing records with matching IDs. Always export a fresh backup before restoring.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Import Mode</Label>
              <Select value={importMode} onValueChange={setImportMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upsert">Merge (upsert) — update existing, add new</SelectItem>
                  <SelectItem value="clean_import">Clean Import — delete all then insert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileJson className="h-4 w-4 mr-2" />
              {pendingFile ? pendingFile.name : "Select Backup File (.json)"}
            </Button>

            {previewMeta && (
              <Card className="bg-muted/30">
                <CardContent className="py-3 space-y-2">
                  <p className="text-xs font-medium">Backup Preview</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>Exported:</span>
                    <span>{new Date(previewMeta.exported_at).toLocaleString()}</span>
                    <span>By:</span>
                    <span>{previewMeta.exported_by}</span>
                    <span>Tables:</span>
                    <span>{previewMeta.tables?.length || 0}</span>
                    <span>Total rows:</span>
                    <span className="font-medium text-foreground">{previewMeta.total_rows?.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleImport}
              disabled={importing || !pendingFile}
              className="w-full"
              variant="destructive"
            >
              {importing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importing...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Restore Backup</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {importResult.total_errors === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4 flex-wrap">
              <Badge variant="secondary">{importResult.total_inserted} rows inserted</Badge>
              <Badge variant={importResult.total_errors > 0 ? "destructive" : "secondary"}>
                {importResult.total_errors} errors
              </Badge>
              <Badge variant="outline">Mode: {importResult.mode}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(importResult.details).map(([table, info]) => (
                <div key={table} className={`rounded-md border p-2 text-xs ${info.errors.length > 0 ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                  <p className="font-medium truncate">{table.replace(/_/g, " ")}</p>
                  <p className="text-muted-foreground">{info.inserted} rows</p>
                  {info.errors.length > 0 && (
                    <p className="text-destructive text-[10px] mt-1">{info.errors[0]}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="bg-muted/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Backup Best Practices</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Export backups regularly, especially before major changes</li>
                <li>Store backup files securely — they contain sensitive data</li>
                <li>Use "Merge" mode for safe incremental restores</li>
                <li>Use "Clean Import" only when doing a full system reset</li>
                <li>The backup paginates all tables to capture every row (beyond 1000 limit)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBackup;
