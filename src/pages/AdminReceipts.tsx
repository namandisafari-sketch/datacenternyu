import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Printer, Search, Receipt, CheckCircle, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createRoot } from "react-dom/client";

interface Application {
  id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  education_level: string;
  class_grade: string | null;
  school_id: string | null;
  district: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

interface PaymentCode {
  id: string;
  code: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  application_id: string | null;
}

interface SchoolRow {
  id: string;
  name: string;
}

interface ReceiptConfig {
  orgName: string;
  orgAddress: string;
  orgPhone: string;
  orgEmail: string;
  logoText: string;
  footerNote: string;
  signatureName: string;
  signatureTitle: string;
  applicationFormFee: number;
  lawyerFormFee: number;
}

const defaultReceiptConfig: ReceiptConfig = {
  orgName: "God's Will Scholarship Fund",
  orgAddress: "Kampala, Uganda",
  orgPhone: "+256 700 000000",
  orgEmail: "info@godswill.org",
  logoText: "GW",
  footerNote: "This receipt confirms payment for application and legal documentation fees. Keep for your records.",
  signatureName: "Administrator",
  signatureTitle: "Program Director",
  applicationFormFee: 50000,
  lawyerFormFee: 100000,
};

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const AdminReceipts = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [paymentCodes, setPaymentCodes] = useState<PaymentCode[]>([]);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(defaultReceiptConfig);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [appsRes, schoolsRes, settingsRes, codesRes] = await Promise.all([
        supabase.from("applications").select("*").eq("status", "approved").order("reviewed_at", { ascending: false }),
        supabase.from("schools").select("id, name"),
        supabase.from("app_settings").select("*").eq("key", "receipt_config").maybeSingle(),
        supabase.from("payment_codes").select("*").eq("is_used", true),
      ]);
      setApplications((appsRes.data as unknown as Application[]) || []);
      setSchools((schoolsRes.data as unknown as SchoolRow[]) || []);
      setPaymentCodes((codesRes.data as unknown as PaymentCode[]) || []);
      if (settingsRes.data?.value) {
        setReceiptConfig({ ...defaultReceiptConfig, ...(settingsRes.data.value as any) });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getSchoolName = (id: string | null) => schools.find((s) => s.id === id)?.name || "Unassigned";
  const getPaymentCode = (appId: string) => paymentCodes.find((c) => c.application_id === appId);

  const generateReceiptNumber = (app: Application) => {
    const date = new Date(app.reviewed_at || app.created_at);
    return `GW-${date.getFullYear()}-${app.id.slice(0, 6).toUpperCase()}`;
  };

  const totalFees = receiptConfig.applicationFormFee + receiptConfig.lawyerFormFee;

  const printReceipt = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const receiptNo = generateReceiptNumber(app);
    const payment = getPaymentCode(appId);
    const qrData = JSON.stringify({
      receipt: receiptNo,
      student: app.student_name,
      parent: app.parent_name,
      appId: app.id,
    });

    const printWindow = window.open("", "_blank", "width=350,height=600");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print receipts");
      return;
    }

    const receiptDate = app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receiptNo}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; width: 80mm; padding: 5mm 4mm; color: #1a1a2e; font-size: 10px; line-height: 1.5; background: #fff; }
            .header { text-align: center; padding-bottom: 10px; border-bottom: 2px solid #1a1a2e; }
            .logo { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #1a1a2e; color: #d4a843; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; border-radius: 8px; margin-bottom: 6px; letter-spacing: 1px; }
            .org-name { font-size: 13px; font-weight: 700; color: #1a1a2e; letter-spacing: 0.5px; }
            .org-contact { font-size: 8px; color: #666; margin-top: 2px; }
            .receipt-title { text-align: center; margin: 10px 0 6px; }
            .receipt-title h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; }
            .receipt-meta { display: flex; justify-content: space-between; background: #f5f5f0; border-radius: 4px; padding: 5px 8px; margin-bottom: 10px; font-size: 9px; }
            .receipt-meta .label { color: #888; }
            .receipt-meta .value { font-family: 'JetBrains Mono', monospace; font-weight: 500; color: #1a1a2e; }
            .section { margin-bottom: 8px; }
            .section-title { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #eee; }
            .info-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px; }
            .info-row .label { color: #666; }
            .info-row .value { font-weight: 600; color: #1a1a2e; text-align: right; max-width: 55%; }
            .fees-table { width: 100%; border-collapse: collapse; margin: 6px 0; }
            .fees-table td { padding: 4px 0; font-size: 10px; }
            .fees-table td:last-child { text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
            .fees-table .item { color: #444; }
            .total-row td { padding-top: 6px; border-top: 2px solid #1a1a2e; font-size: 12px; font-weight: 700; color: #1a1a2e; }
            .status-badge { text-align: center; margin: 8px 0; }
            .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 14px; border-radius: 20px; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
            .badge-verified { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
            .badge-paid { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
            .payment-code { text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #1a1a2e; background: #f5f5f0; padding: 3px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; }
            .qr-section { text-align: center; margin: 10px 0 6px; padding: 8px 0; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; }
            .qr-section canvas, .qr-section svg { margin: 0 auto; }
            .qr-label { font-size: 7px; color: #999; margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
            .footer { text-align: center; margin-top: 8px; }
            .footer-note { font-size: 7px; color: #999; font-style: italic; line-height: 1.4; max-width: 90%; margin: 0 auto; }
            .signature { text-align: right; margin-top: 12px; padding-top: 6px; }
            .sig-line { width: 45%; margin-left: auto; border-top: 1px solid #1a1a2e; padding-top: 3px; }
            .sig-name { font-size: 9px; font-weight: 600; color: #1a1a2e; }
            .sig-title { font-size: 7px; color: #888; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 40px; font-weight: 800; color: rgba(26,26,46,0.03); letter-spacing: 4px; pointer-events: none; z-index: 0; }
          </style>
        </head>
        <body onload="setTimeout(()=>{window.print(); window.close();}, 200);">
          <div class="watermark">PAID</div>
          <div class="header">
            <div class="logo">${receiptConfig.logoText}</div>
            <div class="org-name">${receiptConfig.orgName}</div>
            <div class="org-contact">${receiptConfig.orgAddress} • ${receiptConfig.orgPhone}</div>
            <div class="org-contact">${receiptConfig.orgEmail}</div>
          </div>

          <div class="receipt-title"><h2>Payment Receipt</h2></div>

          <div class="receipt-meta">
            <div><span class="label">No:</span> <span class="value">${receiptNo}</span></div>
            <div><span class="label">Date:</span> <span class="value">${receiptDate}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Student Details</div>
            <div class="info-row"><span class="label">Name</span><span class="value">${app.student_name}</span></div>
            <div class="info-row"><span class="label">Level</span><span class="value">${levelLabels[app.education_level] || app.education_level}</span></div>
            ${app.class_grade ? `<div class="info-row"><span class="label">Class</span><span class="value">${app.class_grade}</span></div>` : ""}
            <div class="info-row"><span class="label">School</span><span class="value">${getSchoolName(app.school_id)}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Parent / Guardian</div>
            <div class="info-row"><span class="label">Name</span><span class="value">${app.parent_name}</span></div>
            <div class="info-row"><span class="label">Phone</span><span class="value">${app.parent_phone}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Payment Summary</div>
            <table class="fees-table">
              <tr><td class="item">Application Form Fee</td><td>${formatUGX(receiptConfig.applicationFormFee)}</td></tr>
              <tr><td class="item">Lawyer / Legal Form Fee</td><td>${formatUGX(receiptConfig.lawyerFormFee)}</td></tr>
              <tr class="total-row"><td>TOTAL PAID</td><td>${formatUGX(totalFees)}</td></tr>
            </table>
          </div>

          <div class="status-badge">
            <span class="badge ${payment ? 'badge-verified' : 'badge-paid'}">${payment ? '✓ PAYMENT VERIFIED' : '✓ PAID'}</span>
            ${payment ? `<div><span class="payment-code">${payment.code}</span></div>` : ""}
          </div>

          <div class="qr-section">
            <div id="qr-target"></div>
            <div class="qr-label">Scan to verify payment</div>
          </div>

          <div class="footer">
            <div class="footer-note">${receiptConfig.footerNote}</div>
          </div>

          <div class="signature">
            <div class="sig-line">
              <div class="sig-name">${receiptConfig.signatureName}</div>
              <div class="sig-title">${receiptConfig.signatureTitle}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Render QR code into the print window
    setTimeout(() => {
      const qrTarget = printWindow.document.getElementById("qr-target");
      if (qrTarget) {
        const qrContainer = printWindow.document.createElement("div");
        qrTarget.appendChild(qrContainer);
        const root = createRoot(qrContainer);
        root.render(
          <QRCodeSVG value={qrData} size={100} level="M" />
        );
      }
    }, 50);
  };

  const filtered = applications.filter(
    (a) => !search || a.student_name.toLowerCase().includes(search.toLowerCase()) || a.parent_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" /> Receipts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">80mm thermal receipts with payment verification & QR codes</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or parent..." className="pl-9" />
        </div>
        <Badge variant="outline" className="self-center">{filtered.length} approved</Badge>
        <div className="self-center text-sm text-muted-foreground">
          Fees: {formatUGX(receiptConfig.applicationFormFee)} + {formatUGX(receiptConfig.lawyerFormFee)} = <span className="font-semibold text-foreground">{formatUGX(totalFees)}</span>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((app) => {
          const payment = getPaymentCode(app.id);
          const hasPayment = !!payment;
          return (
            <Card key={app.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{app.student_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {levelLabels[app.education_level] || app.education_level} • {getSchoolName(app.school_id)} • Parent: {app.parent_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      Receipt: {generateReceiptNumber(app)}
                    </span>
                    {payment && (
                      <Badge variant="secondary" className="text-xs">Code: {payment.code}</Badge>
                    )}
                    <Badge className="text-xs bg-accent text-accent-foreground">{formatUGX(totalFees)}</Badge>
                    {hasPayment ? (
                      <Badge className="text-xs bg-green-600 text-white gap-1"><CheckCircle className="h-3 w-3" /> Payment Verified</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> No Payment Code</Badge>
                    )}
                  </div>
                </div>
                <Button size="sm" className="gap-1" onClick={() => printReceipt(app.id)}>
                  <Printer className="h-4 w-4" /> Print 80mm
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No approved applications found.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminReceipts;
