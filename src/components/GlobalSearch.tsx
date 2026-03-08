import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, FileText, GraduationCap, School, Receipt, CreditCard, Ticket, Banknote, PieChart, Users, CalendarDays, Link2, Camera, Package, Calculator, ClipboardList, ShieldCheck, Settings, LayoutDashboard, Keyboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  type: "page" | "student" | "action";
  label: string;
  description?: string;
  url: string;
  icon: any;
  shortcut?: string;
}

const pages: SearchResult[] = [
  { type: "page", label: "Dashboard", url: "/admin", icon: LayoutDashboard, shortcut: "Alt+H" },
  { type: "page", label: "Applications", url: "/admin/applications", icon: FileText, shortcut: "Alt+A" },
  { type: "page", label: "Students", url: "/admin/students", icon: GraduationCap, shortcut: "Alt+S" },
  { type: "page", label: "Student Search", url: "/admin/student-search", icon: Search, shortcut: "Ctrl+Shift+F" },
  { type: "page", label: "Schools", url: "/admin/schools", icon: School, shortcut: "Alt+C" },
  { type: "page", label: "Receipts", url: "/admin/receipts", icon: Receipt, shortcut: "Alt+R" },
  { type: "page", label: "ID Cards", url: "/admin/id-cards", icon: CreditCard, shortcut: "Alt+I" },
  { type: "page", label: "Payment Codes", url: "/admin/payments", icon: Ticket, shortcut: "Alt+U" },
  { type: "page", label: "Payment History", url: "/admin/payment-history", icon: Banknote, shortcut: "Alt+P" },
  { type: "page", label: "Payments Analytics", url: "/admin/payments-dashboard", icon: PieChart, shortcut: "Alt+G" },
  { type: "page", label: "Bursary Requests", url: "/admin/bursary-requests", icon: Link2, shortcut: "Alt+B" },
  { type: "page", label: "Appointments", url: "/admin/appointments", icon: CalendarDays, shortcut: "Alt+O" },
  { type: "page", label: "Staff", url: "/admin/staff", icon: Users, shortcut: "Alt+W" },
  { type: "page", label: "Materials", url: "/admin/materials", icon: Package, shortcut: "Alt+M" },
  { type: "page", label: "Accounting", url: "/admin/accounting", icon: Calculator, shortcut: "Alt+T" },
  { type: "page", label: "Attendance", url: "/admin/attendance", icon: CalendarDays, shortcut: "Alt+J" },
  { type: "page", label: "Audit Logs", url: "/admin/audit-logs", icon: ClipboardList, shortcut: "Alt+L" },
  { type: "page", label: "Security", url: "/admin/security", icon: ShieldCheck, shortcut: "Alt+1" },
  { type: "page", label: "Settings", url: "/admin/settings", icon: Settings, shortcut: "Alt+E" },
  { type: "action", label: "New Application", description: "Register a new student", url: "/register", icon: FileText, shortcut: "Ctrl+Shift+N" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: Props) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>(pages);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [studentResults, setStudentResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Search students from DB
  useEffect(() => {
    if (query.length < 2) {
      setStudentResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, student_name, registration_number, education_level")
        .or(`student_name.ilike.%${query}%,registration_number.ilike.%${query}%`)
        .limit(8);
      if (data) {
        setStudentResults(
          data.map((s) => ({
            type: "student" as const,
            label: s.student_name,
            description: `${s.registration_number || "No Reg#"} · ${s.education_level}`,
            url: `/admin/students`,
            icon: GraduationCap,
          }))
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter pages
  useEffect(() => {
    if (!query) {
      setResults(pages);
      setSelectedIndex(0);
      return;
    }
    const q = query.toLowerCase();
    const filtered = pages.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
    setResults(filtered);
    setSelectedIndex(0);
  }, [query]);

  const allResults = [...results, ...studentResults];

  const handleSelect = useCallback(
    (result: SearchResult) => {
      navigate(result.url);
      onOpenChange(false);
      setQuery("");
    },
    [navigate, onOpenChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, students, actions..."
            className="border-0 focus-visible:ring-0 shadow-none text-sm h-12"
          />
          <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
            ESC
          </Badge>
        </div>

        <div className="max-h-[400px] overflow-auto py-2">
          {allResults.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No results for "{query}"
            </p>
          ) : (
            <>
              {results.length > 0 && (
                <div className="px-3 py-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                    Pages & Actions
                  </p>
                  {results.map((r, i) => (
                    <button
                      key={r.url + r.label}
                      onClick={() => handleSelect(r)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        i === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <r.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">{r.label}</span>
                      {r.shortcut && (
                        <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                          {r.shortcut}
                        </Badge>
                      )}
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {studentResults.length > 0 && (
                <div className="px-3 py-1 border-t border-border mt-1 pt-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                    Students
                  </p>
                  {studentResults.map((r, i) => {
                    const idx = results.length + i;
                    return (
                      <button
                        key={r.label + i}
                        onClick={() => handleSelect(r)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                          idx === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <r.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 text-left min-w-0">
                          <span className="block truncate">{r.label}</span>
                          <span className="text-[10px] text-muted-foreground">{r.description}</span>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span><kbd className="font-mono bg-muted px-1 rounded">↑↓</kbd> Navigate</span>
          <span><kbd className="font-mono bg-muted px-1 rounded">↵</kbd> Open</span>
          <span><kbd className="font-mono bg-muted px-1 rounded">Esc</kbd> Close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
