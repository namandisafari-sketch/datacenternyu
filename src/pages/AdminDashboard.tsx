import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AdmissionSettings from "@/components/admin/AdmissionSettings";
import LocationStats from "@/components/admin/LocationStats";
import BursaryManagementDashboard from "@/components/admin/BursaryManagementDashboard";

interface Application {
  id: string;
  user_id: string;
  parent_name: string;
  parent_phone: string;
  student_name: string;
  education_level: string;
  gender: string | null;
  district: string | null;
  sub_county: string | null;
  parish: string | null;
  village: string | null;
  status: string;
  school_id: string | null;
  created_at: string;
}

interface SchoolRow {
  id: string;
  name: string;
  full_fees: number;
  nyunga_covered_fees: number;
  parent_pays: number | null;
  total_bursaries: number;
}

interface Expense {
  id: string;
  amount: number;
}

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const COLORS = {
  boys: "hsl(215, 58%, 26%)",
  girls: "hsl(40, 95%, 55%)",
  full: "hsl(145, 45%, 38%)",
  half: "hsl(215, 58%, 50%)",
  pending: "hsl(40, 90%, 50%)",
};

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [appsRes, schoolsRes, expsRes, claimsRes] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("schools").select("*"),
        supabase.from("expenses").select("id, amount"),
        supabase.from("student_claims").select("id, status"),
      ]);
      setApplications((appsRes.data as unknown as Application[]) || []);
      setSchools((schoolsRes.data as unknown as SchoolRow[]) || []);
      setExpenses((expsRes.data as unknown as Expense[]) || []);
      setClaims(claimsRes.data || []);
      setLoading(false);
    };
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  if (authLoading || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const approved = applications.filter((a) => a.status === "approved");
  const pending = applications.filter((a) => a.status === "pending");
  const totalExpenseSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const openClaims = claims.filter((c: any) => c.status === "open").length;

  // Boys vs Girls (approved only)
  const boys = approved.filter((a) => a.gender?.toLowerCase() === "male").length;
  const girls = approved.filter((a) => a.gender?.toLowerCase() === "female").length;
  const genderData = [
    { name: "Boys", value: boys },
    { name: "Girls", value: girls },
  ];

  // Full vs Half bursary: full = school_id assigned (school covers), half = no school yet or partial
  const fullBursary = approved.filter((a) => a.school_id).length;
  const halfBursary = approved.filter((a) => !a.school_id).length;
  const bursaryData = [
    { name: "Full Bursary", value: fullBursary },
    { name: "Half Bursary", value: halfBursary },
  ];

  // Total Nyunga spending = sum of nyunga_covered_fees for each approved student's school
  const schoolMap = new Map(schools.map((s) => [s.id, s]));
  const totalNyungaSpending = approved.reduce((sum, app) => {
    if (app.school_id) {
      const school = schoolMap.get(app.school_id);
      return sum + (school?.nyunga_covered_fees || 0);
    }
    return sum;
  }, 0);

  // By year breakdown
  const yearMap = new Map<string, { boys: number; girls: number; total: number }>();
  approved.forEach((a) => {
    const year = new Date(a.created_at).getFullYear().toString();
    const entry = yearMap.get(year) || { boys: 0, girls: 0, total: 0 };
    if (a.gender?.toLowerCase() === "male") entry.boys++;
    else if (a.gender?.toLowerCase() === "female") entry.girls++;
    entry.total++;
    yearMap.set(year, entry);
  });
  const yearData = Array.from(yearMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, d]) => ({ year, ...d }));

  const stats = [
    { label: "Total Applications", value: applications.length, icon: Users, color: "text-primary" },
    { label: "Pending", value: pending.length, icon: Clock, color: "text-yellow-600" },
    { label: "Approved", value: approved.length, icon: CheckCircle, color: "text-accent" },
    { label: "Nyunga Spending", value: formatUGX(totalNyungaSpending), icon: DollarSign, color: "text-secondary" },
    { label: "Open Claims", value: openClaims, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="p-3 sm:p-6 bg-background min-h-full">
      <div className="w-full space-y-4 sm:space-y-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>

        <AdmissionSettings />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="py-3 sm:py-5 px-3 sm:px-4 flex items-center gap-2 sm:gap-3">
                <s.icon size={22} className={`${s.color} shrink-0`} />
                <div className="min-w-0">
                  <p className="text-sm sm:text-lg font-bold text-foreground truncate">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Boys vs Girls Pie */}
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm font-semibold text-foreground">Boys vs Girls</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                    <Cell fill={COLORS.boys} />
                    <Cell fill={COLORS.girls} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.boys }} />Boys ({boys})</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.girls }} />Girls ({girls})</span>
              </div>
            </CardContent>
          </Card>

          {/* Full vs Half Bursary Pie */}
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm font-semibold text-foreground">Bursary Types</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={bursaryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                    <Cell fill={COLORS.full} />
                    <Cell fill={COLORS.half} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.full }} />Full ({fullBursary})</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.half }} />Half ({halfBursary})</span>
              </div>
            </CardContent>
          </Card>

          {/* Spending Summary */}
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-sm font-semibold text-foreground">Spending Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-3 sm:px-6">
              <div>
                <p className="text-xs text-muted-foreground">Nyunga Covers (School Fees)</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{formatUGX(totalNyungaSpending)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recorded Expenses</p>
                <p className="text-lg sm:text-xl font-bold text-foreground">{formatUGX(totalExpenseSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Students Sponsored</p>
                <p className="text-lg sm:text-xl font-bold text-accent">{approved.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Yearly Bar Chart */}
        {yearData.length > 0 && (
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">Bursaries Granted by Year — Boys vs Girls</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={yearData} barGap={4}>
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="boys" name="Boys" fill={COLORS.boys} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="girls" name="Girls" fill={COLORS.girls} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <LocationStats applications={applications} />

        <BursaryManagementDashboard />
      </div>
    </div>
  );
};

export default AdminDashboard;
