import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { School } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchoolManagementSection from "@/components/admin/SchoolManagementSection";
import SchoolAccountsSection from "@/components/admin/SchoolAccountsSection";

const AdminSchools = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<any[]>([]);
  const [approvedCounts, setApprovedCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchSchools = useCallback(async () => {
    const [{ data: schoolData }, { data: appData }] = await Promise.all([
      supabase.from("schools").select("*"),
      supabase.from("applications").select("school_id").eq("status", "approved"),
    ]);
    setSchools(schoolData || []);

    // Count approved applications per school
    const counts: Record<string, number> = {};
    (appData || []).forEach((a: any) => {
      if (a.school_id) counts[a.school_id] = (counts[a.school_id] || 0) + 1;
    });
    setApprovedCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchSchools();
  }, [user, fetchSchools]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <School className="h-6 w-6 text-primary" /> Schools Management
      </h1>

      <Tabs defaultValue="schools">
        <TabsList>
          <TabsTrigger value="schools">Partner Schools</TabsTrigger>
          <TabsTrigger value="accounts">School Accounts</TabsTrigger>
        </TabsList>
        <TabsContent value="schools" className="mt-4">
          <SchoolManagementSection schools={schools} approvedCounts={approvedCounts} onRefresh={fetchSchools} />
        </TabsContent>
        <TabsContent value="accounts" className="mt-4">
          <SchoolAccountsSection schools={schools} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSchools;
