import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard } from "lucide-react";
import IDCardsSection from "@/components/admin/IDCardsSection";

const AdminIDCards = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [appsRes, schoolsRes] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("schools").select("*"),
      ]);
      setApplications(appsRes.data || []);
      setSchools(schoolsRes.data || []);
      setLoading(false);
    };
    if (user) fetch();
  }, [user]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-primary" /> ID Cards
      </h1>
      <IDCardsSection applications={applications} schools={schools} />
    </div>
  );
};

export default AdminIDCards;
