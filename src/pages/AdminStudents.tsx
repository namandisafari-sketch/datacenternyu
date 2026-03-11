import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap } from "lucide-react";
import StudentManagement from "@/components/admin/StudentManagement";
import { FullApplication } from "@/components/admin/ApplicationFullDetail";

type Application = FullApplication;

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

interface ScannedDocument {
  id: string;
  application_id: string | null;
  application_number: string;
  original_filename: string;
  storage_path: string;
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
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>([]);
  const [lawyerSubmissions, setLawyerSubmissions] = useState<any[]>([]);
  const [lawyerTemplates, setLawyerTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [appsRes, expsRes, schoolsRes, claimsRes, reportsRes, scannedRes, subsRes, tplRes] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("schools").select("*"),
      supabase.from("student_claims").select("*").order("created_at", { ascending: false }),
      supabase.from("report_cards").select("*").order("created_at", { ascending: false }),
      supabase.from("scanned_documents").select("id, application_id, application_number, original_filename, storage_path, created_at"),
      supabase.from("lawyer_form_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("lawyer_form_templates").select("*"),
    ]);
    setApplications((appsRes.data as unknown as Application[]) || []);
    setExpenses((expsRes.data as unknown as Expense[]) || []);
    setSchools((schoolsRes.data as unknown as SchoolRow[]) || []);
    setClaims((claimsRes.data as unknown as Claim[]) || []);
    setReportCards((reportsRes.data as unknown as ReportCard[]) || []);
    setScannedDocuments((scannedRes.data as unknown as ScannedDocument[]) || []);
    setLawyerSubmissions((subsRes.data as any[]) || []);
    setLawyerTemplates((tplRes.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" /> Students
      </h1>
      <StudentManagement
        applications={applications}
        schools={schools}
        expenses={expenses}
        claims={claims}
        reportCards={reportCards}
        scannedDocuments={scannedDocuments}
        lawyerSubmissions={lawyerSubmissions}
        lawyerTemplates={lawyerTemplates}
        userId={user!.id}
        formatUGX={formatUGX}
        onRefresh={fetchData}
      />
    </div>
  );
};

export default AdminStudents;
