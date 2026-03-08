import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Package, Plus, Search, Loader2, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Distribution {
  id: string;
  application_id: string;
  category_id: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  term: string;
  year: string;
  distributed_at: string;
  notes: string;
}

interface Application {
  id: string;
  student_name: string;
  education_level: string;
}

const formatUGX = (n: number) => `UGX ${n.toLocaleString()}`;

const AdminMaterials = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Dialog state
  const [showAdd, setShowAdd] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [formAppId, setFormAppId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formItem, setFormItem] = useState("");
  const [formQty, setFormQty] = useState(1);
  const [formUnitCost, setFormUnitCost] = useState(0);
  const [formTerm, setFormTerm] = useState("");
  const [formYear, setFormYear] = useState(new Date().getFullYear().toString());
  const [formNotes, setFormNotes] = useState("");

  // Category form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const fetchData = async () => {
    const [cRes, dRes, aRes] = await Promise.all([
      supabase.from("material_categories").select("*").order("name"),
      supabase.from("material_distributions").select("*").order("distributed_at", { ascending: false }),
      supabase.from("applications").select("id, student_name, education_level").eq("status", "approved"),
    ]);
    setCategories((cRes.data as unknown as Category[]) || []);
    setDistributions((dRes.data as unknown as Distribution[]) || []);
    setApplications((aRes.data as unknown as Application[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addDistribution = async () => {
    if (!formAppId || !formCategoryId || !formItem) {
      toast.error("Please fill in student, category and item name");
      return;
    }
    setSubmitting(true);
    const totalCost = formQty * formUnitCost;
    const { error } = await supabase.from("material_distributions").insert({
      application_id: formAppId,
      category_id: formCategoryId,
      item_name: formItem,
      quantity: formQty,
      unit_cost: formUnitCost,
      total_cost: totalCost,
      term: formTerm,
      year: formYear,
      distributed_by: user?.id,
      notes: formNotes,
    } as any);
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Material recorded");
      setShowAdd(false);
      resetForm();
      fetchData();
    }
  };

  const addCategory = async () => {
    if (!catName.trim()) { toast.error("Category name is required"); return; }
    const { error } = await supabase.from("material_categories").insert({
      name: catName.trim(),
      description: catDesc,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Category added");
      setCatName("");
      setCatDesc("");
      setShowCategoryDialog(false);
      fetchData();
    }
  };

  const deleteDistribution = async (id: string) => {
    const { error } = await supabase.from("material_distributions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); fetchData(); }
  };

  const resetForm = () => {
    setFormAppId("");
    setFormCategoryId("");
    setFormItem("");
    setFormQty(1);
    setFormUnitCost(0);
    setFormTerm("");
    setFormNotes("");
  };

  const getStudentName = (appId: string) => applications.find(a => a.id === appId)?.student_name || "Unknown";
  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || "Unknown";

  const filtered = distributions.filter(d => {
    const studentMatch = getStudentName(d.application_id).toLowerCase().includes(search.toLowerCase()) || d.item_name.toLowerCase().includes(search.toLowerCase());
    const catMatch = filterCategory === "all" || d.category_id === filterCategory;
    return studentMatch && catMatch;
  });

  const totalValue = filtered.reduce((sum, d) => sum + d.total_cost, 0);

  // Summary per category
  const categorySummary = categories.map(cat => {
    const items = distributions.filter(d => d.category_id === cat.id);
    return { ...cat, totalItems: items.reduce((s, d) => s + d.quantity, 0), totalCost: items.reduce((s, d) => s + d.total_cost, 0) };
  });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Materials Distribution</h1>
          <p className="text-sm text-muted-foreground">Track physical materials given to students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCategoryDialog(true)}>
            <Plus size={16} className="mr-1" /> Category
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-secondary text-secondary-foreground">
            <Plus size={16} className="mr-1" /> Record Distribution
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categorySummary.map(cat => (
          <Card key={cat.id}>
            <CardContent className="py-3">
              <p className="text-xs text-muted-foreground">{cat.name}</p>
              <p className="text-lg font-bold text-foreground">{cat.totalItems} items</p>
              <p className="text-xs text-accent font-medium">{formatUGX(cat.totalCost)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search student or item..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Distribution Records ({filtered.length})</CardTitle>
            <Badge variant="secondary">{formatUGX(totalValue)} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Term/Year</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
                ) : filtered.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{getStudentName(d.application_id)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{getCategoryName(d.category_id)}</Badge></TableCell>
                    <TableCell className="text-sm">{d.item_name}</TableCell>
                    <TableCell className="text-center">{d.quantity}</TableCell>
                    <TableCell className="text-right text-sm">{formatUGX(d.unit_cost)}</TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatUGX(d.total_cost)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.term} {d.year}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(d.distributed_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => deleteDistribution(d.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Distribution Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Record Material Distribution</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Student *</Label>
              <Select value={formAppId} onValueChange={setFormAppId}>
                <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                <SelectContent>
                  {applications.map(a => <SelectItem key={a.id} value={a.id}>{a.student_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Item Name *</Label>
              <Input value={formItem} onChange={e => setFormItem(e.target.value)} placeholder="e.g. Exercise Books (pack of 10)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={formQty} onChange={e => setFormQty(parseInt(e.target.value) || 1)} />
              </div>
              <div className="space-y-1">
                <Label>Unit Cost (UGX)</Label>
                <Input type="number" min={0} value={formUnitCost} onChange={e => setFormUnitCost(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Total: <strong>{formatUGX(formQty * formUnitCost)}</strong></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Term</Label>
                <Select value={formTerm} onValueChange={setFormTerm}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Year</Label>
                <Input value={formYear} onChange={e => setFormYear(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
            </div>
            <Button onClick={addDistribution} disabled={submitting} className="w-full bg-secondary text-secondary-foreground">
              {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : "Save Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Material Category</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Category Name *</Label>
              <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Sports Equipment" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Optional description" />
            </div>
            <Button onClick={addCategory} className="w-full">Save Category</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMaterials;
