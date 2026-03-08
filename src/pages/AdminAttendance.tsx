import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateDeviceFingerprint } from "@/hooks/useDeviceFingerprint";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  MapPin, LogIn, LogOut, Clock, Loader2, Navigation,
  CheckCircle, AlertTriangle, Calendar, Fingerprint,
} from "lucide-react";
import BiometricAttendance from "@/components/admin/BiometricAttendance";

const AdminAttendance = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Get today's attendance for current user
  const { data: todayRecord, isLoading: todayLoading } = useQuery({
    queryKey: ["my-attendance-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", user?.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Admin: get all attendance for selected date
  const { data: allRecords = [], isLoading: allLoading } = useQuery({
    queryKey: ["all-attendance", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("date", selectedDate)
        .order("check_in_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Admin: get profiles for mapping user_ids to names
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-attendance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const profileMap = Object.fromEntries(
    profiles.map((p: any) => [p.user_id, p.full_name || p.email || "Unknown"])
  );

  // Get current GPS location
  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Force fresh reading — no caching
      });
    });
  };

  // Check-in / Check-out mutation
  const attendanceMutation = useMutation({
    mutationFn: async (action: "check_in" | "check_out") => {
      setGpsStatus("loading");
      try {
        const position = await getLocation();
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        setCoords({ lat, lng, accuracy });
        setGpsStatus("success");

        const fingerprint = await generateDeviceFingerprint();

        const { data, error } = await supabase.functions.invoke("attendance", {
          body: { action, lat, lng, accuracy, device_fingerprint: fingerprint },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return data;
      } catch (err: any) {
        setGpsStatus("error");
        if (err.code === 1) throw new Error("Location access denied. Please allow GPS access.");
        if (err.code === 2) throw new Error("GPS unavailable. Please try again.");
        if (err.code === 3) throw new Error("GPS timed out. Move to an open area and try again.");
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance-today"] });
      queryClient.invalidateQueries({ queryKey: ["all-attendance"] });
      const dist = data?.distance;
      if (data?.action === "check_in") {
        toast.success(`Checked in successfully! (${dist}m from office)`);
      } else {
        toast.success(`Checked out! Hours: ${data?.record?.hours_worked || "—"} (${dist}m from office)`);
      }
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const canCheckIn = !todayRecord;
  const canCheckOut = todayRecord?.status === "checked_in";
  const isCheckedOut = todayRecord?.status === "checked_out";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Attendance
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          GPS-verified check-in/out — you must be at the office
        </p>
      </div>

      {/* My Today's Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Today's Status
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status display */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                {canCheckIn && (
                  <>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-semibold">Not Checked In</p>
                      <p className="text-sm text-muted-foreground">
                        You haven't checked in yet today
                      </p>
                    </div>
                  </>
                )}
                {canCheckOut && (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">Checked In</p>
                      <p className="text-sm text-muted-foreground">
                        Since {todayRecord?.check_in_at ? format(new Date(todayRecord.check_in_at), "HH:mm") : "—"}
                        {todayRecord?.check_in_distance != null && ` • ${todayRecord.check_in_distance}m from office`}
                      </p>
                    </div>
                  </>
                )}
                {isCheckedOut && (
                  <>
                    <LogOut className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Day Complete</p>
                      <p className="text-sm text-muted-foreground">
                        {todayRecord?.check_in_at && format(new Date(todayRecord.check_in_at), "HH:mm")}
                        {" → "}
                        {todayRecord?.check_out_at && format(new Date(todayRecord.check_out_at), "HH:mm")}
                        {todayRecord?.hours_worked != null && ` • ${todayRecord.hours_worked}h worked`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* GPS status indicator */}
              {gpsStatus === "loading" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Getting your GPS location...
                </div>
              )}
              {gpsStatus === "success" && coords && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} (±{Math.round(coords.accuracy)}m)
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {canCheckIn && (
                  <Button
                    onClick={() => attendanceMutation.mutate("check_in")}
                    disabled={attendanceMutation.isPending}
                    className="flex-1 h-14 text-base gap-2"
                    size="lg"
                  >
                    {attendanceMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <LogIn className="h-5 w-5" />
                    )}
                    Check In
                  </Button>
                )}
                {canCheckOut && (
                  <Button
                    onClick={() => attendanceMutation.mutate("check_out")}
                    disabled={attendanceMutation.isPending}
                    variant="destructive"
                    className="flex-1 h-14 text-base gap-2"
                    size="lg"
                  >
                    {attendanceMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <LogOut className="h-5 w-5" />
                    )}
                    Check Out
                  </Button>
                )}
                {isCheckedOut && (
                  <div className="flex-1 h-14 flex items-center justify-center rounded-lg border bg-muted text-muted-foreground text-sm">
                    ✓ Attendance completed for today
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin: All Staff Attendance */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Staff Attendance
                </CardTitle>
                <CardDescription>View all staff attendance records</CardDescription>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm bg-background"
              />
            </div>
          </CardHeader>
          <CardContent>
            {allLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No attendance records for this date
                        </TableCell>
                      </TableRow>
                    ) : (
                      allRecords.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-sm">
                            {profileMap[r.user_id] || r.user_id?.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.check_in_at ? format(new Date(r.check_in_at), "HH:mm:ss") : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.check_out_at ? format(new Date(r.check_out_at), "HH:mm:ss") : "—"}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {r.hours_worked != null ? `${r.hours_worked}h` : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            In: {r.check_in_distance ?? "—"}m
                            {r.check_out_distance != null && ` / Out: ${r.check_out_distance}m`}
                          </TableCell>
                          <TableCell>
                            {r.status === "checked_in" ? (
                              <Badge className="bg-green-600 text-xs">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Done</Badge>
                            )}
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
      )}
    </div>
  );
};

export default AdminAttendance;
