import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { toPng } from "html-to-image";
import LocationSelector from "@/components/register/LocationSelector";
import StaffIDCard from "@/components/admin/StaffIDCard";
import ThumbprintCapture from "@/components/admin/ThumbprintCapture";
import {
  Users, Plus, Search, Edit, CreditCard, Loader2, Trash2, Download, Eye,
  UserCircle, Briefcase, MapPin, Phone, Fingerprint,
} from "lucide-react";

interface StaffForm {
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  nin: string;
  gender: string;
  photo_url: string;
  role_title: string;
  department: string;
  date_joined: string;
  employment_status: string;
  access_level: string;
  district: string;
  sub_county: string;
  parish: string;
  village: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  left_thumb_url: string;
  right_thumb_url: string;
}

const emptyForm: StaffForm = {
  user_id: "", full_name: "", phone: "", email: "", date_of_birth: "", nin: "",
  gender: "", photo_url: "", role_title: "", department: "", date_joined: new Date().toISOString().split("T")[0],
  employment_status: "active", access_level: "standard",
  district: "", sub_county: "", parish: "", village: "",
  emergency_contact_name: "", emergency_contact_phone: "", emergency_contact_relationship: "",
  left_thumb_url: "", right_thumb_url: "",
};

const departments = ["Administration", "Finance", "IT", "Operations", "Legal", "Field", "Other"];
const accessLevels = ["standard", "elevated", "admin"];

const AdminStaff = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showIDCard, setShowIDCard] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Fetch staff profiles
  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch system users for linking
  const { data: systemUsers = [] } = useQuery({
    queryKey: ["system-users-for-staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  // Users not yet linked to a staff profile
  const linkedUserIds = new Set(staff.map((s: any) => s.user_id));
  const availableUsers = systemUsers.filter((u: any) => !linkedUserIds.has(u.user_id));

  // Upload photo
  const uploadPhoto = async (file: File, userId: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `staff-photos/${userId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("application-documents").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("application-documents").getPublicUrl(path);
    return data.publicUrl;
  };

  // Upload thumb data URL as image
  const uploadThumb = async (dataUrl: string, userId: string, side: string): Promise<string> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const path = `staff-thumbs/${userId}-${side}-${Date.now()}.png`;
    const { error } = await supabase.storage.from("application-documents").upload(path, blob, { upsert: true, contentType: "image/png" });
    if (error) throw error;
    const { data } = supabase.storage.from("application-documents").getPublicUrl(path);
    return data.publicUrl;
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      let photoUrl = form.photo_url;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile, form.user_id);
      }

      let leftThumbUrl = form.left_thumb_url;
      let rightThumbUrl = form.right_thumb_url;

      // Upload thumbs if they're data URLs (newly captured)
      if (leftThumbUrl && leftThumbUrl.startsWith("data:")) {
        leftThumbUrl = await uploadThumb(leftThumbUrl, form.user_id, "left");
      }
      if (rightThumbUrl && rightThumbUrl.startsWith("data:")) {
        rightThumbUrl = await uploadThumb(rightThumbUrl, form.user_id, "right");
      }

      const payload = { ...form, photo_url: photoUrl, left_thumb_url: leftThumbUrl, right_thumb_url: rightThumbUrl };

      if (editingId) {
        const { error } = await supabase.from("staff_profiles").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_profiles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-profiles"] });
      toast.success(editingId ? "Staff profile updated" : "Staff profile created");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-profiles"] });
      toast.success("Staff profile deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm(emptyForm);
    setPhotoFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (s: any) => {
    setForm({
      user_id: s.user_id, full_name: s.full_name, phone: s.phone || "", email: s.email || "",
      date_of_birth: s.date_of_birth || "", nin: s.nin || "", gender: s.gender || "",
      photo_url: s.photo_url || "", role_title: s.role_title || "", department: s.department || "",
      date_joined: s.date_joined || "", employment_status: s.employment_status || "active",
      access_level: s.access_level || "standard",
      district: s.district || "", sub_county: s.sub_county || "", parish: s.parish || "", village: s.village || "",
      emergency_contact_name: s.emergency_contact_name || "",
      emergency_contact_phone: s.emergency_contact_phone || "",
      emergency_contact_relationship: s.emergency_contact_relationship || "",
      left_thumb_url: s.left_thumb_url || "",
      right_thumb_url: s.right_thumb_url || "",
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleExportCard = async (cardSide: "front" | "back") => {
    const el = document.querySelector(`[data-card-side="${cardSide}"]`) as HTMLElement;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      const name = showIDCard?.full_name?.replace(/\s+/g, "-") || "staff";
      link.download = `${name}-${cardSide}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(`${cardSide} exported`);
    } catch {
      toast.error("Export failed");
    }
  };

  const filteredStaff = staff.filter((s: any) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.staff_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase()) ||
    s.role_title?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = staff.filter((s: any) => s.employment_status === "active").length;

  const updateField = (field: keyof StaffForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Staff Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {staff.length} staff members · {activeCount} active
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, staff #, department..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Staff #</TableHead>
                    <TableHead className="hidden md:table-cell">Role</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        {staff.length === 0 ? "No staff profiles yet. Click 'Add Staff' to get started." : "No results found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border">
                            {s.photo_url ? (
                              <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <UserCircle className="w-full h-full text-muted-foreground p-1" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell className="font-mono text-xs">{s.staff_number}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{s.role_title || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{s.department || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{s.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={s.employment_status === "active" ? "default" : "secondary"} className="text-xs capitalize">
                            {s.employment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(s)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowIDCard(s)} title="ID Card">
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => {
                              if (confirm(`Delete ${s.full_name}?`)) deleteMutation.mutate(s.id);
                            }} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {editingId ? "Edit Staff Profile" : "New Staff Profile"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="personal" className="mt-2">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="personal" className="gap-1 text-xs"><UserCircle className="h-3 w-3" />Personal</TabsTrigger>
              <TabsTrigger value="employment" className="gap-1 text-xs"><Briefcase className="h-3 w-3" />Employment</TabsTrigger>
              <TabsTrigger value="address" className="gap-1 text-xs"><MapPin className="h-3 w-3" />Address</TabsTrigger>
              <TabsTrigger value="emergency" className="gap-1 text-xs"><Phone className="h-3 w-3" />Emergency</TabsTrigger>
            </TabsList>

            {/* Personal */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              {!editingId && (
                <div className="space-y-2">
                  <Label>Link to System User *</Label>
                  <Select value={form.user_id} onValueChange={(v) => {
                    const found = systemUsers.find((u: any) => u.user_id === v);
                    setForm((prev) => ({
                      ...prev,
                      user_id: v,
                      full_name: found?.full_name || prev.full_name,
                      email: found?.email || prev.email,
                    }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select a system user..." /></SelectTrigger>
                    <SelectContent className="bg-background">
                      {availableUsers.map((u: any) => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          {u.full_name || u.email} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>NIN</Label>
                  <Input value={form.nin} onChange={(e) => updateField("nin", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Photo</Label>
                <div className="flex items-center gap-4">
                  {(form.photo_url || photoFile) && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border bg-muted">
                      <img
                        src={photoFile ? URL.createObjectURL(photoFile) : form.photo_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              {/* Thumbprint Registration */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-primary" />
                  Thumbprint Registration (for attendance)
                </Label>
                <div className="flex gap-6 justify-center py-2 px-4 rounded-lg border border-dashed border-border bg-muted/30">
                  <ThumbprintCapture
                    label="Left Thumb"
                    existingUrl={form.left_thumb_url && !form.left_thumb_url.startsWith("data:") ? form.left_thumb_url : undefined}
                    onCapture={(url) => updateField("left_thumb_url", url)}
                  />
                  <ThumbprintCapture
                    label="Right Thumb"
                    existingUrl={form.right_thumb_url && !form.right_thumb_url.startsWith("data:") ? form.right_thumb_url : undefined}
                    onCapture={(url) => updateField("right_thumb_url", url)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Employment */}
            <TabsContent value="employment" className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role / Title</Label>
                  <Input value={form.role_title} onChange={(e) => updateField("role_title", e.target.value)} placeholder="e.g. Data Officer" />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={(v) => updateField("department", v)}>
                    <SelectTrigger><SelectValue placeholder="Select department..." /></SelectTrigger>
                    <SelectContent className="bg-background">
                      {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Joined</Label>
                  <Input type="date" value={form.date_joined} onChange={(e) => updateField("date_joined", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Employment Status</Label>
                  <Select value={form.employment_status} onValueChange={(v) => updateField("employment_status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select value={form.access_level} onValueChange={(v) => updateField("access_level", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background">
                      {accessLevels.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Address */}
            <TabsContent value="address" className="mt-4">
              <LocationSelector
                district={form.district}
                subCounty={form.sub_county}
                parish={form.parish}
                village={form.village}
                onDistrictChange={(v) => updateField("district", v)}
                onSubCountyChange={(v) => updateField("sub_county", v)}
                onParishChange={(v) => updateField("parish", v)}
                onVillageChange={(v) => updateField("village", v)}
              />
            </TabsContent>

            {/* Emergency */}
            <TabsContent value="emergency" className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input value={form.emergency_contact_name} onChange={(e) => updateField("emergency_contact_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={form.emergency_contact_phone} onChange={(e) => updateField("emergency_contact_phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input value={form.emergency_contact_relationship} onChange={(e) => updateField("emergency_contact_relationship", e.target.value)} placeholder="e.g. Spouse, Parent" />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Validation warnings */}
          {!editingId && !form.user_id && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-2">
              ⚠️ Please select a System User on the <strong>Personal</strong> tab first
            </p>
          )}
          {!form.full_name && form.user_id && (
            <p className="text-sm text-destructive flex items-center gap-1 mt-2">
              ⚠️ Full Name is required
            </p>
          )}

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.user_id || !form.full_name}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingId ? "Update" : "Create"} Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ID Card Dialog */}
      <Dialog open={!!showIDCard} onOpenChange={(open) => { if (!open) setShowIDCard(null); }}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Staff ID Card — {showIDCard?.full_name}
            </DialogTitle>
          </DialogHeader>
          {showIDCard && (
            <div className="space-y-4">
              <div className="flex flex-col gap-6 items-center">
                <StaffIDCard staff={showIDCard} side="front" />
                <StaffIDCard staff={showIDCard} side="back" />
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" className="gap-2" onClick={() => handleExportCard("front")}>
                  <Download className="h-4 w-4" /> Front
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => handleExportCard("back")}>
                  <Download className="h-4 w-4" /> Back
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaff;
