import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Banknote, TrendingUp, Users, PieChart, ArrowUpRight, ArrowDownRight, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
} from "recharts";

interface Payment {
  id: string;
  application_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  description: string;
  created_at: string;
  applications?: { student_name: string; parent_name: string; education_level: string };
}

const FEE_TYPES: Record<string, string> = {
  application_fee: "Application Fee",
  registration_fee: "Registration Fee",
  lawyer_fee: "Lawyer Fee",
  other: "Other",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
];

const AdminPaymentsDashboard = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("parent_payments")
        .select("*, applications(student_name, parent_name, education_level)")
        .order("payment_date", { ascending: false });
      setPayments((data as unknown as Payment[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  // Filter by period
  const filtered = payments.filter((p) => {
    if (period === "all") return true;
    const d = new Date(p.payment_date);
    const now = new Date();
    if (period === "today") return d.toDateString() === now.toDateString();
    if (period === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (period === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalAmount = filtered.reduce((s, p) => s + Number(p.amount), 0);
  const uniqueStudents = new Set(filtered.map((p) => p.application_id)).size;
  const avgPerStudent = uniqueStudents > 0 ? Math.round(totalAmount / uniqueStudents) : 0;

  // Fee type breakdown for pie chart
  const feeBreakdown = Object.entries(
    filtered.reduce<Record<string, number>>((acc, p) => {
      const key = p.description || "other";
      acc[key] = (acc[key] || 0) + Number(p.amount);
      return acc;
    }, {})
  ).map(([key, value]) => ({
    name: FEE_TYPES[key] || key,
    value,
  }));

  // Payment method breakdown
  const methodBreakdown = Object.entries(
    filtered.reduce<Record<string, number>>((acc, p) => {
      const key = p.payment_method || "cash";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({
    name: METHOD_LABELS[key] || key,
    value,
  }));

  // Daily collections for bar chart (last 14 days)
  const dailyData = (() => {
    const days: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().split("T")[0]] = 0;
    }
    filtered.forEach((p) => {
      const key = p.payment_date?.split("T")[0];
      if (key && key in days) {
        days[key] += Number(p.amount);
      }
    });
    return Object.entries(days).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      amount,
    }));
  })();

  // Recent 5 payments
  const recent = filtered.slice(0, 5);

  if (loading)
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <PieChart className="h-6 w-6 text-primary" /> Payments Analytics
        </h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-lg font-bold text-foreground">UGX {totalAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Students Paid</p>
              <p className="text-lg font-bold text-foreground">{uniqueStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg per Student</p>
              <p className="text-lg font-bold text-foreground">UGX {avgPerStudent.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="text-lg font-bold text-foreground">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Collections Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Daily Collections (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`UGX ${value.toLocaleString()}`, "Amount"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Type Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">By Fee Type</CardTitle>
          </CardHeader>
          <CardContent>
            {feeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <RechartsPie>
                  <Pie
                    data={feeBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {feeBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `UGX ${value.toLocaleString()}`} />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {methodBreakdown.length > 0 ? methodBreakdown.map((m, i) => (
              <div key={m.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-foreground">{m.name}</span>
                </div>
                <Badge variant="secondary">{m.value} transactions</Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length > 0 ? recent.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.applications?.student_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{FEE_TYPES[p.description] || p.description} • {new Date(p.payment_date).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold text-foreground ml-3">UGX {Number(p.amount).toLocaleString()}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No payments recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPaymentsDashboard;
