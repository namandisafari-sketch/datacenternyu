import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  registerFingerprint,
  verifyFingerprint,
} from "@/lib/webauthn";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Fingerprint, LogIn, LogOut, Clock, Loader2, CheckCircle,
  AlertTriangle, ShieldCheck, UserCircle, Timer,
} from "lucide-react";

const BiometricAttendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setBiometricAvailable);
  }, []);

  // Get current user's staff profile
  const { data: staffProfile } = useQuery({
    queryKey: ["my-staff-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get registered credentials
  const { data: credentials = [] } = useQuery({
    queryKey: ["my-webauthn-credentials", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webauthn_credentials")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get today's record
  const { data: todayRecord, isLoading: todayLoading } = useQuery({
    queryKey: ["my-attendance-today-bio", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Register fingerprint
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const cred = await registerFingerprint(
        user.id,
        user.email || "staff",
        staffProfile?.full_name || user.email || "Staff"
      );
      const { error } = await supabase.from("webauthn_credentials").insert({
        user_id: user.id,
        credential_id: cred.credentialId,
        public_key: cred.publicKey,
        counter: cred.counter,
        device_name: navigator.userAgent.includes("Windows") ? "Windows Laptop" : 
                     navigator.userAgent.includes("Mac") ? "MacBook" : "Device",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-webauthn-credentials"] });
      toast.success("Fingerprint registered successfully!");
    },
    onError: (e: any) => toast.error(e.message || "Registration failed"),
  });

  // Clock in
  const clockInMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      setVerifying(true);
      try {
        await verifyFingerprint(credentials.map((c: any) => ({ credentialId: c.credential_id })));
      } finally {
        setVerifying(false);
      }
      const now = new Date();
      const { error } = await supabase.from("attendance_records").insert({
        user_id: user.id,
        date: now.toISOString().split("T")[0],
        check_in_at: now.toISOString(),
        status: "checked_in",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance-today-bio"] });
      queryClient.invalidateQueries({ queryKey: ["all-attendance"] });
      toast.success("Clocked in successfully!");
    },
    onError: (e: any) => {
      setVerifying(false);
      toast.error(e.message || "Clock-in failed");
    },
  });

  // Clock out
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      if (!user || !todayRecord) throw new Error("No active check-in");
      setVerifying(true);
      try {
        await verifyFingerprint(credentials.map((c: any) => ({ credentialId: c.credential_id })));
      } finally {
        setVerifying(false);
      }
      const now = new Date();
      const checkInTime = new Date(todayRecord.check_in_at!);
      const hoursWorked = Math.round(((now.getTime() - checkInTime.getTime()) / 3600000) * 100) / 100;

      const { error } = await supabase
        .from("attendance_records")
        .update({
          check_out_at: now.toISOString(),
          hours_worked: hoursWorked,
          status: "checked_out",
        })
        .eq("id", todayRecord.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance-today-bio"] });
      queryClient.invalidateQueries({ queryKey: ["all-attendance"] });
      toast.success("Clocked out successfully!");
    },
    onError: (e: any) => {
      setVerifying(false);
      toast.error(e.message || "Clock-out failed");
    },
  });

  const isCheckedIn = todayRecord?.status === "checked_in";
  const isCheckedOut = todayRecord?.status === "checked_out";
  const hasCredentials = credentials.length > 0;
  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {biometricAvailable === false && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-destructive">Fingerprint Scanner Not Available</p>
              <p className="text-sm text-muted-foreground">
                Your device doesn't have a compatible fingerprint scanner, or it's not set up in your OS.
                Please configure Windows Hello or macOS Touch ID first.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fingerprint Registration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Fingerprint className="h-5 w-5 text-primary" />
              Fingerprint Registration
            </CardTitle>
            <CardDescription>
              Register your fingerprint for biometric attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {staffProfile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {staffProfile.photo_url ? (
                    <img src={staffProfile.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserCircle className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{staffProfile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{staffProfile.staff_number} · {staffProfile.department}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No staff profile found for your account.</p>
            )}

            {hasCredentials ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{credentials.length} fingerprint(s) registered</span>
                </div>
                {credentials.map((c: any) => (
                  <div key={c.id} className="text-xs text-muted-foreground px-6">
                    {c.device_name || "Device"} — {format(new Date(c.created_at), "dd MMM yyyy")}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-amber-600 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                No fingerprint registered yet
              </p>
            )}

            <Button
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending || biometricAvailable === false}
              className="w-full gap-2"
              variant={hasCredentials ? "outline" : "default"}
            >
              {registerMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Fingerprint className="h-4 w-4" />
              )}
              {hasCredentials ? "Register Another Fingerprint" : "Register Fingerprint"}
            </Button>
          </CardContent>
        </Card>

        {/* Clock In/Out */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Attendance Clock
            </CardTitle>
            <CardDescription>
              {format(now, "EEEE, dd MMMM yyyy")} — {format(now, "HH:mm")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Status display */}
                <div className={`p-4 rounded-lg text-center ${
                  isCheckedOut ? "bg-muted" :
                  isCheckedIn ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900" :
                  "bg-muted/50"
                }`}>
                  {isCheckedOut ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-semibold">Day Complete</p>
                      <p className="text-sm text-muted-foreground">
                        {todayRecord?.check_in_at && format(new Date(todayRecord.check_in_at), "HH:mm")}
                        {" → "}
                        {todayRecord?.check_out_at && format(new Date(todayRecord.check_out_at), "HH:mm")}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        <Timer className="h-3 w-3 mr-1" />
                        {todayRecord?.hours_worked?.toFixed(1)} hrs
                      </Badge>
                    </>
                  ) : isCheckedIn ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="font-semibold text-green-700 dark:text-green-400">Currently Clocked In</p>
                      <p className="text-sm text-muted-foreground">
                        Since {todayRecord?.check_in_at && format(new Date(todayRecord.check_in_at), "HH:mm")}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold">Not Clocked In</p>
                      <p className="text-sm text-muted-foreground">Use your fingerprint to clock in</p>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                {!isCheckedOut && (
                  <div>
                    {!isCheckedIn ? (
                      <Button
                        onClick={() => clockInMutation.mutate()}
                        disabled={clockInMutation.isPending || !hasCredentials || verifying}
                        className="w-full gap-2 h-14 text-lg"
                        size="lg"
                      >
                        {clockInMutation.isPending || verifying ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <LogIn className="h-5 w-5" />
                        )}
                        {verifying ? "Verifying Fingerprint..." : "Clock In"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => clockOutMutation.mutate()}
                        disabled={clockOutMutation.isPending || !hasCredentials || verifying}
                        variant="destructive"
                        className="w-full gap-2 h-14 text-lg"
                        size="lg"
                      >
                        {clockOutMutation.isPending || verifying ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <LogOut className="h-5 w-5" />
                        )}
                        {verifying ? "Verifying Fingerprint..." : "Clock Out"}
                      </Button>
                    )}

                    {!hasCredentials && (
                      <p className="text-xs text-destructive text-center mt-2">
                        Register your fingerprint first to use biometric attendance
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BiometricAttendance;
