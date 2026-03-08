import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// All available modules in the system
export const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "applications", label: "Applications", icon: "FileText" },
  { key: "students", label: "Students", icon: "GraduationCap" },
  { key: "student-search", label: "Student Search", icon: "Search" },
  { key: "schools", label: "Schools", icon: "School" },
  { key: "receipts", label: "Receipts", icon: "Receipt" },
  { key: "id-cards", label: "ID Cards", icon: "CreditCard" },
  { key: "payments", label: "Payment Codes", icon: "Ticket" },
  { key: "payment-history", label: "Payment History", icon: "Banknote" },
  { key: "payments-dashboard", label: "Payments Analytics", icon: "PieChart" },
  { key: "bursary-requests", label: "Bursary Requests", icon: "Link2" },
  { key: "appointments", label: "Appointments", icon: "CalendarDays" },
  { key: "staff", label: "Staff", icon: "Users" },
  { key: "materials", label: "Materials", icon: "Package" },
  { key: "accounting", label: "Accounting", icon: "Calculator" },
  { key: "photocopying", label: "Photocopying POS", icon: "Printer" },
  { key: "attendance", label: "Attendance", icon: "CalendarDays" },
  { key: "audit-logs", label: "Audit Logs", icon: "ClipboardList" },
  { key: "backup", label: "Backup", icon: "HardDrive" },
  { key: "security", label: "Security", icon: "ShieldCheck" },
  { key: "settings", label: "Settings", icon: "Settings" },
] as const;

export type ModuleKey = typeof ALL_MODULES[number]["key"];

// System roles with display labels
export const SYSTEM_ROLES = [
  { value: "admin", label: "Admin", description: "Full system access" },
  { value: "accountant", label: "Accountant", description: "Financial modules access" },
  { value: "secretary", label: "Secretary", description: "Applications, appointments & records" },
  { value: "data_entrant", label: "Data Entrant", description: "Data entry & student records" },
  { value: "staff", label: "Regular Staff", description: "Basic access only" },
] as const;

// Default module presets per role
export const ROLE_MODULE_PRESETS: Record<string, string[]> = {
  admin: ALL_MODULES.map((m) => m.key),
  accountant: [
    "dashboard", "payments", "payment-history", "payments-dashboard",
    "accounting", "photocopying", "receipts", "materials",
  ],
  secretary: [
    "dashboard", "applications", "students", "student-search", "schools",
    "appointments", "bursary-requests", "receipts", "id-cards",
  ],
  data_entrant: [
    "dashboard", "applications", "students", "student-search",
    "schools", "id-cards",
  ],
  staff: ["dashboard", "photocopying", "attendance"],
};

export function getRoleLabel(role: string): string {
  const found = SYSTEM_ROLES.find((r) => r.value === role);
  return found?.label || role;
}

export function useStaffPermissions() {
  const { user, isAdmin } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["staff-permissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_permissions")
        .select("module_key, can_access")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isAdmin,
  });

  const canAccess = (moduleKey: string): boolean => {
    if (isAdmin) return true;
    return permissions.some((p: any) => p.module_key === moduleKey && p.can_access);
  };

  const accessibleModules = isAdmin
    ? ALL_MODULES.map((m) => m.key)
    : permissions.filter((p: any) => p.can_access).map((p: any) => p.module_key);

  return { canAccess, accessibleModules, isLoading, permissions };
}
