import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, MapPin, ChevronDown, BookOpen, Search, Users, X, Plus } from "lucide-react";
import { UGANDA_DISTRICTS } from "@/data/ugandaDistricts";

interface FeeItem {
  name: string;
  amount: number;
}

interface SchoolRow {
  id: string;
  name: string;
  level: string;
  district: string;
  sub_county: string | null;
  parish: string | null;
  village: string | null;
  requirements: string | null;
  full_fees: number;
  nyunga_covered_fees: number;
  parent_pays: number | null;
  boarding_available: boolean | null;
  is_active?: boolean | null;
  total_bursaries: number;
  boarding_functional_fees: FeeItem[];
  day_functional_fees: FeeItem[];
}

interface SchoolManagementSectionProps {
  schools: SchoolRow[];
  approvedCounts: Record<string, number>;
  onRefresh: () => void;
}

const levelLabels: Record<string, string> = {
  nursery: "ECD (Nursery)",
  primary: "Primary",
  secondary_o: "Secondary (O-Level)",
  secondary_a: "Secondary (A-Level)",
  vocational: "Vocational / Technical",
  university: "University / Tertiary",
};

const levelOptions = [
  { value: "nursery", label: "ECD (Nursery)" },
  { value: "primary", label: "Primary" },
  { value: "secondary_o", label: "Secondary (O-Level)" },
  { value: "secondary_a", label: "Secondary (A-Level)" },
  { value: "vocational", label: "Vocational / Technical" },
  { value: "university", label: "University / Tertiary" },
];

interface LocationOption { id: string; name: string; }

const emptyForm = {
  name: "",
  level: "",
  district: "",
  sub_county: "",
  parish: "",
  village: "",
  requirements: "",
  full_fees: 0,
  nyunga_covered_fees: 0,
  parent_pays: 0,
  boarding_available: false,
  total_bursaries: 0,
  boarding_functional_fees: [] as FeeItem[],
  day_functional_fees: [] as FeeItem[],
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const FeeChecklist = ({ fees, onChange, label }: { fees: FeeItem[]; onChange: (fees: FeeItem[]) => void; label: string }) => {
  const addItem = () => onChange([...fees, { name: "", amount: 0 }]);
  const removeItem = (i: number) => onChange(fees.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof FeeItem, value: string | number) =>
    onChange(fees.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));

  const total = fees.reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{label}</Label>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={addItem}>
          <Plus size={12} /> Add Item
        </Button>
      </div>
      {fees.map((fee, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            className="flex-1 h-8 text-xs"
            placeholder="e.g. Tuition, Lunch, Uniform"
            value={fee.name}
            onChange={(e) => updateItem(i, "name", e.target.value)}
          />
          <Input
            className="w-28 h-8 text-xs"
            type="number"
            placeholder="UGX"
            value={fee.amount || ""}
            onChange={(e) => updateItem(i, "amount", Number(e.target.value))}
          />
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(i)}>
            <X size={12} />
          </Button>
        </div>
      ))}
      {fees.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">Total: {formatUGX(total)}</p>
      )}
    </div>
  );
};

const SchoolManagementSection = ({ schools, approvedCounts, onRefresh }: SchoolManagementSectionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [expandedFees, setExpandedFees] = useState<string | null>(null);

  // Location state
  const [subCounties, setSubCounties] = useState<LocationOption[]>([]);
  const [parishes, setParishes] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);

  useEffect(() => {
    if (!form.district) { setSubCounties([]); return; }
    supabase.from("uganda_locations").select("id, name").eq("level", "subcounty").eq("parent_id", form.district).order("name")
      .then(({ data }) => setSubCounties((data as LocationOption[]) || []));
  }, [form.district]);

  useEffect(() => {
    if (!form.sub_county) { setParishes([]); return; }
    supabase.from("uganda_locations").select("id, name").eq("level", "parish").eq("parent_id", form.sub_county).order("name")
      .then(({ data }) => setParishes((data as LocationOption[]) || []));
  }, [form.sub_county]);

  useEffect(() => {
    if (!form.parish) { setVillages([]); return; }
    supabase.from("uganda_locations").select("id, name").eq("level", "village").eq("parent_id", form.parish).order("name")
      .then(({ data }) => setVillages((data as LocationOption[]) || []));
  }, [form.parish]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (school: SchoolRow) => {
    setEditingId(school.id);
    setForm({
      name: school.name,
      level: school.level,
      district: school.district,
      sub_county: school.sub_county || "",
      parish: school.parish || "",
      village: school.village || "",
      requirements: school.requirements || "",
      full_fees: school.full_fees,
      nyunga_covered_fees: school.nyunga_covered_fees,
      parent_pays: school.parent_pays || 0,
      boarding_available: school.boarding_available || false,
      total_bursaries: school.total_bursaries || 0,
      boarding_functional_fees: Array.isArray(school.boarding_functional_fees) ? school.boarding_functional_fees : [],
      day_functional_fees: Array.isArray(school.day_functional_fees) ? school.day_functional_fees : [],
    });
    setDialogOpen(true);
  };

  const saveSchool = async () => {
    if (!form.name || !form.level || !form.district) {
      toast.error("Name, level, and district are required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      level: form.level as any,
      district: form.district,
      sub_county: form.sub_county || null,
      parish: form.parish || null,
      village: form.village || null,
      requirements: form.requirements || null,
      full_fees: form.full_fees,
      nyunga_covered_fees: form.nyunga_covered_fees,
      parent_pays: form.parent_pays,
      boarding_available: form.boarding_available,
      total_bursaries: form.total_bursaries,
      boarding_functional_fees: form.boarding_functional_fees as any,
      day_functional_fees: form.day_functional_fees as any,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("schools").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("schools").insert(payload as any));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingId ? "School updated" : "School added");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      onRefresh();
    }
  };

  const deleteSchool = async (id: string) => {
    if (!confirm("Are you sure you want to delete this school? This cannot be undone.")) return;
    setDeleting(id);
    const { error } = await supabase.from("schools").delete().eq("id", id);
    setDeleting(null);
    if (error) toast.error(error.message);
    else {
      toast.success("School deleted");
      onRefresh();
    }
  };

  const filtered = schools.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.district.toLowerCase().includes(search.toLowerCase())
  );

  const districtName = (id: string) => UGANDA_DISTRICTS.find((d) => d.id === id)?.name || id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <BookOpen size={22} className="text-primary" /> Partner Schools ({schools.length})
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schools..."
              className="pl-9 w-[220px]"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openCreate}>
                <PlusCircle size={18} /> Add School
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingId ? "Edit School" : "Add Partner School"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1">
                <div className="space-y-2">
                  <Label>School Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. St. Mary's Secondary School"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Education Level *</Label>
                    <Select value={form.level} onValueChange={(v) => setForm((p) => ({ ...p, level: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
                      <SelectContent>
                        {levelOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Bursaries</Label>
                    <Input
                      type="number"
                      value={form.total_bursaries || ""}
                      onChange={(e) => setForm((p) => ({ ...p, total_bursaries: Number(e.target.value) }))}
                      placeholder="e.g. 50"
                    />
                  </div>
                </div>

                {/* Location using geo data */}
                <div className="space-y-2">
                  <Label className="font-semibold">School Location *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">District *</Label>
                      <Select value={form.district} onValueChange={(v) => setForm((p) => ({ ...p, district: v, sub_county: "", parish: "", village: "" }))}>
                        <SelectTrigger><SelectValue placeholder="Select district..." /></SelectTrigger>
                        <SelectContent className="max-h-60 bg-background">
                          {UGANDA_DISTRICTS.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sub-county</Label>
                      <Select value={form.sub_county} onValueChange={(v) => setForm((p) => ({ ...p, sub_county: v, parish: "", village: "" }))} disabled={!form.district}>
                        <SelectTrigger><SelectValue placeholder={form.district ? "Select..." : "District first"} /></SelectTrigger>
                        <SelectContent className="max-h-60 bg-background">
                          {subCounties.map((sc) => (
                            <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Parish</Label>
                      <Select value={form.parish} onValueChange={(v) => setForm((p) => ({ ...p, parish: v, village: "" }))} disabled={!form.sub_county}>
                        <SelectTrigger><SelectValue placeholder={form.sub_county ? "Select..." : "Sub-county first"} /></SelectTrigger>
                        <SelectContent className="max-h-60 bg-background">
                          {parishes.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Village</Label>
                      <Select value={form.village} onValueChange={(v) => setForm((p) => ({ ...p, village: v }))} disabled={!form.parish}>
                        <SelectTrigger><SelectValue placeholder={form.parish ? "Select..." : "Parish first"} /></SelectTrigger>
                        <SelectContent className="max-h-60 bg-background">
                          {villages.map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.boarding_available}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, boarding_available: v }))}
                  />
                  <Label>Boarding Available</Label>
                </div>

                {/* Functional Fees - Day */}
                <div className="border rounded-lg p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Define what the student is expected to pay under functional fees.</p>
                  <FeeChecklist
                    label="Day Scholar Functional Fees"
                    fees={form.day_functional_fees}
                    onChange={(fees) => setForm((p) => ({ ...p, day_functional_fees: fees }))}
                  />
                </div>

                {/* Functional Fees - Boarding (only if boarding available) */}
                {form.boarding_available && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <FeeChecklist
                      label="Boarding Functional Fees"
                      fees={form.boarding_functional_fees}
                      onChange={(fees) => setForm((p) => ({ ...p, boarding_functional_fees: fees }))}
                    />
                  </div>
                )}

                {/* Internal tracking fees */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                      <ChevronDown size={14} /> Internal Fee Tracking
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Total Fees (UGX)</Label>
                        <Input type="number" value={form.full_fees} onChange={(e) => setForm((p) => ({ ...p, full_fees: Number(e.target.value) }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Covered (UGX)</Label>
                        <Input type="number" value={form.nyunga_covered_fees} onChange={(e) => setForm((p) => ({ ...p, nyunga_covered_fees: Number(e.target.value) }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Parent Pays (UGX)</Label>
                        <Input type="number" value={form.parent_pays} onChange={(e) => setForm((p) => ({ ...p, parent_pays: Number(e.target.value) }))} />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="space-y-2">
                  <Label>Requirements / Notes</Label>
                  <Textarea
                    rows={3}
                    value={form.requirements}
                    onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                    placeholder="Any specific requirements for this school..."
                  />
                </div>

                <Button onClick={saveSchool} disabled={saving} className="w-full">
                  {saving ? "Saving..." : editingId ? "Update School" : "Add School"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search ? "No schools match your search." : "No partner schools added yet. Click \"Add School\" to get started."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((school) => {
            const approved = approvedCounts[school.id] || 0;
            const available = Math.max(0, school.total_bursaries - approved);
            const dayTotal = (Array.isArray(school.day_functional_fees) ? school.day_functional_fees : []).reduce((s, f) => s + (f.amount || 0), 0);
            const boardingTotal = (Array.isArray(school.boarding_functional_fees) ? school.boarding_functional_fees : []).reduce((s, f) => s + (f.amount || 0), 0);

            return (
              <Card key={school.id} className="group">
                <CardContent className="py-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{school.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin size={12} /> {districtName(school.district)}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(school)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteSchool(school.id)}
                        disabled={deleting === school.id}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {levelLabels[school.level] || school.level}
                    </Badge>
                    {school.boarding_available && (
                      <Badge variant="outline" className="text-xs">Boarding</Badge>
                    )}
                  </div>

                  {/* Bursary availability */}
                  {school.total_bursaries > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Users size={14} className="text-primary" />
                      <span className="text-muted-foreground">
                        Bursaries: <span className="font-semibold text-foreground">{available}</span> / {school.total_bursaries} available
                      </span>
                    </div>
                  )}

                  {/* Functional fees - collapsed */}
                  <Collapsible
                    open={expandedFees === school.id}
                    onOpenChange={(open) => setExpandedFees(open ? school.id : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${expandedFees === school.id ? "rotate-180" : ""}`}
                        />
                        Functional Fees
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 rounded-md bg-muted/50 space-y-3 text-xs">
                        {/* Day fees */}
                        {(Array.isArray(school.day_functional_fees) ? school.day_functional_fees : []).length > 0 && (
                          <div>
                            <p className="font-semibold text-foreground mb-1">Day Scholar</p>
                            {(school.day_functional_fees as FeeItem[]).map((f, i) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-muted-foreground">{f.name}</span>
                                <span className="font-medium text-foreground">{formatUGX(f.amount)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-border mt-1 pt-1 font-semibold">
                              <span>Total</span>
                              <span>{formatUGX(dayTotal)}</span>
                            </div>
                          </div>
                        )}
                        {/* Boarding fees */}
                        {school.boarding_available && (Array.isArray(school.boarding_functional_fees) ? school.boarding_functional_fees : []).length > 0 && (
                          <div>
                            <p className="font-semibold text-foreground mb-1">Boarding</p>
                            {(school.boarding_functional_fees as FeeItem[]).map((f, i) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-muted-foreground">{f.name}</span>
                                <span className="font-medium text-foreground">{formatUGX(f.amount)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-border mt-1 pt-1 font-semibold">
                              <span>Total</span>
                              <span>{formatUGX(boardingTotal)}</span>
                            </div>
                          </div>
                        )}
                        {(Array.isArray(school.day_functional_fees) ? school.day_functional_fees : []).length === 0 &&
                         (Array.isArray(school.boarding_functional_fees) ? school.boarding_functional_fees : []).length === 0 && (
                          <p className="text-muted-foreground">No functional fees defined yet.</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {school.requirements && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{school.requirements}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SchoolManagementSection;
