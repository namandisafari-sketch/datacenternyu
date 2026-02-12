import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Application {
  id: string;
  student_name: string;
  education_level: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
  school_id: string | null;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  term: string;
  created_at: string;
}

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  under_review: { icon: AlertCircle, color: "bg-blue-100 text-blue-800", label: "Under Review" },
  approved: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-800", label: "Rejected" },
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const ParentDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const appList = (apps as unknown as Application[]) || [];
      setApplications(appList);

      // Fetch expenses for approved apps
      const approvedIds = appList.filter((a) => a.status === "approved").map((a) => a.id);
      if (approvedIds.length > 0) {
        const { data: expData } = await supabase
          .from("expenses")
          .select("*")
          .in("application_id", approvedIds)
          .order("created_at", { ascending: false });

        const grouped: Record<string, Expense[]> = {};
        ((expData as unknown as (Expense & { application_id: string })[]) || []).forEach((exp) => {
          if (!grouped[exp.application_id]) grouped[exp.application_id] = [];
          grouped[exp.application_id].push(exp);
        });
        setExpenses(grouped);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="py-10 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">My Applications</h1>
            <p className="text-muted-foreground">Track the status of your scholarship applications</p>
          </div>
          <Link to="/register">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
              <PlusCircle size={18} /> New Application
            </Button>
          </Link>
        </div>

        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't submitted any applications yet.</p>
              <Link to="/register">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Apply Now</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const sc = statusConfig[app.status] || statusConfig.pending;
              const StatusIcon = sc.icon;
              const appExpenses = expenses[app.id] || [];
              const totalSpent = appExpenses.reduce((s, e) => s + e.amount, 0);

              return (
                <Card key={app.id}>
                  <CardContent className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{app.student_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {levelLabels[app.education_level] || app.education_level} • Applied {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${sc.color} gap-1`}>
                        <StatusIcon size={14} /> {sc.label}
                      </Badge>
                    </div>

                    {/* Status timeline */}
                    <div className="flex items-center gap-1 mb-3">
                      {["pending", "under_review", "approved"].map((s, i) => {
                        const reached = ["pending", "under_review", "approved"].indexOf(app.status) >= i;
                        const isRejected = app.status === "rejected";
                        return (
                          <div key={s} className="flex items-center gap-1 flex-1">
                            <div className={`h-2 flex-1 rounded-full ${reached && !isRejected ? "bg-accent" : isRejected && i === 0 ? "bg-destructive" : "bg-muted"}`} />
                          </div>
                        );
                      })}
                    </div>

                    {app.admin_notes && (
                      <div className="bg-muted/50 rounded-md p-3 mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes:</p>
                        <p className="text-sm text-foreground">{app.admin_notes}</p>
                      </div>
                    )}

                    {app.status === "approved" && appExpenses.length > 0 && (
                      <div className="border-t border-border pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">Expenses Recorded</p>
                          <p className="text-sm font-semibold text-secondary">Total: {formatUGX(totalSpent)}</p>
                        </div>
                        <div className="space-y-1">
                          {appExpenses.map((exp) => (
                            <div key={exp.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{exp.description} {exp.term && `(${exp.term})`}</span>
                              <span className="text-foreground">{formatUGX(exp.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

export default ParentDashboard;
