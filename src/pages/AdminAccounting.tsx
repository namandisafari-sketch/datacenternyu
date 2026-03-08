import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Loader2, TrendingUp, TrendingDown, Wallet, PiggyBank, Search, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  reference_number: string;
  application_id: string | null;
  transaction_date: string;
  notes: string;
  created_at: string;
}

interface Budget {
  id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  term: string;
  year: string;
  notes: string;
}

interface PettyCash {
  id: string;
  type: string;
  amount: number;
  description: string;
  authorized_by: string;
  transaction_date: string;
  receipt_url: string;
  notes: string;
  created_at: string;
}

const formatUGX = (n: number) => `UGX ${n.toLocaleString()}`;

const expenseCategories = [
  "Tuition Fees", "Scholastic Materials", "Uniforms", "Feeding", "Medical",
  "Transport", "Administrative", "Staff Salaries", "Office Supplies", "Rent & Utilities", "Other"
];

const incomeCategories = [
  "Donations", "Application Fees", "Grants", "Fundraising", "Government Funding", "Other"
];

const AdminAccounting = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCash[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Dialogs
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showPettyDialog, setShowPettyDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Transaction form
  const [txType, setTxType] = useState("expense");
  const [txCategory, setTxCategory] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [txAmount, setTxAmount] = useState(0);
  const [txRef, setTxRef] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txNotes, setTxNotes] = useState("");

  // Budget form
  const [budgetCat, setBudgetCat] = useState("");
  const [budgetAlloc, setBudgetAlloc] = useState(0);
  const [budgetTerm, setBudgetTerm] = useState("");
  const [budgetYear, setBudgetYear] = useState(new Date().getFullYear().toString());
  const [budgetNotes, setBudgetNotes] = useState("");

  // Petty cash form
  const [pcType, setPcType] = useState("withdrawal");
  const [pcAmount, setPcAmount] = useState(0);
  const [pcDesc, setPcDesc] = useState("");
  const [pcAuth, setPcAuth] = useState("");
  const [pcDate, setPcDate] = useState(new Date().toISOString().split("T")[0]);
  const [pcNotes, setPcNotes] = useState("");

  const fetchData = async () => {
    const [tRes, bRes, pRes] = await Promise.all([
      supabase.from("accounting_transactions").select("*").order("transaction_date", { ascending: false }),
      supabase.from("budget_allocations").select("*").order("created_at", { ascending: false }),
      supabase.from("petty_cash").select("*").order("transaction_date", { ascending: false }),
    ]);
    setTransactions((tRes.data as unknown as Transaction[]) || []);
    setBudgets((bRes.data as unknown as Budget[]) || []);
    setPettyCash((pRes.data as unknown as PettyCash[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Calculations
  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const pcDeposits = pettyCash.filter(p => p.type === "deposit").reduce((s, p) => s + p.amount, 0);
  const pcWithdrawals = pettyCash.filter(p => p.type === "withdrawal").reduce((s, p) => s + p.amount, 0);
  const pcBalance = pcDeposits - pcWithdrawals;

  const addTransaction = async () => {
    if (!txCategory || !txDesc || txAmount <= 0) { toast.error("Fill in category, description and amount"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("accounting_transactions").insert({
      type: txType, category: txCategory, description: txDesc, amount: txAmount,
      reference_number: txRef, transaction_date: txDate, notes: txNotes, recorded_by: user?.id,
    } as any);
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Transaction recorded"); setShowTxDialog(false); resetTxForm(); fetchData(); }
  };

  const addBudget = async () => {
    if (!budgetCat || budgetAlloc <= 0) { toast.error("Fill in category and amount"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("budget_allocations").insert({
      category: budgetCat, allocated_amount: budgetAlloc, term: budgetTerm,
      year: budgetYear, notes: budgetNotes, created_by: user?.id,
    } as any);
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Budget allocated"); setShowBudgetDialog(false); resetBudgetForm(); fetchData(); }
  };

  const addPettyCash = async () => {
    if (!pcDesc || pcAmount <= 0) { toast.error("Fill in description and amount"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("petty_cash").insert({
      type: pcType, amount: pcAmount, description: pcDesc,
      authorized_by: pcAuth, transaction_date: pcDate, notes: pcNotes, recorded_by: user?.id,
    } as any);
    setSubmitting(false);
    if (error) toast.error(error.message);
    else { toast.success("Petty cash recorded"); setShowPettyDialog(false); resetPcForm(); fetchData(); }
  };

  const deleteTx = async (id: string) => {
    await supabase.from("accounting_transactions").delete().eq("id", id);
    fetchData();
  };

  const deletePc = async (id: string) => {
    await supabase.from("petty_cash").delete().eq("id", id);
    fetchData();
  };

  const resetTxForm = () => { setTxType("expense"); setTxCategory(""); setTxDesc(""); setTxAmount(0); setTxRef(""); setTxDate(new Date().toISOString().split("T")[0]); setTxNotes(""); };
  const resetBudgetForm = () => { setBudgetCat(""); setBudgetAlloc(0); setBudgetTerm(""); setBudgetNotes(""); };
  const resetPcForm = () => { setPcType("withdrawal"); setPcAmount(0); setPcDesc(""); setPcAuth(""); setPcDate(new Date().toISOString().split("T")[0]); setPcNotes(""); };

  const filteredTx = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    return matchSearch && matchType;
  });

  // Budget utilization
  const budgetWithSpent = budgets.map(b => {
    const spent = transactions.filter(t => t.type === "expense" && t.category === b.category).reduce((s, t) => s + t.amount, 0);
    return { ...b, actualSpent: spent, utilization: b.allocated_amount > 0 ? (spent / b.allocated_amount) * 100 : 0 };
  });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">Accounting</h1>
          <p className="text-sm text-muted-foreground">Manage finances, budgets and petty cash</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-accent" />
              <p className="text-xs text-muted-foreground">Total Income</p>
            </div>
            <p className="text-lg font-bold text-accent">{formatUGX(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-destructive" />
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
            <p className="text-lg font-bold text-destructive">{formatUGX(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-primary" />
              <p className="text-xs text-muted-foreground">Net Balance</p>
            </div>
            <p className={`text-lg font-bold ${balance >= 0 ? "text-accent" : "text-destructive"}`}>{formatUGX(balance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank size={16} className="text-secondary" />
              <p className="text-xs text-muted-foreground">Petty Cash</p>
            </div>
            <p className="text-lg font-bold text-secondary">{formatUGX(pcBalance)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Income & Expenses</TabsTrigger>
          <TabsTrigger value="budget">Budget Planning</TabsTrigger>
          <TabsTrigger value="petty">Petty Cash</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* LEDGER TAB */}
        <TabsContent value="ledger" className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { resetTxForm(); setShowTxDialog(true); }} className="bg-secondary text-secondary-foreground">
              <Plus size={16} className="mr-1" /> Add Transaction
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Ref</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTx.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No transactions</TableCell></TableRow>
                    ) : filteredTx.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{new Date(t.transaction_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === "income" ? "default" : "destructive"} className="text-xs">
                            {t.type === "income" ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{t.category}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{t.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{t.reference_number}</TableCell>
                        <TableCell className={`text-right font-medium ${t.type === "income" ? "text-accent" : "text-destructive"}`}>
                          {t.type === "income" ? "+" : "-"}{formatUGX(t.amount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => deleteTx(t.id)}>
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
        </TabsContent>

        {/* BUDGET TAB */}
        <TabsContent value="budget" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { resetBudgetForm(); setShowBudgetDialog(true); }} className="bg-secondary text-secondary-foreground">
              <Plus size={16} className="mr-1" /> Allocate Budget
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {budgetWithSpent.length === 0 ? (
              <Card className="col-span-full"><CardContent className="py-8 text-center text-muted-foreground">No budgets allocated yet</CardContent></Card>
            ) : budgetWithSpent.map(b => (
              <Card key={b.id}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{b.category}</h3>
                      <p className="text-xs text-muted-foreground">{b.term} {b.year}</p>
                    </div>
                    <Badge variant={b.utilization > 90 ? "destructive" : b.utilization > 70 ? "secondary" : "outline"} className="text-xs">
                      {b.utilization.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Allocated</span>
                      <span className="font-medium">{formatUGX(b.allocated_amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Spent</span>
                      <span className={`font-medium ${b.utilization > 90 ? "text-destructive" : "text-foreground"}`}>{formatUGX(b.actualSpent)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-medium text-accent">{formatUGX(b.allocated_amount - b.actualSpent)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full transition-all ${b.utilization > 90 ? "bg-destructive" : b.utilization > 70 ? "bg-secondary" : "bg-accent"}`}
                        style={{ width: `${Math.min(b.utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                  {b.notes && <p className="text-xs text-muted-foreground mt-2">{b.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PETTY CASH TAB */}
        <TabsContent value="petty" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <PiggyBank size={18} className="text-secondary" />
              <span className="text-sm font-medium">Current Balance: <strong className={pcBalance >= 0 ? "text-accent" : "text-destructive"}>{formatUGX(pcBalance)}</strong></span>
            </div>
            <Button size="sm" onClick={() => { resetPcForm(); setShowPettyDialog(true); }} className="bg-secondary text-secondary-foreground">
              <Plus size={16} className="mr-1" /> Record Entry
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Authorized By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pettyCash.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No entries</TableCell></TableRow>
                    ) : pettyCash.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{new Date(p.transaction_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={p.type === "deposit" ? "default" : "secondary"} className="text-xs">
                            {p.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{p.description}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.authorized_by}</TableCell>
                        <TableCell className={`text-right font-medium ${p.type === "deposit" ? "text-accent" : "text-foreground"}`}>
                          {p.type === "deposit" ? "+" : "-"}{formatUGX(p.amount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => deletePc(p.id)}>
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
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Income by category */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Income by Category</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {incomeCategories.map(cat => {
                  const total = transactions.filter(t => t.type === "income" && t.category === cat).reduce((s, t) => s + t.amount, 0);
                  if (total === 0) return null;
                  return (
                    <div key={cat} className="flex justify-between text-sm">
                      <span>{cat}</span>
                      <span className="font-medium text-accent">{formatUGX(total)}</span>
                    </div>
                  );
                })}
                {totalIncome === 0 && <p className="text-sm text-muted-foreground">No income recorded</p>}
                <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                  <span>Total Income</span>
                  <span className="text-accent">{formatUGX(totalIncome)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Expenses by category */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {expenseCategories.map(cat => {
                  const total = transactions.filter(t => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0);
                  if (total === 0) return null;
                  return (
                    <div key={cat} className="flex justify-between text-sm">
                      <span>{cat}</span>
                      <span className="font-medium text-destructive">{formatUGX(total)}</span>
                    </div>
                  );
                })}
                {totalExpenses === 0 && <p className="text-sm text-muted-foreground">No expenses recorded</p>}
                <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                  <span>Total Expenses</span>
                  <span className="text-destructive">{formatUGX(totalExpenses)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="sm:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base">Financial Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-accent/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Total Income</p>
                    <p className="text-xl font-bold text-accent">{formatUGX(totalIncome)}</p>
                  </div>
                  <div className="bg-destructive/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold text-destructive">{formatUGX(totalExpenses)}</p>
                  </div>
                  <div className={`rounded-lg p-4 ${balance >= 0 ? "bg-accent/10" : "bg-destructive/10"}`}>
                    <p className="text-xs text-muted-foreground">Net Balance</p>
                    <p className={`text-xl font-bold ${balance >= 0 ? "text-accent" : "text-destructive"}`}>{formatUGX(balance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={showTxDialog} onOpenChange={setShowTxDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Record Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <Button variant={txType === "income" ? "default" : "outline"} onClick={() => { setTxType("income"); setTxCategory(""); }} className="w-full">
                <ArrowUpRight size={16} className="mr-1" /> Income
              </Button>
              <Button variant={txType === "expense" ? "destructive" : "outline"} onClick={() => { setTxType("expense"); setTxCategory(""); }} className="w-full">
                <ArrowDownRight size={16} className="mr-1" /> Expense
              </Button>
            </div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={txCategory} onValueChange={setTxCategory}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {(txType === "income" ? incomeCategories : expenseCategories).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description *</Label>
              <Input value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="What is this transaction for?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Amount (UGX) *</Label>
                <Input type="number" min={0} value={txAmount || ""} onChange={e => setTxAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Reference Number</Label>
              <Input value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="Receipt/invoice number" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={txNotes} onChange={e => setTxNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
            </div>
            <Button onClick={addTransaction} disabled={submitting} className="w-full bg-secondary text-secondary-foreground">
              {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : "Save Transaction"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Allocate Budget</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={budgetCat} onValueChange={setBudgetCat}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {[...expenseCategories, ...incomeCategories.filter(c => !expenseCategories.includes(c))].map(c =>
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Allocated Amount (UGX) *</Label>
              <Input type="number" min={0} value={budgetAlloc || ""} onChange={e => setBudgetAlloc(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Term</Label>
                <Select value={budgetTerm} onValueChange={setBudgetTerm}>
                  <SelectTrigger><SelectValue placeholder="Term..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Year</Label>
                <Input value={budgetYear} onChange={e => setBudgetYear(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={budgetNotes} onChange={e => setBudgetNotes(e.target.value)} rows={2} />
            </div>
            <Button onClick={addBudget} disabled={submitting} className="w-full">Save Budget</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Petty Cash Dialog */}
      <Dialog open={showPettyDialog} onOpenChange={setShowPettyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Petty Cash Entry</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <Button variant={pcType === "deposit" ? "default" : "outline"} onClick={() => setPcType("deposit")} className="w-full">Deposit</Button>
              <Button variant={pcType === "withdrawal" ? "destructive" : "outline"} onClick={() => setPcType("withdrawal")} className="w-full">Withdrawal</Button>
            </div>
            <div className="space-y-1">
              <Label>Amount (UGX) *</Label>
              <Input type="number" min={0} value={pcAmount || ""} onChange={e => setPcAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label>Description *</Label>
              <Input value={pcDesc} onChange={e => setPcDesc(e.target.value)} placeholder="What for?" />
            </div>
            <div className="space-y-1">
              <Label>Authorized By</Label>
              <Input value={pcAuth} onChange={e => setPcAuth(e.target.value)} placeholder="Who authorized?" />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={pcDate} onChange={e => setPcDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={pcNotes} onChange={e => setPcNotes(e.target.value)} rows={2} />
            </div>
            <Button onClick={addPettyCash} disabled={submitting} className="w-full">Save Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAccounting;
