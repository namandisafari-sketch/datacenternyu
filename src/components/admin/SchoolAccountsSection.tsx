import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { School, User, Mail, PlusCircle } from "lucide-react";

interface SchoolRow {
  id: string;
  name: string;
  district: string;
}

interface SchoolAccount {
  user_id: string;
  school_id: string;
  school_name: string;
  school_district: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface SchoolAccountsSectionProps {
  schools: SchoolRow[];
}

const SchoolAccountsSection = ({ schools }: SchoolAccountsSectionProps) => {
  const [accounts, setAccounts] = useState<SchoolAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", schoolId: "" });

  const fetchAccounts = async () => {
    // Get school_users, then fetch linked profiles
    const { data: schoolUsers } = await supabase.from("school_users").select("*");
    if (!schoolUsers || schoolUsers.length === 0) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const userIds = schoolUsers.map((su) => su.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);

    const result: SchoolAccount[] = schoolUsers.map((su) => {
      const profile = profiles?.find((p) => p.user_id === su.user_id);
      const school = schools.find((s) => s.id === su.school_id);
      return {
        user_id: su.user_id,
        school_id: su.school_id,
        school_name: school?.name || "Unknown",
        school_district: school?.district || "",
        full_name: profile?.full_name || "N/A",
        email: profile?.email || "N/A",
        created_at: su.created_at,
      };
    });
    setAccounts(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, [schools]);

  const createAccount = async () => {
    const { email, password, fullName, schoolId } = form;
    if (!email || !password || !fullName || !schoolId) {
      toast.error("Fill in all fields");
      return;
    }
    setCreating(true);
    try {
      const res = await supabase.functions.invoke("create-school-account", {
        body: { email, password, full_name: fullName, school_id: schoolId },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || res.error?.message || "Failed to create account");
      } else {
        toast.success("School account created successfully");
        setForm({ email: "", password: "", fullName: "", schoolId: "" });
        setDialogOpen(false);
        fetchAccounts();
      }
    } catch (err: any) {
      toast.error(err.message || "Error creating school account");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <School size={22} className="text-primary" /> School Accounts
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle size={18} /> Create School Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create School Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Partner School *</Label>
                <Select value={form.schoolId} onValueChange={(v) => setForm((p) => ({ ...p, schoolId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select school..." /></SelectTrigger>
                  <SelectContent>
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact Person Name *</Label>
                <Input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="e.g. John Mukasa" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="school@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Minimum 6 characters" />
              </div>
              <Button onClick={createAccount} disabled={creating} className="w-full bg-primary text-primary-foreground">
                {creating ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading school accounts...</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No school accounts created yet. Click "Create School Account" to add one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <Card key={`${acc.user_id}-${acc.school_id}`}>
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{acc.school_name}</h3>
                    <p className="text-xs text-muted-foreground">{acc.school_district}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">School</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User size={14} /> <span className="text-foreground">{acc.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={14} /> <span className="text-foreground">{acc.email}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(acc.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchoolAccountsSection;
