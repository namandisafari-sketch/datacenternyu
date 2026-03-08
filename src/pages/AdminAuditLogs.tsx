import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Search, Calendar } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  details: any;
  created_at: string;
  user_email?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  backdate_application_create: { label: "Backdated New Application", color: "destructive" },
  backdate_application_edit: { label: "Backdated Existing Application", color: "destructive" },
  backdate_transaction: { label: "Backdated Transaction", color: "secondary" },
  backdate_payment: { label: "Backdated Payment", color: "secondary" },
};

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500) as any;

    if (data) {
      // Enrich with user emails
      const userIds = [...new Set(data.map((l: any) => l.user_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p.email || p.full_name || "Unknown"])
      );

      setLogs(
        data.map((l: any) => ({
          ...l,
          user_email: profileMap.get(l.user_id) || "Unknown",
        }))
      );
    }
    setLoading(false);
  };

  const filtered = logs.filter((l) => {
    if (actionFilter !== "all" && l.action !== actionFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.user_email?.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        l.table_name.toLowerCase().includes(s) ||
        JSON.stringify(l.details).toLowerCase().includes(s)
      );
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all backdating events and system modifications
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, action, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map((a) => (
                <SelectItem key={a} value={a}>
                  {ACTION_LABELS[a]?.label || a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total Logs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {logs.filter((l) => l.action.includes("backdate")).length}
            </p>
            <p className="text-xs text-muted-foreground">Backdate Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {new Set(logs.map((l) => l.user_id)).size}
            </p>
            <p className="text-xs text-muted-foreground">Unique Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {logs.filter((l) => {
                const d = new Date(l.created_at);
                const now = new Date();
                return d.toDateString() === now.toDateString();
              }).length}
            </p>
            <p className="text-xs text-muted-foreground">Today's Events</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading audit logs...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No audit logs found</p>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Who</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => {
                    const meta = ACTION_LABELS[log.action];
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{log.user_email}</TableCell>
                        <TableCell>
                          <Badge variant={meta?.color as any || "outline"} className="text-[10px]">
                            {meta?.label || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.table_name}</TableCell>
                        <TableCell className="text-xs max-w-[300px]">
                          {log.details && typeof log.details === "object" ? (
                            <div className="space-y-0.5">
                              {Object.entries(log.details).map(([k, v]) => (
                                <div key={k}>
                                  <span className="text-muted-foreground">{k.replace(/_/g, " ")}:</span>{" "}
                                  <span className="font-medium">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogs;
