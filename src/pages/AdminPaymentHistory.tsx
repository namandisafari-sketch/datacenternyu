import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search, PlusCircle, Loader2, Banknote, TrendingUp, Users, Calendar, Eye, Printer,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { createRoot } from "react-dom/client";
import StudentQRScanner from "@/components/admin/StudentQRScanner";

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
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);

  const [form, setForm] = useState({
    application_id: "",
    amount: "",
    payment_method: "cash",
    payment_date: new Date().toISOString().split("T")[0],
    description: "application_fee",
  });

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("parent_payments")
      .select("*, applications(student_name, parent_name, parent_phone, education_level, district, class_grade, school_id), payment_codes(code)")
      .order("payment_date", { ascending: false });
    setPayments((data as unknown as Payment[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSave = async () => {
    if (!form.application_id || !form.amount) {
      toast.error("Select a student and enter amount");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("parent_payments").insert({
      application_id: form.application_id,
      amount: parseFloat(form.amount),
      payment_method: form.payment_method,
      payment_date: form.payment_date,
      description: form.description,
      recorded_by: userData.user?.id,
    } as any);

    if (error) toast.error(error.message);
    else {
      toast.success("Payment recorded!");
      setDialogOpen(false);
      setSelectedStudent(null);
      setForm({
        application_id: "",
        amount: "",
        payment_method: "cash",
        payment_date: new Date().toISOString().split("T")[0],
        description: "application_fee",
      });
      fetchPayments();
    }
    setSaving(false);
  };

  const getFeeLabel = (value: string) =>
    FEE_TYPES.find((f) => f.value === value)?.label || value;

  const levelLabels: Record<string, string> = {
    nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
  };

  const formatUGX = (amount: number) =>
    new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

  const printReceipt = (payment: Payment) => {
    const receiptNo = `PAY-${new Date(payment.payment_date).getFullYear()}-${payment.id.slice(0, 6).toUpperCase()}`;
    const qrData = JSON.stringify({ receipt: receiptNo, student: payment.applications?.student_name, amount: payment.amount, appId: payment.application_id });
    const printWindow = window.open("", "_blank", "width=350,height=600");
    if (!printWindow) { toast.error("Allow pop-ups to print"); return; }
    printWindow.document.write(`<html><head><title>Receipt ${receiptNo}</title>
      <style>@page{size:80mm auto;margin:0}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;width:80mm;padding:4mm;color:#000;font-size:11px;line-height:1.4}.center{text-align:center}.bold{font-weight:bold}.logo{font-size:20px;font-weight:bold;letter-spacing:2px;margin-bottom:2px}.org-name{font-size:13px;font-weight:bold}.divider{border-top:1px dashed #000;margin:4px 0}.row{display:flex;justify-content:space-between;padding:1px 0}.row-label{color:#555}.row-value{font-weight:bold;text-align:right;max-width:55%}.total-row{display:flex;justify-content:space-between;padding:3px 0;font-weight:bold;font-size:13px;border-top:1px solid #000;margin-top:2px}.qr-container{text-align:center;margin:6px 0}.footer{font-size:8px;color:#555;text-align:center;margin-top:4px;font-style:italic}.payment-badge{display:inline-block;padding:2px 8px;background:#000;color:#fff;font-size:9px;font-weight:bold;letter-spacing:1px;margin-top:4px}</style>
      </head><body onload="window.print();window.close();">
      <div class="center"><div class="logo">GW</div><div class="org-name">God's Will Scholarship Fund</div><div style="font-size:9px;color:#333">Kampala, Uganda</div></div>
      <div class="divider"></div>
      <div class="center bold" style="font-size:12px;letter-spacing:1px;margin:4px 0">PAYMENT RECEIPT</div>
      <div class="center" style="font-size:10px;color:#555">No: ${receiptNo}<br/>Date: ${new Date(payment.payment_date).toLocaleDateString()}</div>
      <div class="divider"></div>
      <div class="row"><span class="row-label">Student:</span><span class="row-value">${payment.applications?.student_name || "—"}</span></div>
      <div class="row"><span class="row-label">Parent:</span><span class="row-value">${payment.applications?.parent_name || "—"}</span></div>
      <div class="row"><span class="row-label">Phone:</span><span class="row-value">${payment.applications?.parent_phone || "—"}</span></div>
      ${payment.applications?.education_level ? `<div class="row"><span class="row-label">Level:</span><span class="row-value">${levelLabels[payment.applications.education_level] || payment.applications.education_level}</span></div>` : ""}
      <div class="divider"></div>
      <div class="row"><span class="row-label">Fee Type:</span><span class="row-value">${getFeeLabel(payment.description)}</span></div>
      <div class="row"><span class="row-label">Method:</span><span class="row-value" style="text-transform:capitalize">${payment.payment_method?.replace("_", " ")}</span></div>
      ${payment.payment_codes?.code ? `<div class="row"><span class="row-label">Pay Code:</span><span class="row-value">${payment.payment_codes.code}</span></div>` : ""}
      <div class="total-row"><span>TOTAL PAID</span><span>UGX ${Number(payment.amount).toLocaleString()}</span></div>
      <div class="center"><span class="payment-badge">${payment.payment_codes ? "VERIFIED ✓" : "PAID ✓"}</span></div>
      <div class="divider"></div>
      <div class="qr-container" id="qr-target"></div>
      <div class="center" style="font-size:8px;color:#555">Scan to verify payment</div>
      <div class="divider"></div>
      <div class="footer">This receipt confirms payment. Keep for your records.</div>
      </body></html>`);
    printWindow.document.close();
    setTimeout(() => {
      const qrTarget = printWindow.document.getElementById("qr-target");
      if (qrTarget) {
        const qrContainer = printWindow.document.createElement("div");
        qrTarget.appendChild(qrContainer);
        const root = createRoot(qrContainer);
        root.render(<QRCodeSVG value={qrData} size={100} level="M" />);
      }
    }, 50);
  };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      !search ||
      p.applications?.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.applications?.parent_name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.description === filterType;
    return matchesSearch && matchesType;
  });

  const totalAmount = filtered.reduce((sum, p) => sum + Number(p.amount), 0);
  const uniqueParents = new Set(filtered.map((p) => p.application_id)).size;

  if (loading)
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Banknote className="h-6 w-6 text-primary" /> Registration Payments
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle size={16} /> Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Registration Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <StudentQRScanner
                selectedStudent={selectedStudent}
                onStudentFound={(appId, student) => {
                  setForm({ ...form, application_id: appId });
                  setSelectedStudent(student || null);
                }}
              />
              <div className="space-y-1">
                <Label>Fee Type</Label>
                <Select
                  value={form.description}
                  onValueChange={(v) => setForm({ ...form, description: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_TYPES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Amount (UGX)</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Method</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(v) => setForm({ ...form, payment_method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                Save Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
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
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Applicants Paid</p>
              <p className="text-lg font-bold text-foreground">{uniqueParents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Records</p>
              <p className="text-lg font-bold text-foreground">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or parent..."
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Fee Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {FEE_TYPES.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.applications?.student_name || "—"}
                  </TableCell>
                  <TableCell>{p.applications?.parent_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {getFeeLabel(p.description)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    UGX {Number(p.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {p.payment_method?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => setPreviewPayment(p)} title="View details">
                        <Eye size={15} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => printReceipt(p)} title="Print receipt">
                        <Printer size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No registration payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Detail Preview */}
      <Dialog open={!!previewPayment} onOpenChange={(open) => !open && setPreviewPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {previewPayment && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Student</p>
                  <p className="font-semibold text-foreground">{previewPayment.applications?.student_name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Parent</p>
                  <p className="font-semibold text-foreground">{previewPayment.applications?.parent_name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-semibold text-foreground">{previewPayment.applications?.parent_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Education Level</p>
                  <p className="font-semibold text-foreground">{levelLabels[previewPayment.applications?.education_level || ""] || previewPayment.applications?.education_level || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">District</p>
                  <p className="font-semibold text-foreground">{previewPayment.applications?.district || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Class/Grade</p>
                  <p className="font-semibold text-foreground">{previewPayment.applications?.class_grade || "—"}</p>
                </div>
              </div>
              <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Fee Type</p>
                  <Badge variant="secondary" className="text-xs mt-1">{getFeeLabel(previewPayment.description)}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount</p>
                  <p className="font-bold text-foreground text-lg">UGX {Number(previewPayment.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Payment Method</p>
                  <Badge variant="outline" className="capitalize text-xs mt-1">{previewPayment.payment_method?.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p className="font-semibold text-foreground">{new Date(previewPayment.payment_date).toLocaleDateString()}</p>
                </div>
                {previewPayment.payment_codes?.code && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Payment Code</p>
                    <Badge className="text-xs mt-1 bg-green-600 text-white">✓ Verified: {previewPayment.payment_codes.code}</Badge>
                  </div>
                )}
              </div>
              <div className="border-t pt-3">
                <p className="text-muted-foreground text-xs mb-1">Receipt No</p>
                <p className="font-mono text-sm text-foreground">PAY-{new Date(previewPayment.payment_date).getFullYear()}-{previewPayment.id.slice(0, 6).toUpperCase()}</p>
              </div>
              <Button onClick={() => printReceipt(previewPayment)} className="w-full gap-2">
                <Printer size={16} /> Print 80mm Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentHistory;
