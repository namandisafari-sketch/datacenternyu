import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, PlusCircle, Loader2, Banknote, TrendingUp, Users, Calendar, Eye, Printer, User } from "lucide-react";
import { toast } from "sonner";
import StudentQRScanner from "@/components/admin/StudentQRScanner";
import ReceiptPreview from "@/components/admin/ReceiptPreview";

interface Payment {
  id: string;
  application_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  description: string;
  created_at: string;
  payment_code_id: string | null;
  applications?: { student_name: string; parent_name: string; parent_phone: string; education_level: string; district: string | null; class_grade: string | null; school_id: string | null };
  payment_codes?: { code: string } | null;
}

const FEE_TYPES = [
  { value: "application_fee", label: "Application Fee" },
  { value: "registration_fee", label: "Registration Fee" },
  { value: "lawyer_fee", label: "Lawyer Fee" },
  { value: "other", label: "Other" },
];

const AdminPaymentHistory = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [previewPaymentId, setPreviewPaymentId] = useState<string | null>(null);
  const [seasonalRemark, setSeasonalRemark] = useState("");
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ application_id: "", amount: "", payment_method: "cash", payment_date: new Date().toISOString().split("T")[0], description: "application_fee" });

  const fetchPayments = async () => {
    const [paymentsRes, schoolsRes, remarkRes] = await Promise.all([
      supabase.from("parent_payments").select("*, applications(student_name, parent_name, parent_phone, education_level, district, class_grade, school_id), payment_codes(code)").order("payment_date", { ascending: false }),
      supabase.from("schools").select("id, name"),
      supabase.from("app_settings").select("*").eq("key", "seasonal_remark").maybeSingle(),
    ]);
    setPayments((paymentsRes.data as unknown as Payment[]) || []);
    setSchools((schoolsRes.data as unknown as { id: string; name: string }[]) || []);
    setSeasonalRemark((remarkRes.data?.value as any)?.text || "");
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleSave = async () => {
    if (!form.application_id || !form.amount) { toast.error("Select a student and enter amount"); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("parent_payments").insert({ application_id: form.application_id, amount: parseFloat(form.amount), payment_method: form.payment_method, payment_date: form.payment_date, description: form.description, recorded_by: userData.user?.id } as any);
    if (error) toast.error(error.message);
    else { toast.success("Payment recorded!"); setDialogOpen(false); setSelectedStudent(null); setForm({ application_id: "", amount: "", payment_method: "cash", payment_date: new Date().toISOString().split("T")[0], description: "application_fee" }); fetchPayments(); }
    setSaving(false);
  };

  const getFeeLabel = (value: string) => FEE_TYPES.find((f) => f.value === value)?.label || value;
  const levelLabels: Record<string, string> = { nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University" };
  const getSchoolName = (id: string | null) => schools.find((s) => s.id === id)?.name || "Unassigned";

  const buildReceiptData = (paymentId: string) => {
    const p = payments.find((pay) => pay.id === paymentId);
    if (!p) return null;
    const receiptNo = `PAY-${new Date(p.payment_date).getFullYear()}-${p.id.slice(0, 6).toUpperCase()}`;
    const receiptDate = new Date(p.payment_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return { receiptNo, date: receiptDate, studentName: p.applications?.student_name || "—", level: levelLabels[p.applications?.education_level || ""] || p.applications?.education_level || "—", classGrade: p.applications?.class_grade || null, schoolName: getSchoolName(p.applications?.school_id || null), parentName: p.applications?.parent_name || "—", parentPhone: p.applications?.parent_phone || "—", paymentCode: p.payment_codes?.code || null, isVerified: !!p.payment_codes, applicationFormFee: Number(p.amount), lawyerFormFee: 0, totalFees: Number(p.amount), orgName: "God's Will Scholarship Fund", orgAddress: "Kampala, Uganda", orgPhone: "+256 700 000000", orgEmail: "info@godswill.org", logoText: "GW", footerNote: "This receipt confirms payment. Keep for your records.", signatureName: "Administrator", signatureTitle: "Program Director", seasonalRemark, qrData: JSON.stringify({ receipt: receiptNo, student: p.applications?.student_name, amount: p.amount, appId: p.application_id }), appId: p.application_id };
  };

  const filtered = payments.filter((p) => {
    const matchesSearch = !search || p.applications?.student_name?.toLowerCase().includes(search.toLowerCase()) || p.applications?.parent_name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.description === filterType;
    return matchesSearch && matchesType;
  });

  const totalAmount = filtered.reduce((sum, p) => sum + Number(p.amount), 0);
  const uniqueParents = new Set(filtered.map((p) => p.application_id)).size;

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-3 sm:p-6 w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Registration Payments
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2" size="sm"><PlusCircle size={16} /> Record Payment</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Registration Payment</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <StudentQRScanner selectedStudent={selectedStudent} onStudentFound={(appId, student) => { setForm({ ...form, application_id: appId }); setSelectedStudent(student || null); }} />
              <div className="space-y-1">
                <Label>Fee Type</Label>
                <Select value={form.description} onValueChange={(v) => setForm({ ...form, description: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FEE_TYPES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Amount (UGX)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></div>
                <div className="space-y-1"><Label>Method</Label><Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="mobile_money">Mobile Money</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />} Save Payment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="py-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Total Collected</p><p className="text-sm sm:text-lg font-bold text-foreground">UGX {totalAmount.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="py-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Applicants Paid</p><p className="text-lg font-bold text-foreground">{uniqueParents}</p></div></CardContent></Card>
        <Card><CardContent className="py-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Calendar className="h-5 w-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Total Records</p><p className="text-lg font-bold text-foreground">{filtered.length}</p></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or parent..." className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Fee Type" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem>{FEE_TYPES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No registration payments recorded yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <User size={14} className="text-primary" /> {p.applications?.student_name || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.applications?.parent_name || "—"}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{getFeeLabel(p.description)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground">UGX {Number(p.amount).toLocaleString()}</p>
                  <Badge variant="outline" className="capitalize text-xs">{p.payment_method?.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setPreviewPaymentId(p.id)} title="Preview receipt"><Eye size={15} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setPreviewPaymentId(p.id)} title="Print receipt"><Printer size={15} /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReceiptPreview open={!!previewPaymentId} onClose={() => setPreviewPaymentId(null)} data={previewPaymentId ? buildReceiptData(previewPaymentId) : null} />
    </div>
  );
};

export default AdminPaymentHistory;
