import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarDays, Plus, MessageCircle, UserCheck, Clock, X, User, Phone } from "lucide-react";

interface Appointment {
  id: string;
  person_name: string;
  phone: string;
  appointment_date: string;
  seat_number: string | null;
  purpose: string;
  requirements: string[];
  notes: string;
  status: string;
  bursary_request_id: string | null;
  application_id: string | null;
  created_at: string;
}

const AdminAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [form, setForm] = useState({ person_name: "", phone: "", appointment_date: "", seat_number: "", purpose: "general", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("appointments").select("*").order("appointment_date", { ascending: true });
    if (filterDate) query = query.eq("appointment_date", filterDate);
    const [apptRes, settingsRes] = await Promise.all([query, supabase.from("app_settings").select("value").eq("key", "appointment_requirements").maybeSingle()]);
    setAppointments((apptRes.data as Appointment[]) || []);
    setRequirements((settingsRes.data?.value as any)?.items || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterDate]);

  const createAppointment = async () => {
    if (!form.person_name || !form.phone || !form.appointment_date) { toast.error("Name, phone and date are required"); return; }
    const { error } = await supabase.from("appointments").insert({ person_name: form.person_name.trim(), phone: form.phone.trim(), appointment_date: form.appointment_date, seat_number: form.seat_number || null, purpose: form.purpose, requirements, notes: form.notes, created_by: user!.id });
    if (error) { toast.error("Failed to create appointment"); return; }
    toast.success("Appointment created!");
    setShowCreateDialog(false);
    setForm({ person_name: "", phone: "", appointment_date: "", seat_number: "", purpose: "general", notes: "" });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    toast.success(`Status updated to ${status}`);
    fetchData();
  };

  const sendWhatsApp = (appt: Appointment) => {
    const dateFormatted = new Date(appt.appointment_date).toLocaleDateString("en-UG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const reqList = (appt.requirements || []).map((r, i) => `${i + 1}. ${r}`).join("\n");
    const message = `Hello ${appt.person_name},\n\nThis is a reminder of your appointment:\n\n📅 *Date:* ${dateFormatted}\n💺 *Seat:* ${appt.seat_number || "TBD"}\n📝 *Purpose:* ${appt.purpose.replace("_", " ")}\n\n📋 *Please bring:*\n${reqList}\n\n— God's Will Scholarship Fund`;
    window.open(`https://wa.me/${appt.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = { scheduled: "outline", completed: "default", cancelled: "destructive", no_show: "secondary" };
    return <Badge variant={colors[status] || "outline"} className="capitalize">{status.replace("_", " ")}</Badge>;
  };

  const todayCount = appointments.filter((a) => a.appointment_date === new Date().toISOString().split("T")[0]).length;

  return (
    <div className="p-3 sm:p-6 w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Appointments
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage office appointments and visits</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2" size="sm">
          <Plus className="h-4 w-4" /> New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="py-3 text-center"><p className="text-xl font-bold">{appointments.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="py-3 text-center"><p className="text-xl font-bold text-primary">{todayCount}</p><p className="text-xs text-muted-foreground">Today</p></CardContent></Card>
        <Card><CardContent className="py-3 text-center"><p className="text-xl font-bold text-green-600">{appointments.filter((a) => a.status === "completed").length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="py-3 text-center"><p className="text-xl font-bold text-amber-600">{appointments.filter((a) => a.status === "scheduled").length}</p><p className="text-xs text-muted-foreground">Scheduled</p></CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Label className="text-sm">Filter by date:</Label>
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-48" />
        {filterDate && <Button variant="ghost" size="sm" onClick={() => setFilterDate("")}>Clear</Button>}
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : appointments.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No appointments found</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appt) => (
            <Card key={appt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <User size={14} className="text-primary" /> {appt.person_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone size={12} /> {appt.phone}
                    </p>
                  </div>
                  {statusBadge(appt.status)}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline"><CalendarDays size={12} className="mr-1" />{new Date(appt.appointment_date).toLocaleDateString()}</Badge>
                  {appt.seat_number && <Badge variant="secondary">Seat: {appt.seat_number}</Badge>}
                  <Badge variant="outline" className="capitalize">{appt.purpose.replace("_", " ")}</Badge>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="ghost" onClick={() => sendWhatsApp(appt)} title="Send WhatsApp" className="gap-1 text-xs">
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </Button>
                  {appt.status === "scheduled" && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(appt.id, "completed")} className="gap-1 text-xs text-green-600">
                        <UserCheck className="h-3 w-3" /> Done
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(appt.id, "no_show")} className="gap-1 text-xs text-amber-600">
                        <Clock className="h-3 w-3" /> No show
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(appt.id, "cancelled")} className="gap-1 text-xs text-destructive">
                        <X className="h-3 w-3" /> Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Appointment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Person Name *</Label><Input value={form.person_name} onChange={(e) => setForm((p) => ({ ...p, person_name: e.target.value }))} maxLength={100} /></div>
            <div className="space-y-2"><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} maxLength={20} /></div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.appointment_date} onChange={(e) => setForm((p) => ({ ...p, appointment_date: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Seat Number</Label><Input value={form.seat_number} onChange={(e) => setForm((p) => ({ ...p, seat_number: e.target.value }))} placeholder="e.g. A1, 15" maxLength={10} /></div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select value={form.purpose} onValueChange={(val) => setForm((p) => ({ ...p, purpose: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bursary_request">Bursary Request</SelectItem>
                  <SelectItem value="document_review">Document Review</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} maxLength={500} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={createAppointment}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAppointments;
