import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Printer, Search, Receipt, Download } from "lucide-react";

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
}

const defaultReceiptConfig: ReceiptConfig = {
  orgName: "God's Will Scholarship Fund",
  orgAddress: "Kampala, Uganda",
  orgPhone: "+256 700 000000",
  orgEmail: "info@godswill.org",
  logoText: "GW",
  footerNote: "This receipt confirms the approval of the scholarship application. Keep this document for your records.",
  signatureName: "Administrator",
  signatureTitle: "Program Director",
};

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const AdminReceipts = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(defaultReceiptConfig);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [appsRes, schoolsRes, settingsRes] = await Promise.all([
        supabase.from("applications").select("*").eq("status", "approved").order("reviewed_at", { ascending: false }),
        supabase.from("schools").select("id, name"),
        supabase.from("app_settings").select("*").eq("key", "receipt_config").maybeSingle(),
      ]);
      setApplications((appsRes.data as unknown as Application[]) || []);
      setSchools((schoolsRes.data as unknown as SchoolRow[]) || []);
      if (settingsRes.data?.value) {
        setReceiptConfig({ ...defaultReceiptConfig, ...(settingsRes.data.value as any) });
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getSchoolName = (id: string | null) => schools.find((s) => s.id === id)?.name || "Unassigned";

  const generateReceiptNumber = (app: Application) => {
    const date = new Date(app.reviewed_at || app.created_at);
    return `GW-${date.getFullYear()}-${app.id.slice(0, 6).toUpperCase()}`;
  };

  const printReceipt = (appId: string) => {
    setPrintingId(appId);
    setTimeout(() => {
      const printContent = document.getElementById(`receipt-${appId}`);
      if (!printContent) return;

      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        toast.error("Please allow pop-ups to print receipts");
        setPrintingId(null);
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; }
              .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #1a1a2e; padding: 30px; }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; background: #1a1a2e; color: #fff; font-weight: bold; font-size: 18px; margin-bottom: 8px; }
              .org-name { font-size: 20px; font-weight: bold; margin: 4px 0; }
              .org-info { font-size: 11px; color: #666; }
              .title { text-align: center; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; font-weight: 600; margin: 16px 0; }
              .receipt-meta { text-align: center; font-size: 11px; color: #666; margin-bottom: 16px; }
              hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
              .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
              .row-label { color: #666; }
              .row-value { font-weight: 500; }
              .footer { font-size: 11px; color: #666; font-style: italic; margin-top: 16px; }
              .signature { text-align: right; margin-top: 30px; padding-top: 8px; border-top: 1px solid #333; display: inline-block; float: right; padding-left: 16px; padding-right: 16px; }
              .sig-name { font-size: 12px; font-weight: 500; }
              .sig-title { font-size: 10px; color: #666; }
              @media print { body { padding: 0; } .receipt { border: none; } }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      setPrintingId(null);
    }, 100);
  };

  const filtered = applications.filter(
    (a) => !search || a.student_name.toLowerCase().includes(search.toLowerCase()) || a.parent_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" /> Receipts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Print confirmation receipts for approved applications</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or parent..." className="pl-9" />
        </div>
        <Badge variant="outline" className="self-center">{filtered.length} approved</Badge>
      </div>

      <div className="space-y-3">
        {filtered.map((app) => (
          <Card key={app.id}>
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{app.student_name}</p>
                <p className="text-sm text-muted-foreground">
                  {levelLabels[app.education_level] || app.education_level} • {getSchoolName(app.school_id)} • Parent: {app.parent_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receipt: {generateReceiptNumber(app)} • Approved: {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <Button size="sm" className="gap-1" onClick={() => printReceipt(app.id)}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </CardContent>

            {/* Hidden receipt for printing */}
            <div className="hidden">
              <div id={`receipt-${app.id}`}>
                <div className="receipt">
                  <div className="header">
                    <div className="logo">{receiptConfig.logoText}</div>
                    <div className="org-name">{receiptConfig.orgName}</div>
                    <div className="org-info">{receiptConfig.orgAddress}</div>
                    <div className="org-info">{receiptConfig.orgPhone} • {receiptConfig.orgEmail}</div>
                  </div>
                  <hr />
                  <div className="title">Scholarship Approval Receipt</div>
                  <div className="receipt-meta">
                    Receipt No: {generateReceiptNumber(app)}<br />
                    Date: {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : new Date().toLocaleDateString()}
                  </div>
                  <hr />
                  <div className="row"><span className="row-label">Student Name:</span><span className="row-value">{app.student_name}</span></div>
                  <div className="row"><span className="row-label">Education Level:</span><span className="row-value">{levelLabels[app.education_level] || app.education_level}</span></div>
                  {app.class_grade && <div className="row"><span className="row-label">Class/Grade:</span><span className="row-value">{app.class_grade}</span></div>}
                  <div className="row"><span className="row-label">School:</span><span className="row-value">{getSchoolName(app.school_id)}</span></div>
                  {app.district && <div className="row"><span className="row-label">District:</span><span className="row-value">{app.district}</span></div>}
                  <hr />
                  <div className="row"><span className="row-label">Parent/Guardian:</span><span className="row-value">{app.parent_name}</span></div>
                  <div className="row"><span className="row-label">Phone:</span><span className="row-value">{app.parent_phone}</span></div>
                  <hr />
                  <div className="footer">{receiptConfig.footerNote}</div>
                  <div style={{ overflow: "hidden" }}>
                    <div className="signature">
                      <div className="sig-name">{receiptConfig.signatureName}</div>
                      <div className="sig-title">{receiptConfig.signatureTitle}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
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
