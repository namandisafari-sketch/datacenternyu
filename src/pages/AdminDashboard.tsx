import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Clock, DollarSign, PlusCircle, Search } from "lucide-react";

interface Application {
  id: string;
  user_id: string;
  parent_name: string;
  parent_phone: string;
  student_name: string;
  education_level: string;
  status: string;
  admin_notes: string | null;
  reason: string | null;
  district: string | null;
  created_at: string;
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

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expenseForm, setExpenseForm] = useState({ applicationId: "", description: "", amount: "", category: "tuition", term: "" });
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchData = async () => {
    const { data: apps } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    setApplications((apps as unknown as Application[]) || []);

    const { data: exps } = await supabase.from("expenses").select("*").order("created_at", { ascending: false });
    setExpenses((exps as unknown as Expense[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user && isAdmin) fetchData();
  }, [user, isAdmin]);

  const updateStatus = async (appId: string, status: string) => {
    const notes = reviewNotes[appId] || "";
    const { error } = await supabase
      .from("applications")
      .update({ status, admin_notes: notes, reviewed_at: new Date().toISOString(), reviewed_by: user!.id } as any)
      .eq("id", appId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Application ${status}`);
      fetchData();
    }
  };

  const addExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.applicationId) {
      toast.error("Fill in all fields");
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      application_id: expenseForm.applicationId,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      term: expenseForm.term,
      recorded_by: user!.id,
    } as any);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Expense recorded");
      setExpenseForm({ applicationId: "", description: "", amount: "", category: "tuition", term: "" });
      setExpenseDialogOpen(false);
      fetchData();
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const filtered = applications.filter((a) => {
    const matchesFilter = filter === "all" || a.status === filter;
    const matchesSearch = !search || a.student_name.toLowerCase().includes(search.toLowerCase()) || a.parent_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    totalSpent: expenses.reduce((s, e) => s + e.amount, 0),
  };

  const approvedApps = applications.filter((a) => a.status === "approved");

  return (
    <div className="py-10 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="font-display text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Applications", value: counts.total, icon: Users, color: "text-primary" },
            { label: "Pending Review", value: counts.pending, icon: Clock, color: "text-yellow-600" },
            { label: "Approved", value: counts.approved, icon: CheckCircle, color: "text-accent" },
            { label: "Total Spent", value: formatUGX(counts.totalSpent), icon: DollarSign, color: "text-secondary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-5 flex items-center gap-4">
                <s.icon size={32} className={s.color} />
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or parent..." className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
                <PlusCircle size={18} /> Record Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Record Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Student (Approved)</Label>
                  <Select value={expenseForm.applicationId} onValueChange={(v) => setExpenseForm((p) => ({ ...p, applicationId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                    <SelectContent>
                      {approvedApps.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.student_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} placeholder="e.g. Tuition Term 1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Amount (UGX)</Label>
                    <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Input value={expenseForm.term} onChange={(e) => setExpenseForm((p) => ({ ...p, term: e.target.value }))} placeholder="Term 1 2025" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tuition">Tuition</SelectItem>
                      <SelectItem value="materials">Scholastic Materials</SelectItem>
                      <SelectItem value="uniform">Uniform</SelectItem>
                      <SelectItem value="boarding">Boarding</SelectItem>
                      <SelectItem value="examination">Examination Fees</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addExpense} className="w-full bg-primary text-primary-foreground">Save Expense</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Applications list */}
        <div className="space-y-4">
          {filtered.map((app) => {
            const appExpenses = expenses.filter((e) => e.application_id === app.id);
            const totalSpent = appExpenses.reduce((s, e) => s + e.amount, 0);

            return (
              <Card key={app.id}>
                <CardContent className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{app.student_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Parent: {app.parent_name} • {app.parent_phone} • {levelLabels[app.education_level] || app.education_level}
                        {app.district && ` • ${app.district}`}
                      </p>
                      <p className="text-xs text-muted-foreground">Applied: {new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline">{app.status}</Badge>
                  </div>

                  {app.reason && (
                    <p className="text-sm text-muted-foreground mb-3 bg-muted/50 p-3 rounded-md">{app.reason}</p>
                  )}

                  {/* Admin actions */}
                  {(app.status === "pending" || app.status === "under_review") && (
                    <div className="border-t border-border pt-3 mt-3 space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Admin Notes</Label>
                        <Textarea
                          rows={2}
                          value={reviewNotes[app.id] || ""}
                          onChange={(e) => setReviewNotes((p) => ({ ...p, [app.id]: e.target.value }))}
                          placeholder="Add notes about this application..."
                        />
                      </div>
                      <div className="flex gap-2">
                        {app.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, "under_review")}>
                            Mark Under Review
                          </Button>
                        )}
                        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1" onClick={() => updateStatus(app.id, "approved")}>
                          <CheckCircle size={14} /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => updateStatus(app.id, "rejected")}>
                          <XCircle size={14} /> Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Expenses for approved */}
                  {app.status === "approved" && appExpenses.length > 0 && (
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium">Expenses</p>
                        <p className="text-sm font-semibold text-secondary">Total: {formatUGX(totalSpent)}</p>
                      </div>
                      {appExpenses.map((exp) => (
                        <div key={exp.id} className="flex justify-between text-sm py-1">
                          <span className="text-muted-foreground">{exp.description} {exp.term && `(${exp.term})`}</span>
                          <span>{formatUGX(exp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No applications found.</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
