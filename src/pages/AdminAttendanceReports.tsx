import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserCheck, UserX, Search, School } from "lucide-react";

interface AttendanceRow {
  id: string;
  student_name: string;
  class_grade: string;
  registration_number: string;
  match_status: string;
  term: string;
  year: string;
  reporter_name: string;
  reporter_phone: string;
  created_at: string;
  school_id: string;
}

interface SchoolInfo {
  id: string;
  name: string;
}

const AdminAttendanceReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AttendanceRow[]>([]);
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [rRes, sRes] = await Promise.all([
        supabase.from("school_attendance_reports").select("*").order("created_at", { ascending: false }),
        supabase.from("schools").select("id, name"),
      ]);
      setReports((rRes.data as AttendanceRow[]) || []);
      setSchools((sRes.data as SchoolInfo[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const getSchoolName = (id: string) => schools.find((s) => s.id === id)?.name || "Unknown";

  const filtered = reports.filter(
    (r) =>
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
      getSchoolName(r.school_id).toLowerCase().includes(search.toLowerCase())
  );

  const matched = filtered.filter((r) => r.match_status === "matched").length;
  const noDetails = filtered.filter((r) => r.match_status === "no_details").length;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <School className="h-6 w-6 text-primary" /> School Attendance Reports
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">Total Reported</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-600">{matched}</p>
            <p className="text-xs text-muted-foreground">Matched Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{noDetails}</p>
            <p className="text-xs text-muted-foreground">No Details Yet</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by student, school, or reg number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No attendance reports yet.</p>
        )}
        {filtered.map((r) => (
          <Card key={r.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="flex items-center gap-3 p-3">
              {r.match_status === "matched" ? (
                <UserCheck className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <UserX className="h-5 w-5 text-amber-600 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{r.student_name}</span>
                  {r.class_grade && <Badge variant="outline" className="text-[10px]">{r.class_grade}</Badge>}
                  <Badge
                    className={`text-[10px] ${
                      r.match_status === "matched"
                        ? "bg-green-500/10 text-green-700 border-green-500/30"
                        : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                    }`}
                  >
                    {r.match_status === "matched" ? "At School ✓" : "No Details Yet"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {getSchoolName(r.school_id)} · {r.term} {r.year} · By {r.reporter_name} ({r.reporter_phone})
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminAttendanceReports;
