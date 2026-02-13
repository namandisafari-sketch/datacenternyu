import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Settings } from "lucide-react";
import { toast } from "sonner";

const AdmissionSettings = () => {
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSetting = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .eq("key", "admission_lock")
      .single();
    if (data) {
      const val = data.value as { locked?: boolean };
      setLocked(val?.locked ?? false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSetting();

    // Auto-lock check: if current month > 8 (September+), suggest locking
    const currentMonth = new Date().getMonth() + 1; // 1-indexed
    if (currentMonth > 8) {
      // Will be checked on load, but admin still has manual control
    }
  }, []);

  const toggleLock = async (newValue: boolean) => {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("app_settings")
      .update({
        value: { locked: newValue } as any,
        updated_at: new Date().toISOString(),
        updated_by: userData.user?.id,
      } as any)
      .eq("key", "admission_lock");

    if (error) {
      toast.error("Failed to update setting");
    } else {
      setLocked(newValue);
      toast.success(newValue ? "Admissions locked" : "Admissions unlocked");
    }
  };

  if (loading) return null;

  const currentMonth = new Date().getMonth() + 1;
  const shouldAutoLock = currentMonth > 8;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-primary" />
            <div>
              <Label className="text-sm font-semibold">Admission Lock</Label>
              <p className="text-xs text-muted-foreground">
                {shouldAutoLock && !locked
                  ? "⚠️ It's past August — consider locking admissions"
                  : "Control whether new applications can be submitted"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={locked ? "destructive" : "outline"} className="gap-1">
              {locked ? <Lock size={12} /> : <Unlock size={12} />}
              {locked ? "Locked" : "Open"}
            </Badge>
            <Switch checked={locked} onCheckedChange={toggleLock} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdmissionSettings;
