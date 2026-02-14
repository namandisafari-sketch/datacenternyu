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
import { CheckCircle, AlertTriangle, Clock, Send, Plus, Trash2 } from "lucide-react";

interface LinkInfo {
  id: string;
  token: string;
  expires_at: string;
  is_used: boolean;
}

interface ChildEntry {
  name: string;
  education_level: string;
  school_id: string;
  school_name: string;
}

interface SchoolOption {
  id: string;
  name: string;
  level: string;
  total_bursaries: number;
  approved_count: number;
}

const LEVEL_LABELS: Record<string, string> = {
  nursery: "Nursery",
  primary: "Primary",
  secondary_o: "Secondary O-Level",
  secondary_a: "Secondary A-Level",
  vocational: "Vocational",
  university: "University",
};

const emptyChild = (): ChildEntry => ({ name: "", education_level: "", school_id: "", school_name: "" });

const BursaryRequest = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [linkStatus, setLinkStatus] = useState<"loading" | "valid" | "expired" | "used" | "invalid">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Parent info
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [nin, setNin] = useState("");
  const [reason, setReason] = useState("");
  const [incomeDetails, setIncomeDetails] = useState("");

  // Location
  const [district, setDistrict] = useState("");
  const [subCounty, setSubCounty] = useState("");
  const [parish, setParish] = useState("");
  const [village, setVillage] = useState("");

  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [subCounties, setSubCounties] = useState<{ id: string; name: string }[]>([]);
  const [parishes, setParishes] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);

  // Children (1-3)
  const [children, setChildren] = useState<ChildEntry[]>([emptyChild()]);

  // Schools with available bursaries
  const [schools, setSchools] = useState<SchoolOption[]>([]);

  // Fetch districts
  useEffect(() => {
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "district")
      .order("name")
      .then(({ data }) => setDistricts(data || []));
  }, []);

  // Fetch schools with available bursaries using DB function (works without auth)
  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase.rpc("get_schools_with_availability");
      if (!error && data) {
        setSchools(
          data.map((s: any) => ({
            id: s.id,
            name: s.name,
            level: s.level,
            total_bursaries: s.total_bursaries,
            approved_count: Number(s.approved_count),
          }))
        );
      }
    };
    fetchSchools();
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

  // Validate link
  useEffect(() => {
    if (!token) { setLinkStatus("invalid"); return; }
    const validate = async () => {
      const { data, error } = await supabase
        .from("bursary_request_links")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) { setLinkStatus("invalid"); return; }
      if (data.is_used) { setLinkStatus("used"); return; }
      if (new Date(data.expires_at) < new Date()) { setLinkStatus("expired"); return; }
      setLinkInfo(data as LinkInfo);
      setLinkStatus("valid");
    };
    validate();
  }, [token]);

  const updateChild = (index: number, field: keyof ChildEntry, value: string) => {
    setChildren((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // If education_level changed, reset school
      if (field === "education_level") {
        updated[index].school_id = "";
        updated[index].school_name = "";
      }
      if (field === "school_id") {
        const school = schools.find((s) => s.id === value);
        updated[index].school_name = school?.name || "";
      }
      return updated;
    });
  };

  const addChild = () => {
    if (children.length < 3) setChildren((prev) => [...prev, emptyChild()]);
  };

  const removeChild = (index: number) => {
    if (children.length > 1) setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const getSchoolsForLevel = (level: string) => schools.filter((s) => s.level === level);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInfo) return;

    if (!parentName.trim() || !phone.trim()) {
      toast.error("Parent name and phone are required");
      return;
    }

    const validChildren = children.filter((c) => c.name.trim());
    if (validChildren.length === 0) {
      toast.error("Please add at least one child's name");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await supabase
      .from("bursary_requests")
      .insert({
        link_id: linkInfo.id,
        full_name: parentName.trim(),
        phone: phone.trim(),
        nin: nin.trim() || null,
        district,
        sub_county: subCounty,
        parish,
        village,
        education_level: validChildren[0]?.education_level || null,
        school_name: validChildren[0]?.school_name || null,
        reason: reason.trim(),
        income_details: incomeDetails.trim(),
        children: validChildren,
      } as any);

    if (insertError) {
      toast.error("Failed to submit: " + insertError.message);
      setSubmitting(false);
      return;
    }

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
                <p className="text-muted-foreground text-sm">Your bursary request has been received. You will be contacted if approved.</p>
              </>
            ) : linkStatus === "used" ? (
              <>
                <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
                <h2 className="text-xl font-bold">Link Already Used</h2>
                <p className="text-muted-foreground text-sm">This link has already been used.</p>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Parent / Requester Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground border-b pb-1">Parent / Guardian Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Parent / Guardian Name *</Label>
                    <Input value={parentName} onChange={(e) => setParentName(e.target.value)} required maxLength={100} placeholder="Full name" />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone Number *</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={20} placeholder="07XXXXXXXX" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>National ID Number (NIN)</Label>
                  <Input value={nin} onChange={(e) => setNin(e.target.value.toUpperCase())} maxLength={14} />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground border-b pb-1">Location of Residence</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>District *</Label>
                    <Select
                      value={district}
                      onValueChange={async (val) => {
                        const dist = districts.find((d) => d.name === val);
                        setDistrict(val);
                        setSubCounty("");
                        setParish("");
                        setVillage("");
                        setSubCounties([]);
                        setParishes([]);
                        setVillages([]);
                        if (dist) setSubCounties(await loadSubLocations(dist.id, "subcounty"));
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select district..." /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {districts.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Sub County</Label>
                    <Select
                      value={subCounty}
                      onValueChange={async (val) => {
                        const sc = subCounties.find((s) => s.name === val);
                        setSubCounty(val);
                        setParish("");
                        setVillage("");
                        setParishes([]);
                        setVillages([]);
                        if (sc) setParishes(await loadSubLocations(sc.id, "parish"));
                      }}
                      disabled={!district}
                    >
                      <SelectTrigger><SelectValue placeholder={district ? "Select sub county" : "Select district first"} /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {subCounties.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Parish</Label>
                    <Select
                      value={parish}
                      onValueChange={async (val) => {
                        const p = parishes.find((x) => x.name === val);
                        setParish(val);
                        setVillage("");
                        setVillages([]);
                        if (p) setVillages(await loadSubLocations(p.id, "village"));
                      }}
                      disabled={!subCounty}
                    >
                      <SelectTrigger><SelectValue placeholder={subCounty ? "Select parish" : "Select sub county first"} /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {parishes.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Village</Label>
                    <Select value={village} onValueChange={setVillage} disabled={!parish}>
                      <SelectTrigger><SelectValue placeholder={parish ? "Select village" : "Select parish first"} /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {villages.map((v) => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Children */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1">
                  <h3 className="font-semibold text-sm text-foreground">Children Requesting Bursary For</h3>
                  {children.length < 3 && (
                    <Button type="button" variant="ghost" size="sm" onClick={addChild} className="gap-1 text-xs h-7">
                      <Plus size={14} /> Add Child
                    </Button>
                  )}
                </div>

                {children.map((child, idx) => (
                  <Card key={idx} className="border-dashed">
                    <CardContent className="pt-4 pb-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Child {idx + 1}</span>
                        {children.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeChild(idx)} className="h-6 w-6 p-0 text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Child's Full Name *</Label>
                        <Input value={child.name} onChange={(e) => updateChild(idx, "name", e.target.value)} placeholder="Student name" maxLength={100} />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Education Level</Label>
                          <Select value={child.education_level} onValueChange={(val) => updateChild(idx, "education_level", val)}>
                            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(LEVEL_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>School / Institution</Label>
                          <Select
                            value={child.school_id}
                            onValueChange={(val) => updateChild(idx, "school_id", val)}
                            disabled={!child.education_level}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={child.education_level ? "Select school" : "Select level first"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {getSchoolsForLevel(child.education_level).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} ({s.total_bursaries - s.approved_count} slots)
                                </SelectItem>
                              ))}
                              {getSchoolsForLevel(child.education_level).length === 0 && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">No schools with available bursaries at this level</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Reason & Income */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Reason for Bursary Request</Label>
                  <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} placeholder="Explain why you need a bursary..." />
                </div>
                <div className="space-y-1">
                  <Label>Income / Financial Details</Label>
                  <Textarea rows={2} value={incomeDetails} onChange={(e) => setIncomeDetails(e.target.value)} maxLength={500} placeholder="Describe your household income situation..." />
                </div>
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
