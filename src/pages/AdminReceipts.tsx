import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Printer, Search, Receipt, CheckCircle, AlertTriangle, Eye, PartyPopper, Save } from "lucide-react";
import ReceiptPreview from "@/components/admin/ReceiptPreview";

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
  const [seasonalRemark, setSeasonalRemark] = useState("");
  const [remarkDraft, setRemarkDraft] = useState("");
  const [previewAppId, setPreviewAppId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [appsRes, schoolsRes, settingsRes, codesRes, remarkRes] = await Promise.all([
        supabase.from("applications").select("*").eq("status", "approved").order("reviewed_at", { ascending: false }),
        supabase.from("schools").select("id, name"),
        supabase.from("app_settings").select("*").eq("key", "receipt_config").maybeSingle(),
        supabase.from("payment_codes").select("*").eq("is_used", true),
        supabase.from("app_settings").select("*").eq("key", "seasonal_remark").maybeSingle(),
      ]);
      setApplications((appsRes.data as unknown as Application[]) || []);
      setSchools((schoolsRes.data as unknown as SchoolRow[]) || []);
      setPaymentCodes((codesRes.data as unknown as PaymentCode[]) || []);
      if (settingsRes.data?.value) {
        setReceiptConfig({ ...defaultReceiptConfig, ...(settingsRes.data.value as any) });
      }
      const savedRemark = (remarkRes.data?.value as any)?.text || "";
      setSeasonalRemark(savedRemark);
      setRemarkDraft(savedRemark);
      setLoading(false);
    };
    fetchData();
  }, []);

  const saveSeasonalRemark = async () => {
    const { error } = await supabase.from("app_settings").upsert(
      { key: "seasonal_remark", value: { text: remarkDraft } as any, updated_by: user?.id || null },
      { onConflict: "key" }
    );
    if (error) {
      toast.error("Failed to save remark");
    } else {
      setSeasonalRemark(remarkDraft);
      toast.success("Seasonal remark saved!");
    }
  };

  const getSchoolName = (id: string | null) => schools.find((s) => s.id === id)?.name || "Unassigned";
  const getPaymentCode = (appId: string) => paymentCodes.find((c) => c.application_id === appId);

  const generateReceiptNumber = (app: Application) => {
    const date = new Date(app.reviewed_at || app.created_at);
    return `GW-${date.getFullYear()}-${app.id.slice(0, 6).toUpperCase()}`;
  };

  const totalFees = receiptConfig.applicationFormFee + receiptConfig.lawyerFormFee;

  const buildReceiptData = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return null;
    const payment = getPaymentCode(appId);
    const receiptNo = generateReceiptNumber(app);
    const receiptDate = app.reviewed_at
      ? new Date(app.reviewed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    return {
      receiptNo,
      date: receiptDate,
      studentName: app.student_name,
      level: levelLabels[app.education_level] || app.education_level,
      classGrade: app.class_grade,
      schoolName: getSchoolName(app.school_id),
      parentName: app.parent_name,
      parentPhone: app.parent_phone,
      paymentCode: payment?.code || null,
      isVerified: !!payment,
      applicationFormFee: receiptConfig.applicationFormFee,
      lawyerFormFee: receiptConfig.lawyerFormFee,
      totalFees,
      orgName: receiptConfig.orgName,
      orgAddress: receiptConfig.orgAddress,
      orgPhone: receiptConfig.orgPhone,
      orgEmail: receiptConfig.orgEmail,
      logoText: receiptConfig.logoText,
      footerNote: receiptConfig.footerNote,
      signatureName: receiptConfig.signatureName,
      signatureTitle: receiptConfig.signatureTitle,
      seasonalRemark,
      qrData: JSON.stringify({ receipt: receiptNo, student: app.student_name, parent: app.parent_name, appId: app.id }),
      appId: app.id,
    };
  };

  const filtered = applications.filter(
    (a) => !search || a.student_name.toLowerCase().includes(search.toLowerCase()) || a.parent_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" /> Receipts
        </h1>
        <p className="text-muted-foreground text-sm mt-1">80mm thermal receipts with payment verification, QR codes & stamps</p>
      </div>

      {/* Seasonal Remark Editor */}
      <Card>
        <CardContent className="py-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <PartyPopper className="h-4 w-4 text-secondary" />
            Seasonal Greeting on Receipts
          </div>
          <p className="text-xs text-muted-foreground">
            Add a seasonal message (e.g. "Merry Christmas & Happy New Year 2026!"). Leave blank to remove.
          </p>
          <div className="flex gap-2">
            <Input
              value={remarkDraft}
              onChange={(e) => setRemarkDraft(e.target.value)}
              placeholder="e.g. Merry Christmas & Happy New Year!"
              className="flex-1"
              maxLength={80}
            />
            <Button size="sm" onClick={saveSeasonalRemark} className="gap-1" disabled={remarkDraft === seasonalRemark}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
          {seasonalRemark && (
            <Badge variant="secondary" className="text-xs">Active: "{seasonalRemark}"</Badge>
          )}
        </CardContent>
      </Card>

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
                      <Badge className="text-xs bg-accent text-accent-foreground gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> No Code</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setPreviewAppId(app.id)}>
                    <Eye className="h-4 w-4" /> Preview
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => {
                    setPreviewAppId(app.id);
                  }}>
                    <Printer className="h-4 w-4" /> Print
                  </Button>
                </div>
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

      <ReceiptPreview
        open={!!previewAppId}
        onClose={() => setPreviewAppId(null)}
        data={previewAppId ? buildReceiptData(previewAppId) : null}
      />
    </div>
  );
};

export default AdminReceipts;
