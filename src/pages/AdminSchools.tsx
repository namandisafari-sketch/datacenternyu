import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { School } from "lucide-react";
import SchoolAccountsSection from "@/components/admin/SchoolAccountsSection";

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
}

const AdminSchools = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("schools").select("*");
      setSchools((data as unknown as SchoolRow[]) || []);
      setLoading(false);
    };
    if (user) fetch();
  }, [user]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <School className="h-6 w-6 text-primary" /> Schools
      </h1>
      <SchoolAccountsSection schools={schools} />
    </div>
  );
};

export default AdminSchools;
