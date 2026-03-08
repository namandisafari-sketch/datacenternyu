import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Download, Upload, Loader2, ShieldCheck, AlertTriangle, CheckCircle2, FileJson, FileSpreadsheet } from "lucide-react";

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

// Shorten table names for Excel sheet name limit (31 chars)
const sheetName = (table: string): string => {
  const name = table.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return name.length > 31 ? name.slice(0, 31) : name;
};

interface ImportResult {
  success: boolean;
  imported_at: string;
  imported_by: string;
  source_export: string;
  total_inserted: number;
  total_skipped: number;
  total_errors: number;
  details: Record<string, { inserted: number; skipped: number; errors: string[] }>;
}

interface BackupMetadata {
  exported_at: string;
  exported_by: string;
  tables: string[];
  row_counts: Record<string, number>;
  total_rows: number;
}

const AdminBackup = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>(ALL_TABLES);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewMeta, setPreviewMeta] = useState<BackupMetadata | null>(null);
  const [pendingBackupData, setPendingBackupData] = useState<any>(null);
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
      const res = await supabase.functions.invoke("backup-export", {
        body: { tables: selectedTables },
      });

      if (res.error) throw new Error(res.error.message);

      const { metadata, data } = res.data;

      // Create Excel workbook
      const wb = XLSX.utils.book_new();

      // Add metadata sheet
      const metaRows = [
        ["Kabejja Backup Report"],
        ["Exported At", metadata.exported_at],
        ["Exported By", metadata.exported_by],
        ["Total Rows", metadata.total_rows],
        [""],
        ["Table", "Row Count"],
        ...Object.entries(metadata.row_counts as Record<string, number>).map(([t, c]) => [t, c]),
      ];
      const metaWs = XLSX.utils.aoa_to_sheet(metaRows);
      metaWs["!protect"] = { password: "", objects: true, scenarios: true } as any;
      XLSX.utils.book_append_sheet(wb, metaWs, "Summary");

      // Add each table as a protected sheet
      for (const table of metadata.tables) {
        const rows = data[table] || [];
        if (rows.length === 0) continue;

        // Flatten JSON columns to strings for readability
        const flatRows = rows.map((row: Record<string, unknown>) => {
          const flat: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(row)) {
            flat[key] = typeof val === "object" && val !== null ? JSON.stringify(val) : val;
          }
          return flat;
        });

        const ws = XLSX.utils.json_to_sheet(flatRows);
        // Write-protect the sheet
        ws["!protect"] = { password: "", sheet: true, objects: true, scenarios: true };
        // Auto-size columns (rough estimate)
        const cols = Object.keys(flatRows[0] || {});
        ws["!cols"] = cols.map((col) => ({
          wch: Math.min(40, Math.max(col.length + 2, 12)),
        }));

        XLSX.utils.book_append_sheet(wb, ws, sheetName(table));
      }

      // Write and download
      const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbOut], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kabejja-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Also download JSON for restore purposes
      const jsonBlob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const a2 = document.createElement("a");
      a2.href = jsonUrl;
      a2.download = `kabejja-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a2);
      a2.click();
      document.body.removeChild(a2);
      URL.revokeObjectURL(jsonUrl);

      toast.success(`Backup exported: ${metadata.total_rows} rows → Excel + JSON files downloaded`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select the .json backup file for restore (not the Excel file)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.metadata || !json.data) {
          toast.error("Invalid backup file format");
          return;
        }
        setPreviewMeta(json.metadata);
        setPendingBackupData(json);
        setImportResult(null);
      } catch {
        toast.error("Could not parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!pendingBackupData) return;
    setImporting(true);
    try {
      const res = await supabase.functions.invoke("backup-import", {
        body: pendingBackupData,
      });

      if (res.error) throw new Error(res.error.message);

      setImportResult(res.data);
      if (res.data.total_errors === 0) {
        toast.success(`Import complete: ${res.data.total_inserted} new rows added, ${res.data.total_skipped} existing skipped`);
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
        <p className="text-sm text-muted-foreground">Export records as write-protected Excel and restore from JSON backups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Export Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Exports a <strong>write-protected Excel file</strong> (each table = 1 sheet) for viewing, plus a <strong>JSON file</strong> for restoring.
            </p>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Select tables:</p>
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
                <><Download className="h-4 w-4 mr-2" /> Export as Excel + JSON</>
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
            <Alert className="border-muted bg-muted/30">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle className="text-sm">Safe Import</AlertTitle>
              <AlertDescription className="text-xs">
                Existing records are always skipped — only new records are added. No data will be overwritten.
              </AlertDescription>
            </Alert>

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
              {pendingBackupData ? "✓ File loaded" : "Select JSON Backup File"}
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
              disabled={importing || !pendingBackupData}
              className="w-full bg-secondary text-secondary-foreground"
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
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4 flex-wrap">
              <Badge variant="secondary">{importResult.total_inserted} new rows added</Badge>
              <Badge variant="outline">{importResult.total_skipped} existing skipped</Badge>
              <Badge variant={importResult.total_errors > 0 ? "destructive" : "secondary"}>
                {importResult.total_errors} errors
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(importResult.details).map(([table, info]) => (
                <div key={table} className={`rounded-md border p-2 text-xs ${info.errors.length > 0 ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                  <p className="font-medium truncate">{table.replace(/_/g, " ")}</p>
                  <p className="text-muted-foreground">{info.inserted} added, {info.skipped} skipped</p>
                  {info.errors.length > 0 && (
                    <p className="text-destructive text-[10px] mt-1">{info.errors[0]}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-muted/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">Backup Best Practices</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Export regularly — you get both an Excel report (read-only) and a JSON restore file</li>
                <li>The Excel file has write-protected sheets for safe viewing/sharing</li>
                <li>Use the JSON file to restore — the Excel file is for reference only</li>
                <li>Import is safe — existing records are always skipped, never overwritten</li>
                <li>All tables are paginated to capture every row (no 1000-row limit)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBackup;
