import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, PlusCircle, Copy, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";

interface PaymentCode {
  id: string;
  code: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  application_id: string | null;
  created_at: string;
}

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NYG-";
  for (let i = 0; i < 3; i++) {
    if (i > 0) code += "-";
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return code;
};

const PaymentCodesSection = () => {
  const [codes, setCodes] = useState<PaymentCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [batchCount, setBatchCount] = useState(1);
  const [search, setSearch] = useState("");

  const fetchCodes = async () => {
    const { data } = await supabase
      .from("payment_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setCodes((data as unknown as PaymentCode[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerate = async () => {
    if (batchCount < 1 || batchCount > 100) {
      toast.error("Enter a number between 1 and 100");
      return;
    }
    setGenerating(true);
    const { data: userData } = await supabase.auth.getUser();
    const newCodes = Array.from({ length: batchCount }, () => ({
      code: generateCode(),
      created_by: userData.user?.id,
    }));

    const { error } = await supabase.from("payment_codes").insert(newCodes as any);
    if (error) toast.error(error.message);
    else {
      toast.success(`${batchCount} payment code(s) generated!`);
      fetchCodes();
    }
    setGenerating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const filtered = codes.filter(
    (c) => !search || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const unusedCount = codes.filter((c) => !c.is_used).length;
  const usedCount = codes.filter((c) => c.is_used).length;

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Ticket size={22} className="text-primary" /> Payment Codes
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">{unusedCount} available</Badge>
          <Badge variant="secondary" className="text-sm">{usedCount} used</Badge>
        </div>
      </div>

      {/* Generate */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">Number of codes</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={batchCount}
                onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                className="w-24"
              />
            </div>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
              Generate Codes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code..."
          className="pl-9"
        />
      </div>

      {/* Codes list */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <Card key={c.id} className={c.is_used ? "opacity-60" : ""}>
            <CardContent className="py-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono font-semibold text-sm text-foreground">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.is_used
                    ? `Used ${c.used_at ? new Date(c.used_at).toLocaleDateString() : ""}`
                    : `Created ${new Date(c.created_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.is_used ? (
                  <Badge variant="secondary">Used</Badge>
                ) : (
                  <>
                    <Badge className="bg-accent text-accent-foreground">Available</Badge>
                    <Button size="icon" variant="ghost" onClick={() => copyCode(c.code)}>
                      <Copy size={14} />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-4">No codes found.</p>
        )}
      </div>
    </div>
  );
};

export default PaymentCodesSection;
