import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Clock, DollarSign, AlertTriangle, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AdmissionSettings from "@/components/admin/AdmissionSettings";
import LocationStats from "@/components/admin/LocationStats";

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
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>

        <AdmissionSettings />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="py-5 flex items-center gap-3">
                <s.icon size={26} className={s.color} />
                <div>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Boys vs Girls Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Boys vs Girls</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill={COLORS.boys} />
                    <Cell fill={COLORS.girls} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: COLORS.boys }} />Boys ({boys})</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: COLORS.girls }} />Girls ({girls})</span>
              </div>
            </CardContent>
          </Card>

          {/* Full vs Half Bursary Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Bursary Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={bursaryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill={COLORS.full} />
                    <Cell fill={COLORS.half} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: COLORS.full }} />Full ({fullBursary})</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: COLORS.half }} />Half ({halfBursary})</span>
              </div>
            </CardContent>
          </Card>

          {/* Spending Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Spending Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Nyunga Covers (School Fees)</p>
                <p className="text-2xl font-bold text-primary">{formatUGX(totalNyungaSpending)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Recorded Expenses</p>
                <p className="text-xl font-bold text-foreground">{formatUGX(totalExpenseSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Students Sponsored</p>
                <p className="text-xl font-bold text-accent">{approved.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Yearly Bar Chart */}
        {yearData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Bursaries Granted by Year — Boys vs Girls</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={yearData} barGap={4}>
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="boys" name="Boys" fill={COLORS.boys} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="girls" name="Girls" fill={COLORS.girls} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <LocationStats applications={applications} />

        {/* Bursary Tracking by School */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <School className="h-4 w-4" /> Bursary Allocation by School
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead className="text-center">Allocated</TableHead>
                    <TableHead className="text-center">Used</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead>Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.filter(s => s.total_bursaries > 0).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No bursary allocations set</TableCell>
                    </TableRow>
                  ) : (
                    schools
                      .filter(s => s.total_bursaries > 0)
                      .sort((a, b) => b.total_bursaries - a.total_bursaries)
                      .map((school) => {
                        const used = approved.filter(a => a.school_id === school.id).length;
                        const available = Math.max(0, school.total_bursaries - used);
                        const pct = school.total_bursaries > 0 ? Math.round((used / school.total_bursaries) * 100) : 0;
                        return (
                          <TableRow key={school.id}>
                            <TableCell className="font-medium">{school.name}</TableCell>
                            <TableCell className="text-center">{school.total_bursaries}</TableCell>
                            <TableCell className="text-center">{used}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={available === 0 ? "destructive" : "outline"}>{available}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={pct} className="h-2 w-20" />
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
