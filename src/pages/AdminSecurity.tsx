import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { Shield, Monitor, Search, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";

const AdminSecurity = () => {
  const queryClient = useQueryClient();
  const [logSearch, setLogSearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");

  // Fetch access logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["access-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Fetch trusted devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ["trusted-devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trusted_devices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Toggle device active status
  const toggleDevice = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("trusted_devices")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trusted-devices"] });
      toast.success("Device status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete device
  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trusted_devices")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trusted-devices"] });
      toast.success("Device removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredLogs = logs.filter(
    (l: any) =>
      l.email?.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.ip_address?.includes(logSearch) ||
      l.device_fingerprint?.includes(logSearch)
  );

  const filteredDevices = devices.filter(
    (d: any) =>
      d.device_name?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.device_fingerprint?.includes(deviceSearch) ||
      d.user_id?.includes(deviceSearch)
  );

  const failedCount = logs.filter((l: any) => !l.success).length;
  const uniqueIPs = new Set(logs.map((l: any) => l.ip_address)).size;
  const pendingDevices = devices.filter((d: any) => !d.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Security Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor access logs and manage trusted devices
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total Logins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Failed Attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{uniqueIPs}</p>
            <p className="text-xs text-muted-foreground">Unique IPs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{pendingDevices}</p>
            <p className="text-xs text-muted-foreground">Pending Devices</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending device approvals alert */}
      {pendingDevices > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
            <p className="text-sm">
              <strong>{pendingDevices} device(s)</strong> are awaiting approval. Review them in the Trusted Devices tab.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={pendingDevices > 0 ? "devices" : "logs"}>
        <TabsList>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
          <TabsTrigger value="devices" className="relative">
            Trusted Devices
            {pendingDevices > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-[10px] flex items-center justify-center rounded-full">
                {pendingDevices}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Access Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Login Activity</CardTitle>
              <CardDescription>Recent login attempts with IP and device info</CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, IP, or fingerprint..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="hidden md:table-cell">Device</TableHead>
                        <TableHead className="hidden lg:table-cell">Reason</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No access logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {log.success ? (
                                <Badge variant="default" className="bg-green-600 text-xs gap-1">
                                  <CheckCircle className="h-3 w-3" /> OK
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs gap-1">
                                  <XCircle className="h-3 w-3" /> Fail
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.email || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{log.ip_address || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs max-w-[200px] truncate">
                              {log.user_agent?.substring(0, 60) || "—"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                              {log.failure_reason || "—"}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {format(new Date(log.created_at), "dd/MM/yy HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trusted Devices Tab */}
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Registered Devices
              </CardTitle>
              <CardDescription>Approve or revoke device access for users</CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {devicesLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead className="hidden md:table-cell">Device Info</TableHead>
                        <TableHead className="hidden lg:table-cell">Fingerprint</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDevices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No devices registered
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDevices.map((device: any) => (
                          <TableRow key={device.id} className={!device.is_active ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}>
                            <TableCell>
                              {device.is_active ? (
                                <Badge variant="default" className="bg-green-600 text-xs">Trusted</Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs max-w-[120px] truncate">
                              {device.user_id?.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs max-w-[200px] truncate">
                              {device.device_name || "Unknown"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell font-mono text-xs max-w-[120px] truncate">
                              {device.device_fingerprint?.substring(0, 16)}...
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {device.last_used_at
                                ? format(new Date(device.last_used_at), "dd/MM/yy HH:mm")
                                : "Never"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!device.is_active ? (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() => toggleDevice.mutate({ id: device.id, is_active: true })}
                                  >
                                    Approve
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-orange-600"
                                    onClick={() => toggleDevice.mutate({ id: device.id, is_active: false })}
                                  >
                                    Revoke
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    if (confirm("Remove this device permanently?")) {
                                      deleteDevice.mutate(device.id);
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurity;
