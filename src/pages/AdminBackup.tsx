import { useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Download, Upload, Loader2, ShieldCheck, AlertTriangle, CheckCircle2, FileJson, FileSpreadsheet, BarChart3, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

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

const TABLE_GROUPS: Record<string, string[]> = {
  "Student & Applications": ["applications", "profiles", "user_roles", "schools", "school_users"],
  "Finances": ["expenses", "parent_payments", "payment_codes", "accounting_transactions", "budget_allocations", "petty_cash"],
  "Materials & Services": ["material_categories", "material_distributions", "bursary_request_links", "bursary_requests", "appointments"],
  "Records & Compliance": ["student_claims", "report_cards", "lawyer_form_templates", "lawyer_form_submissions", "lost_id_reports"],
  "Staff & Security": ["staff_profiles", "attendance_records", "audit_logs", "access_logs", "trusted_devices", "webauthn_credentials", "app_settings"],
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
];

const sheetName = (table: string): string => {
  const name = table.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return name.length > 31 ? name.slice(0, 31) : name;
};

const formatTableName = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
  const [exportMeta, setExportMeta] = useState<BackupMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTable = (table: string) => {
    setSelectedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  const selectAll = () => setSelectedTables(ALL_TABLES);
  const selectNone = () => setSelectedTables([]);

  // Chart data derived from the last export or imported file preview
  const activeMeta = exportMeta || previewMeta;

  const barChartData = useMemo(() => {
    if (!activeMeta?.row_counts) return [];
    return Object.entries(activeMeta.row_counts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([table, count]) => ({
        name: formatTableName(table),
        rows: count,
      }));
  }, [activeMeta]);

  const pieChartData = useMemo(() => {
    if (!activeMeta?.row_counts) return [];
    return Object.entries(TABLE_GROUPS).map(([group, tables]) => ({
      name: group,
      value: tables.reduce((sum, t) => sum + (activeMeta.row_counts[t] || 0), 0),
    })).filter((d) => d.value > 0);
  }, [activeMeta]);

  const topTables = useMemo(() => {
    if (!activeMeta?.row_counts) return [];
    return Object.entries(activeMeta.row_counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [activeMeta]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await supabase.functions.invoke("backup-export", {
        body: { tables: selectedTables },
      });

      if (res.error) throw new Error(res.error.message);

      const { metadata, data } = res.data;
      setExportMeta(metadata);

      // Create Excel workbook
      const wb = XLSX.utils.book_new();

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

      for (const table of metadata.tables) {
        const rows = data[table] || [];
        if (rows.length === 0) continue;

        const flatRows = rows.map((row: Record<string, unknown>) => {
          const flat: Record<string, unknown> = {};
          for (const [key, val] of Object.entries(row)) {
            flat[key] = typeof val === "object" && val !== null ? JSON.stringify(val) : val;
          }
          return flat;
        });

        const ws = XLSX.utils.json_to_sheet(flatRows);
        ws["!protect"] = { password: "", objects: true, scenarios: true } as any;
        const cols = Object.keys(flatRows[0] || {});
        ws["!cols"] = cols.map((col) => ({ wch: Math.min(40, Math.max(col.length + 2, 12)) }));
        XLSX.utils.book_append_sheet(wb, ws, sheetName(table));
      }

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
        setExportMeta(null);
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
              Exports a <strong>write-protected Excel file</strong> (each table = 1 sheet) plus a <strong>JSON file</strong> for restoring.
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

      {/* Data Visualization Section */}
      {activeMeta && barChartData.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold text-foreground">{activeMeta.total_rows.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Tables</p>
                <p className="text-2xl font-bold text-foreground">{activeMeta.tables.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Largest Table</p>
                <p className="text-sm font-bold text-foreground truncate">{topTables[0]?.[0] ? formatTableName(topTables[0][0]) : "—"}</p>
                <p className="text-xs text-muted-foreground">{topTables[0]?.[1]?.toLocaleString() || 0} rows</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Empty Tables</p>
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(activeMeta.row_counts).filter((c) => c === 0).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart — Rows per Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Records per Table
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(300, barChartData.length * 28)}>
                  <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 10 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="rows" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart — Data by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5 text-primary" />
                  Data Distribution by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="45%"
                      outerRadius={110}
                      innerRadius={50}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [value.toLocaleString() + " rows", "Records"]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Top 5 tables list */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Top 5 Tables by Size</p>
                  {topTables.map(([table, count], i) => {
                    const pct = activeMeta.total_rows > 0 ? (count / activeMeta.total_rows) * 100 : 0;
                    return (
                      <div key={table} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center text-xs mb-0.5">
                            <span className="font-medium truncate">{formatTableName(table)}</span>
                            <span className="text-muted-foreground ml-2">{count.toLocaleString()}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

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
