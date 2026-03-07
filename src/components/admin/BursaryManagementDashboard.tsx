import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { School, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SchoolSlot {
  id: string;
  name: string;
  level: string;
  total_bursaries: number;
  approved_count: number;
  available_slots: number;
}

const LEVEL_LABELS: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const BursaryManagementDashboard = () => {
  const [schools, setSchools] = useState<SchoolSlot[]>([]);
  const [allSchools, setAllSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [availRes, allRes] = await Promise.all([
        supabase.rpc("get_schools_with_availability"),
        supabase.from("schools").select("id, name, level, total_bursaries, nyunga_covered_fees, is_active"),
      ]);
      const allSchoolsList = allRes.data || [];
      setAllSchools(allSchoolsList);
      const availMap = new Map<string, SchoolSlot>();
      (availRes.data || []).forEach((s: any) => {
        availMap.set(s.id, { id: s.id, name: s.name, level: s.level, total_bursaries: s.total_bursaries, approved_count: Number(s.approved_count), available_slots: Number(s.available_slots) });
      });
      const { data: appsData } = await supabase.from("applications").select("school_id").eq("status", "approved");
      const countBySchool: Record<string, number> = {};
      (appsData || []).forEach((a) => { if (a.school_id) countBySchool[a.school_id] = (countBySchool[a.school_id] || 0) + 1; });
      const fullList: SchoolSlot[] = allSchoolsList
        .filter((s: any) => s.total_bursaries > 0 && s.is_active)
        .map((s: any) => {
          if (availMap.has(s.id)) return availMap.get(s.id)!;
          const used = countBySchool[s.id] || 0;
          return { id: s.id, name: s.name, level: s.level, total_bursaries: s.total_bursaries, approved_count: used, available_slots: Math.max(0, s.total_bursaries - used) };
        })
        .sort((a: SchoolSlot, b: SchoolSlot) => b.total_bursaries - a.total_bursaries);
      setSchools(fullList);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return null;

  const totalSlots = schools.reduce((s, x) => s + x.total_bursaries, 0);
  const totalUsed = schools.reduce((s, x) => s + x.approved_count, 0);
  const totalAvailable = schools.reduce((s, x) => s + x.available_slots, 0);
  const overallUtilization = totalSlots > 0 ? Math.round((totalUsed / totalSlots) * 100) : 0;
  const fullyUtilized = schools.filter((s) => s.available_slots === 0).length;

  const totalCommitment = allSchools.filter((s) => s.is_active).reduce((sum, s) => {
    const used = schools.find((x) => x.id === s.id)?.approved_count || 0;
    return sum + used * (s.nyunga_covered_fees || 0);
  }, 0);

  const pieData = [
    { name: "Used", value: totalUsed },
    { name: "Available", value: totalAvailable },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
        <School className="h-5 w-5 text-primary" /> Bursary Slot Management
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="py-4 text-center"><p className="text-xl font-bold">{totalSlots}</p><p className="text-xs text-muted-foreground">Total Slots</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-xl font-bold text-primary">{totalUsed}</p><p className="text-xs text-muted-foreground">Used</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-xl font-bold text-accent">{totalAvailable}</p><p className="text-xs text-muted-foreground">Available</p></CardContent></Card>
        <Card><CardContent className="py-4 text-center"><p className="text-xl font-bold">{overallUtilization}%</p><p className="text-xs text-muted-foreground">Utilization</p></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Slot Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Key Metrics</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2"><TrendingUp size={16} className="text-primary" /><span className="text-sm">Utilization: <strong>{overallUtilization}%</strong></span></div>
            <div className="flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /><span className="text-sm">Fully Utilized Schools: <strong>{fullyUtilized}</strong></span></div>
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-accent" /><span className="text-sm">Total Commitment: <strong>{formatUGX(totalCommitment)}</strong></span></div>
          </CardContent>
        </Card>
      </div>

      {/* By Education Level */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">By Education Level</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(LEVEL_LABELS).map(([key, label]) => {
            const levelSchools = schools.filter((s) => s.level === key);
            if (levelSchools.length === 0) return null;
            const levelTotal = levelSchools.reduce((s, x) => s + x.total_bursaries, 0);
            const levelUsed = levelSchools.reduce((s, x) => s + x.approved_count, 0);
            const pct = levelTotal > 0 ? Math.round((levelUsed / levelTotal) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="w-20 truncate">{label}</span>
                <Progress value={pct} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-16 text-right">{levelUsed}/{levelTotal}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* School Cards Grid */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Detailed School Slots</h3>
        {schools.length === 0 ? (
          <Card><CardContent className="py-6 text-center text-muted-foreground">No bursary allocations</CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => {
              const pct = school.total_bursaries > 0 ? Math.round((school.approved_count / school.total_bursaries) * 100) : 0;
              return (
                <Card key={school.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{school.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">{LEVEL_LABELS[school.level] || school.level}</Badge>
                      </div>
                      {school.available_slots === 0 ? (
                        <Badge variant="destructive" className="text-xs">Full</Badge>
                      ) : pct >= 75 ? (
                        <Badge className="text-xs bg-amber-500">Filling</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-accent">Open</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div><p className="font-bold">{school.total_bursaries}</p><p className="text-muted-foreground">Allocated</p></div>
                      <div><p className="font-bold text-primary">{school.approved_count}</p><p className="text-muted-foreground">Used</p></div>
                      <div><p className="font-bold text-accent">{school.available_slots}</p><p className="text-muted-foreground">Available</p></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BursaryManagementDashboard;
