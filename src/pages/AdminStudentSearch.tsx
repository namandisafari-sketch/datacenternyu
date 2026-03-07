import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, SearchX, GraduationCap, Eye, User, Phone, MapPin, BookOpen, Command,
} from "lucide-react";
import { toast } from "sonner";
import ApplicationFullDetail, { FullApplication } from "@/components/admin/ApplicationFullDetail";

type Student = FullApplication;

const levelLabels: Record<string, string> = {
  nursery: "Nursery",
  primary: "Primary",
  secondary_o: "O-Level",
  secondary_a: "A-Level",
  vocational: "Vocational",
  university: "University",
};

const statusColors: Record<string, string> = {
  approved: "bg-green-600 text-white",
  pending: "bg-yellow-500 text-white",
  under_review: "bg-blue-500 text-white",
  rejected: "bg-destructive text-destructive-foreground",
};

const AdminStudentSearch = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      setStudents((data as unknown as Student[]) || []);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      // Escape to clear search or close dialog
      if (e.key === "Escape") {
        if (selectedStudent) {
          setSelectedStudent(null);
        } else if (search) {
          setSearch("");
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [search, selectedStudent]);

  const getSponsorshipNumber = (id: string) =>
    `NYG-${new Date().getFullYear()}-${id.slice(0, 6).toUpperCase()}`;

  const filtered = students.filter((s) => {
    const sponsorshipNo = getSponsorshipNumber(s.id);
    const matchesSearch =
      !search ||
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.parent_name.toLowerCase().includes(search.toLowerCase()) ||
      sponsorshipNo.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().startsWith(search.toLowerCase()) ||
      (s.district && s.district.toLowerCase().includes(search.toLowerCase()));
    const matchesLevel = levelFilter === "all" || s.education_level === levelFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" /> Student Search
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filtered.length} of {students.length} students</Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, sponsorship no., district..."
                className="pl-9 pr-20"
                autoFocus
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                <Command size={10} />K
              </kbd>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Object.entries(levelLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {(search || levelFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setLevelFilter("all");
                  setStatusFilter("all");
                }}
                className="gap-1 text-muted-foreground"
              >
                <SearchX size={14} /> Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">⌘K</kbd> to search · <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">Esc</kbd> to clear
          </p>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sponsorship No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedStudent(s)}
                >
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {getSponsorshipNumber(s.id)}
                  </TableCell>
                  <TableCell className="font-medium">{s.student_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {levelLabels[s.education_level] || s.education_level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.district || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs capitalize ${statusColors[s.status] || ""}`}>
                      {s.status?.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.parent_name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(s);
                      }}
                    >
                      <Eye size={15} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <SearchX className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No students match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Student Details
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <ApplicationFullDetail app={selectedStudent} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudentSearch;
