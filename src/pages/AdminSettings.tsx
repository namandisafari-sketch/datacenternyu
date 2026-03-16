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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Receipt, Building2, Save, Ticket, CalendarDays, Plus, X, Upload, Loader2, ImageIcon, Globe, ShieldCheck, ShieldOff, MapPin, Trash2 } from "lucide-react";
import PaymentCodesSection from "@/components/admin/PaymentCodesSection";
import AdmissionSettings from "@/components/admin/AdmissionSettings";

interface ReceiptConfig {
  orgName: string;
  orgAddress: string;
  orgPhone: string;
  orgEmail: string;
  logoText: string;
  logoUrl: string;
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
  logoUrl: "",
  footerNote: "This receipt confirms payment for application and legal documentation fees. Keep for your records.",
  signatureName: "Administrator",
  signatureTitle: "Program Director",
  applicationFormFee: 50000,
  lawyerFormFee: 200000,
};

// ── Site Address Setting ──
const SiteAddressSettings = ({ userId }: { userId?: string }) => {
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "site_address").maybeSingle().then(({ data }) => {
      if (data?.value) setAddress((data.value as any).address || "");
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const val = { address } as any;
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "site_address").maybeSingle();
    const op = existing
      ? supabase.from("app_settings").update({ value: val, updated_by: userId }).eq("key", "site_address")
      : supabase.from("app_settings").insert({ key: "site_address", value: val, updated_by: userId });
    const { error } = await op;
    setSaving(false);
    if (error) toast.error("Failed to save"); else toast.success("Site address saved");
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Site Address</CardTitle>
        <p className="text-sm text-muted-foreground">This address is displayed on the portal and printed documents.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Physical Address</Label>
          <Textarea rows={2} placeholder="e.g. Plot 12, Bombo Road, Kampala, Uganda" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Address"}
        </Button>
      </CardContent>
    </Card>
  );
};

// ── Office Location(s) for GPS Attendance ──
interface OfficeLocation {
  name: string;
  lat: string;
  lng: string;
  radius_meters: string;
}

const OfficeLocationSettings = ({ userId }: { userId?: string }) => {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "office_location").maybeSingle().then(({ data }) => {
      if (data?.value) {
        const val = data.value as any;
        // Support legacy single-location format
        if (val.lat !== undefined) {
          setLocations([{ name: val.name || "Main Office", lat: String(val.lat), lng: String(val.lng), radius_meters: String(val.radius_meters || 100) }]);
        } else if (Array.isArray(val.locations)) {
          setLocations(val.locations.map((l: any) => ({ name: l.name || "", lat: String(l.lat), lng: String(l.lng), radius_meters: String(l.radius_meters || 100) })));
        }
      }
      if (locations.length === 0 && !data?.value) {
        setLocations([{ name: "Main Office", lat: "", lng: "", radius_meters: "100" }]);
      }
      setLoaded(true);
    });
  }, []);

  const addLocation = () => {
    setLocations((prev) => [...prev, { name: "", lat: "", lng: "", radius_meters: "100" }]);
  };

  const removeLocation = (i: number) => {
    setLocations((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateLoc = (i: number, field: keyof OfficeLocation, value: string) => {
    setLocations((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const useMyLocation = (i: number) => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    toast.info("Getting your current location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLoc(i, "lat", pos.coords.latitude.toFixed(6));
        updateLoc(i, "lng", pos.coords.longitude.toFixed(6));
        toast.success("Location captured!");
      },
      () => toast.error("Failed to get location"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const save = async () => {
    const parsed = locations.map((l) => ({
      name: l.name || "Office",
      lat: parseFloat(l.lat),
      lng: parseFloat(l.lng),
      radius_meters: parseInt(l.radius_meters) || 100,
    }));
    if (parsed.some((l) => isNaN(l.lat) || isNaN(l.lng))) {
      toast.error("Please enter valid coordinates for all locations"); return;
    }
    setSaving(true);
    // Save both legacy single format (first location) and multi-location array
    const val = { ...parsed[0], locations: parsed } as any;
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "office_location").maybeSingle();
    const op = existing
      ? supabase.from("app_settings").update({ value: val, updated_by: userId }).eq("key", "office_location")
      : supabase.from("app_settings").insert({ key: "office_location", value: val, updated_by: userId });
    const { error } = await op;
    setSaving(false);
    if (error) toast.error("Failed to save"); else toast.success("Office location(s) saved — attendance geofencing updated");
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Office Location(s) — GPS Geofencing</CardTitle>
        <p className="text-sm text-muted-foreground">
          Staff can only check in/out attendance when their phone GPS is within the configured radius of one of these locations.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {locations.map((loc, i) => (
          <div key={i} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Location {i + 1}</Label>
              {locations.length > 1 && (
                <Button size="sm" variant="ghost" className="text-destructive h-7 gap-1" onClick={() => removeLocation(i)}>
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input placeholder="e.g. Main Office, Branch Office" value={loc.name} onChange={(e) => updateLoc(i, "name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Latitude</Label>
                <Input placeholder="0.347596" value={loc.lat} onChange={(e) => updateLoc(i, "lat", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Longitude</Label>
                <Input placeholder="32.582520" value={loc.lng} onChange={(e) => updateLoc(i, "lng", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Allowed Radius (meters)</Label>
              <Input type="number" min={10} max={5000} placeholder="100" value={loc.radius_meters} onChange={(e) => updateLoc(i, "radius_meters", e.target.value)} />
              <p className="text-xs text-muted-foreground">Staff must be within {loc.radius_meters || "100"}m of this location to check in/out.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => useMyLocation(i)}>
              <MapPin className="h-3.5 w-3.5" /> Use My Current Location
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={addLocation} className="gap-1.5 w-full">
          <Plus className="h-4 w-4" /> Add Another Office Location
        </Button>
        <Button onClick={save} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Office Locations"}
        </Button>
      </CardContent>
    </Card>
  );
};

// ── Site Domain for School Portals ──
const SiteDomainSettings = ({ userId }: { userId?: string }) => {
  const [domain, setDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "site_domain").maybeSingle().then(({ data }) => {
      if (data?.value) setDomain((data.value as any).domain || "");
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const val = { domain } as any;
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "site_domain").maybeSingle();
    const op = existing
      ? supabase.from("app_settings").update({ value: val, updated_by: userId }).eq("key", "site_domain")
      : supabase.from("app_settings").insert({ key: "site_domain", value: val, updated_by: userId });
    const { error } = await op;
    setSaving(false);
    if (error) toast.error("Failed to save"); else toast.success("Site domain saved");
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Site Domain</CardTitle>
        <p className="text-sm text-muted-foreground">This domain/URL is displayed on school portals, ID cards, and public-facing pages.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Website URL</Label>
          <Input placeholder="e.g. www.nyungafoundation.org" value={domain} onChange={(e) => setDomain(e.target.value)} />
          <p className="text-xs text-muted-foreground">Enter your site's public URL without https://</p>
        </div>
        {domain && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm"><strong>Will display as:</strong> <span className="text-primary">{domain}</span></p>
          </div>
        )}
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Domain"}
        </Button>
      </CardContent>
    </Card>
  );
};

const SkipPaymentCodeToggle = () => {
  const [skipCode, setSkipCode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "skip_payment_code")
        .maybeSingle();
      if (data?.value) {
        const val = data.value as { enabled?: boolean };
        setSkipCode(val?.enabled ?? false);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const toggle = async (newValue: boolean) => {
    const { data: userData } = await supabase.auth.getUser();
    const val = { enabled: newValue } as any;

    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", "skip_payment_code")
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("app_settings")
        .update({ value: val, updated_by: userData.user?.id })
        .eq("key", "skip_payment_code"));
    } else {
      ({ error } = await supabase
        .from("app_settings")
        .insert({ key: "skip_payment_code", value: val, updated_by: userData.user?.id }));
    }

    if (error) {
      toast.error("Failed to update setting");
    } else {
      setSkipCode(newValue);
      toast.success(newValue ? "Payment code requirement disabled — workers can create applications freely" : "Payment code requirement re-enabled");
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {skipCode ? <ShieldOff size={20} className="text-destructive" /> : <ShieldCheck size={20} className="text-primary" />}
            <div>
              <Label className="text-sm font-semibold">Auto-Consume Payment Codes</Label>
              <p className="text-xs text-muted-foreground">
                {skipCode
                  ? "Workers can create applications without entering a payment code"
                  : "Users must enter a valid payment code before creating an application"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={skipCode ? "secondary" : "outline"} className="gap-1">
              {skipCode ? "Skip Code" : "Code Required"}
            </Badge>
            <Switch checked={skipCode} onCheckedChange={toggle} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminSettings = () => {
  const { user } = useAuth();
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(defaultReceiptConfig);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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

  const compressImage = (file: File, maxSizeKB: number = 500, maxDim: number = 512): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            if (blob.size > maxSizeKB * 1024 && quality > 0.1) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(blob);
            }
          }, "image/jpeg", quality);
        };
        tryCompress();
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    setUploadingLogo(true);
    try {
      let uploadFile: Blob | File = file;
      if (file.size > 500 * 1024) {
        toast.info("Compressing logo...");
        uploadFile = await compressImage(file);
      }
      const path = `logo/org-logo-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("org-assets").upload(path, uploadFile, { upsert: true, contentType: "image/jpeg" });
      if (error) {
        toast.error("Upload failed: " + error.message);
      } else {
        const { data: urlData } = supabase.storage.from("org-assets").getPublicUrl(path);
        setReceiptConfig((prev) => ({ ...prev, logoUrl: urlData.publicUrl }));
        toast.success("Logo uploaded");
      }
    } catch (err: any) {
      toast.error("Compression failed: " + err.message);
    }
    setUploadingLogo(false);
  };

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
          <TabsTrigger value="domain" className="gap-1"><Globe className="h-4 w-4" /> Domain</TabsTrigger>
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
                  <Label>Organization Logo</Label>
                  <div className="flex items-center gap-3">
                    {receiptConfig.logoUrl ? (
                      <img src={receiptConfig.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-contain border border-border bg-muted" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <Button type="button" variant="outline" size="sm" className="gap-2 relative overflow-hidden" disabled={uploadingLogo}>
                        {uploadingLogo ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload Logo</>}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </Button>
                      {receiptConfig.logoUrl && (
                        <Button type="button" variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => setReceiptConfig((prev) => ({ ...prev, logoUrl: "" }))}>
                          Remove
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">PNG or JPG, max 2MB</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo Initials (fallback)</Label>
                  <Input value={receiptConfig.logoText} onChange={(e) => updateField("logoText", e.target.value)} maxLength={4} placeholder="Used when no logo image" />
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
                  <div className="flex items-center gap-3">
                    {receiptConfig.logoUrl ? (
                      <img src={receiptConfig.logoUrl} alt="Logo" className="h-14 w-14 rounded-lg object-contain flex-shrink-0" />
                    ) : (
                      <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center">
                        {receiptConfig.logoText}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-bold text-foreground leading-tight">{receiptConfig.orgName}</h3>
                      <p className="text-xs text-muted-foreground">{receiptConfig.orgAddress}</p>
                      <p className="text-xs text-muted-foreground">{receiptConfig.orgPhone} • {receiptConfig.orgEmail}</p>
                    </div>
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
          <SiteAddressSettings userId={user?.id} />
          <OfficeLocationSettings userId={user?.id} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <AdmissionSettings />
          <SkipPaymentCodeToggle />
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
        <TabsContent value="domain" className="space-y-4">
          <SiteDomainSettings userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
