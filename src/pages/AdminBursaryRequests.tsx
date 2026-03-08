import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Link2, Copy, CheckCircle, Clock, Calendar, MessageCircle, Plus, User, Phone, MapPin, GraduationCap } from "lucide-react";

interface BursaryRequest {
  id: string;
  full_name: string;
  phone: string;
  nin: string | null;
  district: string | null;
  sub_county: string | null;
  education_level: string | null;
  school_name: string | null;
  reason: string | null;
  income_details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  appointment_id: string | null;
}

interface AppointmentRequirements {
  items: string[];
}

const AdminBursaryRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BursaryRequest[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReq, setSelectedReq] = useState<BursaryRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [reqRes, linkRes, settingsRes] = await Promise.all([
      supabase.from("bursary_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("bursary_request_links").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("app_settings").select("value").eq("key", "appointment_requirements").maybeSingle(),
    ]);
    setRequests((reqRes.data as BursaryRequest[]) || []);
    setLinks(linkRes.data || []);
    const reqItems = (settingsRes.data?.value as unknown as AppointmentRequirements)?.items || [];
    setRequirements(reqItems);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateLink = async () => {
    setGenerating(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("bursary_request_links").insert({
      token, created_by: user!.id, expires_at: expiresAt,
    });
    if (error) { toast.error("Failed to generate link"); }
    else {
      const url = `${window.location.origin}/bursary-request?token=${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link generated & copied to clipboard!");
      fetchData();
    }
    setGenerating(false);
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/bursary-request?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const openApproveDialog = (req: BursaryRequest) => {
    setSelectedReq(req);
    setAppointmentDate("");
    setSeatNumber("");
    setAppointmentNotes("");
    setShowApproveDialog(true);
  };

  const approveAndCreateAppointment = async () => {
    if (!selectedReq || !appointmentDate || !seatNumber) {
      toast.error("Date and seat number are required");
      return;
    }
    const { data: apptData, error: apptError } = await supabase
      .from("appointments").insert({
        person_name: selectedReq.full_name, phone: selectedReq.phone,
        appointment_date: appointmentDate, seat_number: seatNumber,
        purpose: "bursary_request", requirements, notes: appointmentNotes,
        bursary_request_id: selectedReq.id, created_by: user!.id,
      }).select("id").single();
    if (apptError) { toast.error("Failed to create appointment"); return; }
    await supabase.from("bursary_requests").update({
      status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString(),
      appointment_id: apptData.id, admin_notes: appointmentNotes,
    }).eq("id", selectedReq.id);
    const dateFormatted = new Date(appointmentDate).toLocaleDateString("en-UG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const reqList = requirements.map((r, i) => `${i + 1}. ${r}`).join("\n");
    const message = `🎉 *Congratulations ${selectedReq.full_name}!*\n\nYour bursary request has been *approved*.\n\n📅 *Appointment Date:* ${dateFormatted}\n💺 *Seat Number:* ${seatNumber}\n\n📋 *Please come with the following:*\n${reqList}\n\nWe look forward to seeing you!\n\n— God's Will Scholarship Fund`;
    const whatsappUrl = `https://wa.me/${selectedReq.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Approved! WhatsApp message opened.");
    setShowApproveDialog(false);
    fetchData();
  };

  const rejectRequest = async (id: string) => {
    await supabase.from("bursary_requests").update({ status: "rejected", reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    toast.success("Request rejected");
    fetchData();
  };

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = { pending: "outline", approved: "default", rejected: "destructive" };
    return <Badge variant={map[status] || "outline"} className="capitalize">{status}</Badge>;
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-3 sm:p-6 w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Bursary Requests
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Generate one-time links and review submissions</p>
        </div>
        <Button onClick={generateLink} disabled={generating} className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          {generating ? "Generating..." : "Generate Link"}
        </Button>
      </div>

      {/* Recent Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Links</CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-muted-foreground text-sm">No links generated yet.</p>
          ) : (
            <div className="space-y-2">
              {links.slice(0, 5).map((link) => (
                <div key={link.id} className="flex items-center justify-between text-sm border rounded-md p-2">
                  <div className="flex items-center gap-2">
                    {link.is_used ? <CheckCircle className="h-4 w-4 text-green-500" /> : new Date(link.expires_at) < new Date() ? <Clock className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-amber-500" />}
                    <span className="font-mono text-xs">{link.token.slice(0, 12)}...</span>
                    <Badge variant={link.is_used ? "default" : new Date(link.expires_at) < new Date() ? "destructive" : "outline"} className="text-[10px]">
                      {link.is_used ? "Used" : new Date(link.expires_at) < new Date() ? "Expired" : "Active"}
                    </Badge>
                  </div>
                  {!link.is_used && new Date(link.expires_at) >= new Date() && (
                    <Button size="sm" variant="ghost" onClick={() => copyLink(link.token)} className="gap-1">
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests as Card Grid */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Submissions ({requests.length})</h2>
        {requests.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No submissions yet</CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {requests.map((req) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        <User size={14} className="text-primary" /> {req.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone size={12} /> {req.phone}
                      </p>
                    </div>
                    {statusBadge(req.status)}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {req.district && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {req.district}</span>
                    )}
                    {req.education_level && (
                      <span className="flex items-center gap-1"><GraduationCap size={12} /> {req.education_level.replace("_", " ")}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                  <div className="flex gap-2">
                    {req.status === "pending" && (
                      <>
                        <Button size="sm" variant="default" onClick={() => openApproveDialog(req)} className="gap-1 text-xs flex-1">
                          <Calendar className="h-3 w-3" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectRequest(req.id)} className="text-xs">
                          Reject
                        </Button>
                      </>
                    )}
                    {req.status === "approved" && req.appointment_id && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => openApproveDialog(req)}>
                        <MessageCircle className="h-3 w-3" /> Resend
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approve & Schedule Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Approve & Schedule Appointment</DialogTitle></DialogHeader>
          {selectedReq && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md text-sm space-y-1">
                <p><strong>Name:</strong> {selectedReq.full_name}</p>
                <p><strong>Phone:</strong> {selectedReq.phone}</p>
                {selectedReq.reason && <p><strong>Reason:</strong> {selectedReq.reason}</p>}
              </div>
              <div className="space-y-2"><Label>Appointment Date *</Label><Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Seat Number *</Label><Input value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} placeholder="e.g. A1, 15" maxLength={10} /></div>
              <div className="space-y-2"><Label>Notes (optional)</Label><Textarea value={appointmentNotes} onChange={(e) => setAppointmentNotes(e.target.value)} rows={2} maxLength={500} /></div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Requirements (from settings):</Label>
                <ul className="text-xs list-disc pl-4 text-muted-foreground">{requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button onClick={approveAndCreateAppointment} className="gap-2"><MessageCircle className="h-4 w-4" /> Approve & Send WhatsApp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBursaryRequests;
