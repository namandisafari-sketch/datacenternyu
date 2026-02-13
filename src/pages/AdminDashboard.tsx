import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Clock, DollarSign } from "lucide-react";
import AdminStats from "@/components/admin/AdminStats";
import LocationStats from "@/components/admin/LocationStats";
import AdmissionSettings from "@/components/admin/AdmissionSettings";

interface Application {
  id: string;
  user_id: string;
  parent_name: string;
  parent_phone: string;
  student_name: string;
  education_level: string;
  district: string | null;
  sub_county: string | null;
  parish: string | null;
  village: string | null;
  status: string;
  created_at: string;
}

interface Expense {
  id: string;
  amount: number;
}

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/auth");
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const [appsRes, expsRes, claimsRes] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("id, amount"),
        supabase.from("student_claims").select("id, status"),
      ]);
      setApplications((appsRes.data as unknown as Application[]) || []);
      setExpenses((expsRes.data as unknown as Expense[]) || []);
      setClaims(claimsRes.data || []);
      setLoading(false);
    };
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  if (authLoading || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    totalSpent: expenses.reduce((s, e) => s + e.amount, 0),
    openClaims: claims.filter((c: any) => c.status === "open").length,
  };

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Dashboard</h1>
        <AdmissionSettings />
        <AdminStats {...counts} formatUGX={formatUGX} />
        <LocationStats applications={applications} />
      </div>
    </div>
  );
};

export default AdminDashboard;
