import { useState } from "react";
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
import { PlusCircle, Pencil, Trash2, School, MapPin, ChevronDown, BookOpen, Search } from "lucide-react";

interface SchoolRow {
  id: string;
  name: string;
  level: string;
  district: string;
  requirements: string | null;
  full_fees: number;
  nyunga_covered_fees: number;
  parent_pays: number | null;
  boarding_available: boolean | null;
  is_active?: boolean | null;
}

interface SchoolManagementSectionProps {
  schools: SchoolRow[];
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

const emptyForm = {
  name: "",
  level: "",
  district: "",
  requirements: "",
  full_fees: 0,
  nyunga_covered_fees: 0,
  parent_pays: 0,
  boarding_available: false,
};

const formatUGX = (amount: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(amount);

const SchoolManagementSection = ({ schools, onRefresh }: SchoolManagementSectionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [expandedFees, setExpandedFees] = useState<string | null>(null);

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
      requirements: school.requirements || "",
      full_fees: school.full_fees,
      nyunga_covered_fees: school.nyunga_covered_fees,
      parent_pays: school.parent_pays || 0,
      boarding_available: school.boarding_available || false,
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
      requirements: form.requirements || null,
      full_fees: form.full_fees,
      nyunga_covered_fees: form.nyunga_covered_fees,
      parent_pays: form.parent_pays,
      boarding_available: form.boarding_available,
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
            <DialogContent className="max-w-lg">
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
                    <Label>District *</Label>
                    <Input
                      value={form.district}
                      onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                      placeholder="e.g. Kampala"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Functional Fees (Internal)</Label>
                  <p className="text-xs text-muted-foreground">These amounts are for internal tracking only and are not shown to applicants.</p>
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Total Fees (UGX)</Label>
                      <Input
                        type="number"
                        value={form.full_fees}
                        onChange={(e) => setForm((p) => ({ ...p, full_fees: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Covered (UGX)</Label>
                      <Input
                        type="number"
                        value={form.nyunga_covered_fees}
                        onChange={(e) => setForm((p) => ({ ...p, nyunga_covered_fees: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Parent Pays (UGX)</Label>
                      <Input
                        type="number"
                        value={form.parent_pays}
                        onChange={(e) => setForm((p) => ({ ...p, parent_pays: Number(e.target.value) }))}
                      />
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
          {filtered.map((school) => (
            <Card key={school.id} className="group">
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{school.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin size={12} /> {school.district}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(school)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
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

                {/* Functional fees - collapsed by default */}
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
                    <div className="mt-2 p-3 rounded-md bg-muted/50 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Fees</span>
                        <span className="font-medium text-foreground">{formatUGX(school.full_fees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Covered</span>
                        <span className="font-medium text-foreground">{formatUGX(school.nyunga_covered_fees)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parent Pays</span>
                        <span className="font-medium text-foreground">{formatUGX(school.parent_pays || 0)}</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {school.requirements && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{school.requirements}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchoolManagementSection;
