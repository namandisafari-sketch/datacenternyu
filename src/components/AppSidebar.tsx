import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useStaffPermissions, getRoleLabel } from "@/hooks/useStaffPermissions";
import {
  LayoutDashboard,
  FileText,
  GraduationCap,
  School,
  Receipt,
  Settings,
  LogOut,
  ShieldCheck,
  Users,
  CreditCard,
  Ticket,
  Banknote,
  PieChart,
  Search,
  CalendarDays,
  Link2,
  Package,
  Calculator,
  ClipboardList,
  HardDrive,
  Printer,
  ScanLine,
  FileUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const iconMap: Record<string, any> = {
  LayoutDashboard, FileText, GraduationCap, School, Receipt, Settings,
  ShieldCheck, Users, CreditCard, Ticket, Banknote, PieChart, Search,
  CalendarDays, Link2, Package, Calculator, ClipboardList, HardDrive, Printer, ScanLine, FileUp,
};

const allAdminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, moduleKey: "dashboard" },
  { title: "Applications", url: "/admin/applications", icon: FileText, moduleKey: "applications" },
  { title: "Students", url: "/admin/students", icon: GraduationCap, moduleKey: "students" },
  { title: "Student Search", url: "/admin/student-search", icon: Search, moduleKey: "student-search" },
  { title: "Schools", url: "/admin/schools", icon: School, moduleKey: "schools" },
  { title: "Receipts", url: "/admin/receipts", icon: Receipt, moduleKey: "receipts" },
  { title: "ID Cards", url: "/admin/id-cards", icon: CreditCard, moduleKey: "id-cards" },
  { title: "Payment Codes", url: "/admin/payments", icon: Ticket, moduleKey: "payments" },
  { title: "Payment History", url: "/admin/payment-history", icon: Banknote, moduleKey: "payment-history" },
  { title: "Payments Analytics", url: "/admin/payments-dashboard", icon: PieChart, moduleKey: "payments-dashboard" },
  { title: "Bursary Requests", url: "/admin/bursary-requests", icon: Link2, moduleKey: "bursary-requests" },
  { title: "Appointments", url: "/admin/appointments", icon: CalendarDays, moduleKey: "appointments" },
  { title: "Staff", url: "/admin/staff", icon: Users, moduleKey: "staff" },
  { title: "Materials", url: "/admin/materials", icon: Package, moduleKey: "materials" },
  { title: "Accounting", url: "/admin/accounting", icon: Calculator, moduleKey: "accounting" },
  { title: "Photocopying", url: "/admin/photocopying", icon: Printer, moduleKey: "photocopying" },
  { title: "Batch Processing", url: "/admin/batch-processing", icon: ScanLine, moduleKey: "batch-processing" },
  
  { title: "Attendance", url: "/admin/attendance", icon: CalendarDays, moduleKey: "attendance" },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: ClipboardList, moduleKey: "audit-logs" },
  { title: "Backup", url: "/admin/backup", icon: HardDrive, moduleKey: "backup" },
  { title: "Security", url: "/admin/security", icon: ShieldCheck, moduleKey: "security" },
  { title: "Settings", url: "/admin/settings", icon: Settings, moduleKey: "settings" },
];

const schoolItems = [
  { title: "School Portal", url: "/school", icon: School, moduleKey: "school" },
];

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin, isSchool, signOut, user, userRole } = useAuth();
  const { canAccess } = useStaffPermissions();

  // Admin sees all; staff sees only permitted modules; school sees school portal
  const items = isSchool
    ? schoolItems
    : allAdminItems.filter((item) => canAccess(item.moduleKey));

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src="/data-centre-bg.png" alt="Kabejja" className="h-9 w-9 object-contain rounded-lg" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Kabejja V1.00</span>
            <span className="text-xs text-sidebar-foreground/60">Data Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">
              {getRoleLabel(userRole || "staff")}
            </p>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
