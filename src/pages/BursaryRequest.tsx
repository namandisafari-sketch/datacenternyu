import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle, Clock, Send } from "lucide-react";

interface LinkInfo {
  id: string;
  token: string;
  expires_at: string;
  is_used: boolean;
}

const BursaryRequest = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [linkStatus, setLinkStatus] = useState<"loading" | "valid" | "expired" | "used" | "invalid">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    nin: "",
    district: "",
    sub_county: "",
    parish: "",
    village: "",
    education_level: "",
    school_name: "",
    reason: "",
    income_details: "",
  });

  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [subCounties, setSubCounties] = useState<{ id: string; name: string }[]>([]);
  const [parishes, setParishes] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchDistricts = async () => {
      const { data } = await supabase
        .from("uganda_locations")
        .select("id, name")
        .eq("level", "district")
        .order("name");
      setDistricts(data || []);
    };
    fetchDistricts();
  }, []);

  const loadSubLocations = async (parentId: string, level: string) => {
    const { data } = await supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("parent_id", parentId)
      .eq("level", level)
      .order("name");
    return data || [];
  };

  useEffect(() => {
    if (!token) {
      setLinkStatus("invalid");
      return;
    }
    const validate = async () => {
      const { data, error } = await supabase
        .from("bursary_request_links")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        setLinkStatus("invalid");
        return;
      }

      if (data.is_used) {
        setLinkStatus("used");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setLinkStatus("expired");
        return;
      }

      setLinkInfo(data as LinkInfo);
      setLinkStatus("valid");
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInfo) return;

    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    setSubmitting(true);

    // Insert request
    const { error: insertError } = await supabase
      .from("bursary_requests")
      .insert({
        link_id: linkInfo.id,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        nin: form.nin.trim() || null,
        district: form.district,
        sub_county: form.sub_county,
        parish: form.parish,
        village: form.village,
        education_level: form.education_level,
        school_name: form.school_name.trim(),
        reason: form.reason.trim(),
        income_details: form.income_details.trim(),
      });

    if (insertError) {
      toast.error("Failed to submit: " + insertError.message);
      setSubmitting(false);
      return;
    }

    // Mark link as used
    await supabase
      .from("bursary_request_links")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", linkInfo.id);

    setSubmitting(false);
    setSubmitted(true);
  };

  if (linkStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (linkStatus !== "valid" || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12 space-y-4">
            {submitted ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold">Request Submitted!</h2>
                <p className="text-muted-foreground text-sm">
                  Your bursary request has been received. You will be contacted if your request is approved.
                </p>
              </>
            ) : linkStatus === "used" ? (
              <>
                <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
                <h2 className="text-xl font-bold">Link Already Used</h2>
                <p className="text-muted-foreground text-sm">This link has already been used for a submission.</p>
              </>
            ) : linkStatus === "expired" ? (
              <>
                <Clock className="h-16 w-16 text-destructive mx-auto" />
                <h2 className="text-xl font-bold">Link Expired</h2>
                <p className="text-muted-foreground text-sm">This link has expired. Please request a new one.</p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
                <h2 className="text-xl font-bold">Invalid Link</h2>
                <p className="text-muted-foreground text-sm">This link is not valid.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mx-auto mb-2">
              GW
            </div>
            <CardTitle className="text-xl">Bursary Request Form</CardTitle>
            <CardDescription>Fill in your details to submit a bursary request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} required maxLength={100} />
                </div>
                <div className="space-y-1">
                  <Label>Phone Number *</Label>
                  <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required maxLength={20} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>National ID Number (NIN)</Label>
                <Input value={form.nin} onChange={(e) => setForm((p) => ({ ...p, nin: e.target.value }))} maxLength={20} />
              </div>

              {/* Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>District</Label>
                  <Select
                    value={form.district}
                    onValueChange={async (val) => {
                      const dist = districts.find((d) => d.name === val);
                      setForm((p) => ({ ...p, district: val, sub_county: "", parish: "", village: "" }));
                      setSubCounties([]);
                      setParishes([]);
                      setVillages([]);
                      if (dist) {
                        const subs = await loadSubLocations(dist.id, "sub_county");
                        setSubCounties(subs);
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>{districts.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Sub County</Label>
                  <Select
                    value={form.sub_county}
                    onValueChange={async (val) => {
                      const sc = subCounties.find((s) => s.name === val);
                      setForm((p) => ({ ...p, sub_county: val, parish: "", village: "" }));
                      setParishes([]);
                      setVillages([]);
                      if (sc) {
                        const par = await loadSubLocations(sc.id, "parish");
                        setParishes(par);
                      }
                    }}
                    disabled={!form.district}
                  >
                    <SelectTrigger><SelectValue placeholder="Select sub county" /></SelectTrigger>
                    <SelectContent>{subCounties.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Parish</Label>
                  <Select
                    value={form.parish}
                    onValueChange={async (val) => {
                      const p = parishes.find((x) => x.name === val);
                      setForm((prev) => ({ ...prev, parish: val, village: "" }));
                      setVillages([]);
                      if (p) {
                        const vills = await loadSubLocations(p.id, "village");
                        setVillages(vills);
                      }
                    }}
                    disabled={!form.sub_county}
                  >
                    <SelectTrigger><SelectValue placeholder="Select parish" /></SelectTrigger>
                    <SelectContent>{parishes.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Village</Label>
                  <Select value={form.village} onValueChange={(val) => setForm((p) => ({ ...p, village: val }))} disabled={!form.parish}>
                    <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
                    <SelectContent>{villages.map((v) => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Education Level</Label>
                  <Select value={form.education_level} onValueChange={(val) => setForm((p) => ({ ...p, education_level: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nursery">Nursery</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary_o">Secondary O-Level</SelectItem>
                      <SelectItem value="secondary_a">Secondary A-Level</SelectItem>
                      <SelectItem value="vocational">Vocational</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>School / Institution Name</Label>
                  <Input value={form.school_name} onChange={(e) => setForm((p) => ({ ...p, school_name: e.target.value }))} maxLength={200} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Reason for Bursary Request</Label>
                <Textarea rows={3} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} maxLength={1000} placeholder="Explain why you need a bursary..." />
              </div>

              <div className="space-y-1">
                <Label>Income / Financial Details</Label>
                <Textarea rows={2} value={form.income_details} onChange={(e) => setForm((p) => ({ ...p, income_details: e.target.value }))} maxLength={500} placeholder="Describe your household income situation..." />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BursaryRequest;
