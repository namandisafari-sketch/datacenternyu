import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Receipt, Building2, Save, Ticket, CalendarDays, Plus, X } from "lucide-react";
import PaymentCodesSection from "@/components/admin/PaymentCodesSection";

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

const AdminSettings = () => {
  const { user } = useAuth();
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(defaultReceiptConfig);
  const [saving, setSaving] = useState(false);
  const [appointmentReqs, setAppointmentReqs] = useState<string[]>([]);
  const [newReq, setNewReq] = useState("");
  const [savingReqs, setSavingReqs] = useState(false);
  useEffect(() => {
    const fetchSettings = async () => {
      const [receiptRes, reqsRes] = await Promise.all([
        supabase.from("app_settings").select("*").eq("key", "receipt_config").maybeSingle(),
        supabase.from("app_settings").select("*").eq("key", "appointment_requirements").maybeSingle(),
      ]);
      if (receiptRes.data?.value) {
        setReceiptConfig({ ...defaultReceiptConfig, ...(receiptRes.data.value as any) });
      }
      if (reqsRes.data?.value) {
        setAppointmentReqs((reqsRes.data.value as any)?.items || []);
      }
    };
    fetchSettings();
  }, []);

  const saveReceiptConfig = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", "receipt_config")
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("app_settings")
        .update({ value: receiptConfig as any, updated_by: user!.id })
        .eq("key", "receipt_config"));
    } else {
      ({ error } = await supabase
        .from("app_settings")
        .insert({ key: "receipt_config", value: receiptConfig as any, updated_by: user!.id }));
    }

    setSaving(false);
    if (error) toast.error("Failed to save: " + error.message);
    else toast.success("Receipt settings saved");
  };

  const updateField = (field: keyof ReceiptConfig, value: string) => {
    setReceiptConfig((prev) => ({ ...prev, [field]: value }));
  };

  const updateNumberField = (field: keyof ReceiptConfig, value: string) => {
    setReceiptConfig((prev) => ({ ...prev, [field]: parseInt(value) || 0 }));
  };

  const formatUGX = (amount: number) =>
    new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

  const addRequirement = () => {
    if (!newReq.trim()) return;
    setAppointmentReqs((prev) => [...prev, newReq.trim()]);
    setNewReq("");
  };

  const removeRequirement = (index: number) => {
    setAppointmentReqs((prev) => prev.filter((_, i) => i !== index));
  };

  const saveAppointmentReqs = async () => {
    setSavingReqs(true);
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", "appointment_requirements")
      .maybeSingle();

    let error;
    const val = { items: appointmentReqs } as any;
    if (existing) {
      ({ error } = await supabase.from("app_settings").update({ value: val, updated_by: user!.id }).eq("key", "appointment_requirements"));
    } else {
      ({ error } = await supabase.from("app_settings").insert({ key: "appointment_requirements", value: val, updated_by: user!.id }));
    }
    setSavingReqs(false);
    if (error) toast.error("Failed to save");
    else toast.success("Appointment requirements saved");
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> System Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Configure system preferences and receipt layout</p>
      </div>

      <Tabs defaultValue="receipt" className="space-y-4">
        <TabsList>
          <TabsTrigger value="receipt" className="gap-1"><Receipt className="h-4 w-4" /> Receipt Layout</TabsTrigger>
          <TabsTrigger value="organization" className="gap-1"><Building2 className="h-4 w-4" /> Organization</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1"><Ticket className="h-4 w-4" /> Payments</TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1"><CalendarDays className="h-4 w-4" /> Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="receipt" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Config Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Receipt Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value={receiptConfig.orgName} onChange={(e) => updateField("orgName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={receiptConfig.orgAddress} onChange={(e) => updateField("orgAddress", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={receiptConfig.orgPhone} onChange={(e) => updateField("orgPhone", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={receiptConfig.orgEmail} onChange={(e) => updateField("orgEmail", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo Initials</Label>
                  <Input value={receiptConfig.logoText} onChange={(e) => updateField("logoText", e.target.value)} maxLength={4} />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Application Form Fee (UGX)</Label>
                    <Input type="number" value={receiptConfig.applicationFormFee} onChange={(e) => updateNumberField("applicationFormFee", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lawyer Form Fee (UGX)</Label>
                    <Input type="number" value={receiptConfig.lawyerFormFee} onChange={(e) => updateNumberField("lawyerFormFee", e.target.value)} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Footer Note</Label>
                  <Textarea rows={3} value={receiptConfig.footerNote} onChange={(e) => updateField("footerNote", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Signatory Name</Label>
                    <Input value={receiptConfig.signatureName} onChange={(e) => updateField("signatureName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Signatory Title</Label>
                    <Input value={receiptConfig.signatureTitle} onChange={(e) => updateField("signatureTitle", e.target.value)} />
                  </div>
                </div>
                <Button onClick={saveReceiptConfig} disabled={saving} className="w-full gap-2">
                  <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Receipt Settings"}
                </Button>
              </CardContent>
            </Card>

            {/* Receipt Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg p-6 bg-background text-sm space-y-4">
                  {/* Header */}
                  <div className="text-center space-y-1">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mx-auto">
                      {receiptConfig.logoText}
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">{receiptConfig.orgName}</h3>
                    <p className="text-xs text-muted-foreground">{receiptConfig.orgAddress}</p>
                    <p className="text-xs text-muted-foreground">{receiptConfig.orgPhone} • {receiptConfig.orgEmail}</p>
                  </div>

                  <Separator />

                  <div className="text-center">
                    <h4 className="font-semibold text-foreground uppercase tracking-wider text-xs">Scholarship Approval Receipt</h4>
                    <p className="text-xs text-muted-foreground mt-1">Receipt No: GW-2026-0001</p>
                    <p className="text-xs text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
                  </div>

                  <Separator />

                  {/* Sample Data */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Student:</span>
                      <span className="font-medium">John Doe</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-medium">Secondary O-Level</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">School:</span>
                      <span className="font-medium">Sample School</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parent/Guardian:</span>
                      <span className="font-medium">Jane Doe</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Application Form</span>
                      <span>{formatUGX(receiptConfig.applicationFormFee)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Lawyer/Legal Form</span>
                      <span>{formatUGX(receiptConfig.lawyerFormFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t border-border pt-1 mt-1">
                      <span>TOTAL PAID</span>
                      <span>{formatUGX(receiptConfig.applicationFormFee + receiptConfig.lawyerFormFee)}</span>
                    </div>
                  </div>

                  <Separator />
                  <p className="text-xs text-muted-foreground italic">{receiptConfig.footerNote}</p>

                  <div className="text-right pt-4">
                    <div className="border-t border-border inline-block pt-1 px-4">
                      <p className="font-medium text-xs">{receiptConfig.signatureName}</p>
                      <p className="text-[10px] text-muted-foreground">{receiptConfig.signatureTitle}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Organization details are configured in the Receipt Layout tab. Additional system settings will be available here in future updates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentCodesSection />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Requirements</CardTitle>
              <p className="text-sm text-muted-foreground">Set the default items visitors must bring. These are included in WhatsApp messages.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {appointmentReqs.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                    <span className="text-sm flex-1">{i + 1}. {item}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeRequirement(i)}>
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a requirement (e.g. National ID)"
                  value={newReq}
                  onChange={(e) => setNewReq(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                  maxLength={200}
                />
                <Button variant="outline" onClick={addRequirement} className="gap-1">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <Button onClick={saveAppointmentReqs} disabled={savingReqs} className="w-full gap-2">
                <Save className="h-4 w-4" /> {savingReqs ? "Saving..." : "Save Requirements"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
