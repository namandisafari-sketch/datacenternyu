import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Printer, Search, Receipt } from "lucide-react";
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

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receiptNo}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; width: 80mm; padding: 4mm; color: #000; font-size: 11px; line-height: 1.4; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .logo { font-size: 20px; font-weight: bold; letter-spacing: 2px; margin-bottom: 2px; }
            .org-name { font-size: 13px; font-weight: bold; margin-bottom: 1px; }
            .org-info { font-size: 9px; color: #333; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 4px 0; }
            .row { display: flex; justify-content: space-between; padding: 1px 0; }
            .row-label { color: #555; }
            .row-value { font-weight: bold; text-align: right; max-width: 55%; }
            .fee-row { display: flex; justify-content: space-between; padding: 2px 0; }
            .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-weight: bold; font-size: 13px; border-top: 1px solid #000; margin-top: 2px; }
            .qr-container { text-align: center; margin: 6px 0; }
            .qr-container canvas, .qr-container svg { margin: 0 auto; }
            .footer { font-size: 8px; color: #555; text-align: center; margin-top: 4px; font-style: italic; }
            .sig { text-align: right; margin-top: 8px; padding-top: 4px; border-top: 1px solid #000; display: inline-block; float: right; }
            .sig-name { font-size: 10px; font-weight: bold; }
            .sig-title { font-size: 8px; color: #555; }
            .payment-badge { display: inline-block; padding: 2px 8px; background: #000; color: #fff; font-size: 9px; font-weight: bold; letter-spacing: 1px; margin-top: 4px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="center">
            <div class="logo">${receiptConfig.logoText}</div>
            <div class="org-name">${receiptConfig.orgName}</div>
            <div class="org-info">${receiptConfig.orgAddress}</div>
            <div class="org-info">${receiptConfig.orgPhone} | ${receiptConfig.orgEmail}</div>
          </div>
          <div class="divider"></div>
          <div class="center title">Payment Receipt</div>
          <div class="center" style="font-size:10px;color:#555;">
            No: ${receiptNo}<br/>
            Date: ${app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : new Date().toLocaleDateString()}
          </div>
          <div class="divider"></div>
          <div class="row"><span class="row-label">Student:</span><span class="row-value">${app.student_name}</span></div>
          <div class="row"><span class="row-label">Level:</span><span class="row-value">${levelLabels[app.education_level] || app.education_level}</span></div>
          ${app.class_grade ? `<div class="row"><span class="row-label">Class:</span><span class="row-value">${app.class_grade}</span></div>` : ""}
          <div class="row"><span class="row-label">School:</span><span class="row-value">${getSchoolName(app.school_id)}</span></div>
          <div class="divider"></div>
          <div class="row"><span class="row-label">Parent:</span><span class="row-value">${app.parent_name}</span></div>
          <div class="row"><span class="row-label">Phone:</span><span class="row-value">${app.parent_phone}</span></div>
          ${payment ? `<div class="row"><span class="row-label">Pay Code:</span><span class="row-value">${payment.code}</span></div>` : ""}
          <div class="divider"></div>
          <div class="center bold" style="font-size:10px;margin:3px 0;">FEES BREAKDOWN</div>
          <div class="fee-row"><span>Application Form</span><span>${formatUGX(receiptConfig.applicationFormFee)}</span></div>
          <div class="fee-row"><span>Lawyer/Legal Form</span><span>${formatUGX(receiptConfig.lawyerFormFee)}</span></div>
          <div class="total-row"><span>TOTAL PAID</span><span>${formatUGX(totalFees)}</span></div>
          <div class="center"><span class="payment-badge">PAID ✓</span></div>
          <div class="divider"></div>
          <div class="qr-container" id="qr-target"></div>
          <div class="center" style="font-size:8px;color:#555;">Scan to look up documents</div>
          <div class="divider"></div>
          <div class="footer">${receiptConfig.footerNote}</div>
          <div style="overflow:hidden;">
            <div class="sig">
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
          return (
            <Card key={app.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{app.student_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {levelLabels[app.education_level] || app.education_level} • {getSchoolName(app.school_id)} • Parent: {app.parent_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      Receipt: {generateReceiptNumber(app)}
                    </span>
                    {payment && (
                      <Badge variant="secondary" className="text-xs">Code: {payment.code}</Badge>
                    )}
                    <Badge className="text-xs bg-accent text-accent-foreground">{formatUGX(totalFees)}</Badge>
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
