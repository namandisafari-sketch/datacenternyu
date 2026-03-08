import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Printer, Plus, Receipt, Clock, DollarSign, TrendingUp,
  Settings2, Loader2, Calculator, ArrowUpDown, FileText,
} from "lucide-react";

const AdminPhotocopying = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showNewTx, setShowNewTx] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  // Transaction form
  const [txForm, setTxForm] = useState({
    customer_name: "",
    paper_size: "A4",
    copy_type: "black_white",
    num_copies: 1,
    amount_paid: 0,
    notes: "",
  });

  // Fetch pricing
  const { data: pricing = [] } = useQuery({
    queryKey: ["photocopy-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photocopy_pricing")
        .select("*")
        .eq("is_active", true)
        .order("paper_size");
      if (error) throw error;
      return data;
    },
  });

  // Fetch transactions for date
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["photocopy-transactions", dateFilter],
    queryFn: async () => {
      const startOfDay = `${dateFilter}T00:00:00`;
      const endOfDay = `${dateFilter}T23:59:59`;
      const { data, error } = await supabase
        .from("photocopy_transactions")
        .select("*")
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch today's shift
  const { data: currentShift } = useQuery({
    queryKey: ["photocopy-shift", dateFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photocopy_shifts")
        .select("*")
        .eq("shift_date", dateFilter)
        .eq("staff_id", user?.id || "")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get price for selected paper/type
  const getPrice = (paperSize: string, copyType: string) => {
    const p = pricing.find((pr: any) => pr.paper_size === paperSize && pr.copy_type === copyType);
    return p ? Number(p.price_per_copy) : 0;
  };

  const pricePerCopy = getPrice(txForm.paper_size, txForm.copy_type);
  const totalAmount = pricePerCopy * txForm.num_copies;
  const changeGiven = Math.max(0, txForm.amount_paid - totalAmount);

  // Create transaction
  const createTx = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("photocopy_transactions").insert({
        customer_name: txForm.customer_name,
        paper_size: txForm.paper_size,
        copy_type: txForm.copy_type,
        num_copies: txForm.num_copies,
        price_per_copy: pricePerCopy,
        total_amount: totalAmount,
        amount_paid: txForm.amount_paid,
        change_given: changeGiven,
        served_by: user?.id || "",
        notes: txForm.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photocopy-transactions"] });
      toast.success(`Transaction recorded — UGX ${totalAmount.toLocaleString()}`);
      setTxForm({ customer_name: "", paper_size: "A4", copy_type: "black_white", num_copies: 1, amount_paid: 0, notes: "" });
      setShowNewTx(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Shift operations
  const openShift = useMutation({
    mutationFn: async (openingCash: number) => {
      const { error } = await supabase.from("photocopy_shifts").insert({
        staff_id: user?.id || "",
        shift_date: dateFilter,
        opening_cash: openingCash,
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photocopy-shift"] });
      toast.success("Shift opened");
      setShowShiftDialog(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const closeShift = useMutation({
    mutationFn: async (closingCash: number) => {
      if (!currentShift) return;
      const expectedCash = Number(currentShift.opening_cash) + dayTotal;
      const discrepancy = closingCash - expectedCash;
      const { error } = await supabase
        .from("photocopy_shifts")
        .update({
          closing_cash: closingCash,
          expected_cash: expectedCash,
          discrepancy,
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", currentShift.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photocopy-shift"] });
      toast.success("Shift closed and reconciled");
      setShowShiftDialog(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Update pricing
  const updatePricing = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { error } = await supabase
        .from("photocopy_pricing")
        .update({ price_per_copy: price, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photocopy-pricing"] });
      toast.success("Price updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const dayTotal = transactions.reduce((sum: number, t: any) => sum + Number(t.total_amount), 0);
  const dayTxCount = transactions.length;
  const dayCopies = transactions.reduce((sum: number, t: any) => sum + Number(t.num_copies), 0);

  const [shiftCash, setShiftCash] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Printer className="h-6 w-6 text-primary" />
            Photocopying POS
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Document photocopying sales & cash reconciliation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPricing(true)} className="gap-2">
            <Settings2 className="h-4 w-4" /> Pricing
          </Button>
          <Button variant="outline" onClick={() => setShowShiftDialog(true)} className="gap-2">
            <Clock className="h-4 w-4" /> {currentShift?.status === "open" ? "Close Shift" : "Open Shift"}
          </Button>
          <Button onClick={() => setShowNewTx(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Sale
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Day Revenue</p>
              <p className="text-lg font-bold">UGX {dayTotal.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-lg font-bold">{dayTxCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Copies</p>
              <p className="text-lg font-bold">{dayCopies}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Shift Status</p>
              <p className="text-lg font-bold capitalize">{currentShift?.status || "No shift"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <Label>Date:</Label>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Copies</TableHead>
                    <TableHead className="text-right">Price/Copy</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                        No transactions for this date
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{format(new Date(t.created_at), "HH:mm")}</TableCell>
                        <TableCell>{t.customer_name || "Walk-in"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{t.paper_size}</Badge></TableCell>
                        <TableCell className="text-xs capitalize">{t.copy_type.replace("_", " ")}</TableCell>
                        <TableCell className="text-right font-mono">{t.num_copies}</TableCell>
                        <TableCell className="text-right font-mono">{Number(t.price_per_copy).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{Number(t.total_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{Number(t.amount_paid).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{Number(t.change_given).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Transaction Dialog */}
      <Dialog open={showNewTx} onOpenChange={setShowNewTx}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" /> New Photocopy Sale
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name (optional)</Label>
              <Input value={txForm.customer_name} onChange={(e) => setTxForm(p => ({ ...p, customer_name: e.target.value }))} placeholder="Walk-in customer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select value={txForm.paper_size} onValueChange={(v) => setTxForm(p => ({ ...p, paper_size: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Copy Type</Label>
                <Select value={txForm.copy_type} onValueChange={(v) => setTxForm(p => ({ ...p, copy_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="black_white">Black & White</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Number of Copies</Label>
              <Input type="number" min={1} value={txForm.num_copies} onChange={(e) => setTxForm(p => ({ ...p, num_copies: parseInt(e.target.value) || 1 }))} />
            </div>

            {/* Price breakdown */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Price per copy:</span>
                <span className="font-mono">UGX {pricePerCopy.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Copies × Price:</span>
                <span className="font-mono">{txForm.num_copies} × {pricePerCopy.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="font-mono text-primary">UGX {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input type="number" min={0} value={txForm.amount_paid} onChange={(e) => setTxForm(p => ({ ...p, amount_paid: parseFloat(e.target.value) || 0 }))} />
            </div>
            {txForm.amount_paid > 0 && txForm.amount_paid >= totalAmount && (
              <div className="flex justify-between text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <span>Change:</span>
                <span className="font-mono">UGX {changeGiven.toLocaleString()}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={txForm.notes} onChange={(e) => setTxForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => createTx.mutate()}
              disabled={createTx.isPending || txForm.num_copies < 1 || txForm.amount_paid < totalAmount}
            >
              {createTx.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              Record Sale — UGX {totalAmount.toLocaleString()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {currentShift?.status === "open" ? "Close Shift" : "Open Shift"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {currentShift?.status === "open" ? (
              <>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Opening Cash:</span>
                    <span className="font-mono">UGX {Number(currentShift.opening_cash).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Today's Sales:</span>
                    <span className="font-mono">UGX {dayTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Expected Cash:</span>
                    <span className="font-mono">UGX {(Number(currentShift.opening_cash) + dayTotal).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Actual Closing Cash (count and enter)</Label>
                  <Input type="number" min={0} value={shiftCash} onChange={(e) => setShiftCash(parseFloat(e.target.value) || 0)} />
                </div>
                {shiftCash > 0 && (
                  <div className={`p-3 rounded-lg text-sm font-medium ${
                    shiftCash - (Number(currentShift.opening_cash) + dayTotal) === 0
                      ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                      : "bg-red-50 dark:bg-red-900/20 text-red-600"
                  }`}>
                    Discrepancy: UGX {(shiftCash - (Number(currentShift.opening_cash) + dayTotal)).toLocaleString()}
                  </div>
                )}
                <Button className="w-full" onClick={() => closeShift.mutate(shiftCash)} disabled={closeShift.isPending}>
                  {closeShift.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Close & Reconcile Shift
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Opening Cash in Drawer</Label>
                  <Input type="number" min={0} value={shiftCash} onChange={(e) => setShiftCash(parseFloat(e.target.value) || 0)} />
                </div>
                <Button className="w-full" onClick={() => openShift.mutate(shiftCash)} disabled={openShift.isPending}>
                  {openShift.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Open Shift
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <Dialog open={showPricing} onOpenChange={setShowPricing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" /> Photocopy Pricing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {pricing.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-sm">{p.paper_size} — <span className="capitalize">{p.copy_type.replace("_", " ")}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">UGX</span>
                  <Input
                    type="number"
                    className="w-24 text-right"
                    defaultValue={p.price_per_copy}
                    onBlur={(e) => {
                      const newPrice = parseFloat(e.target.value);
                      if (newPrice !== Number(p.price_per_copy)) {
                        updatePricing.mutate({ id: p.id, price: newPrice });
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPhotocopying;
