import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap } from "lucide-react";
import StudentManagement from "@/components/admin/StudentManagement";

interface Application {
  id: string;
  user_id: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  relationship: string | null;
  student_name: string;
  education_level: string;
  class_grade: string | null;
  date_of_birth: string | null;
  gender: string | null;
  current_school: string | null;
  district: string | null;
  reason: string | null;
  school_id: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  passport_photo_url: string | null;
  registration_number: string | null;
}

interface SchoolRow {
  id: string;
  name: string;
  level: string;
  district: string;
  requirements: string | null;
  full_fees: number;
  nyunga_covered_fees: number;
  parent_pays: number | null;
  boarding_available: boolean | null;
}

interface Expense {
  id: string;
  application_id: string;
  description: string;
  amount: number;
  category: string;
  term: string;
  created_at: string;
}

interface Claim {
  id: string;
  application_id: string;
  school_id: string | null;
  claim_type: string;
  description: string;
  action_taken: string | null;
  status: string;
  created_at: string;
}

interface ReportCard {
  id: string;
  application_id: string;
  term: string;
  year: string;
  file_url: string;
  notes: string | null;
  created_at: string;
}

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const AdminStudents = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [appsRes, expsRes, schoolsRes, claimsRes, reportsRes] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("schools").select("*"),
      supabase.from("student_claims").select("*").order("created_at", { ascending: false }),
      supabase.from("report_cards").select("*").order("created_at", { ascending: false }),
    ]);
    setApplications((appsRes.data as unknown as Application[]) || []);
    setExpenses((expsRes.data as unknown as Expense[]) || []);
    setSchools((schoolsRes.data as unknown as SchoolRow[]) || []);
    setClaims((claimsRes.data as unknown as Claim[]) || []);
    setReportCards((reportsRes.data as unknown as ReportCard[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" /> Students
      </h1>
      <StudentManagement
        applications={applications}
        schools={schools}
        expenses={expenses}
        claims={claims}
        reportCards={reportCards}
        userId={user!.id}
        formatUGX={formatUGX}
        onRefresh={fetchData}
      />
    </div>
  );
};

export default AdminStudents;
