import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SearchX, GraduationCap, Eye, User, Phone, MapPin, Command, ExternalLink, School } from "lucide-react";
import ApplicationFullDetail, { FullApplication } from "@/components/admin/ApplicationFullDetail";

type Student = FullApplication;

interface ScannedDocument {
  id: string;
  application_id: string | null;
  application_number: string;
  original_filename: string;
  storage_path: string;
  school_id: string | null;
}

const normalizeApplicationNumber = (value: string | null | undefined) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const levelLabels: Record<string, string> = {
  nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
};

const statusColors: Record<string, string> = {
  approved: "bg-green-600 text-white", pending: "bg-yellow-500 text-white", under_review: "bg-blue-500 text-white", rejected: "bg-destructive text-destructive-foreground",
};

const AdminStudentSearch = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolNames, setSchoolNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const [{ data: studentsData }, { data: scannedData }, { data: schoolsData }] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("scanned_documents").select("id, application_id, application_number, original_filename, storage_path, school_id"),
        supabase.from("schools").select("id, name"),
      ]);

      setStudents((studentsData as unknown as Student[]) || []);
      setScannedDocuments((scannedData as ScannedDocument[]) || []);
      const sMap: Record<string, string> = {};
      (schoolsData || []).forEach((s: any) => { sMap[s.id] = s.name; });
      setSchoolNames(sMap);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select(); }
      if (e.key === "Escape") { if (selectedStudent) setSelectedStudent(null); else if (search) { setSearch(""); searchRef.current?.focus(); } }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [search, selectedStudent]);

  const getSponsorshipNumber = (id: string) => `NYG-${new Date().getFullYear()}-${id.slice(0, 6).toUpperCase()}`;

  const docsByApplicationId = useMemo(() => {
    const map = new Map<string, ScannedDocument[]>();
    scannedDocuments.forEach((doc) => {
      if (!doc.application_id) return;
      const existing = map.get(doc.application_id) || [];
      existing.push(doc);
      map.set(doc.application_id, existing);
    });
    return map;
  }, [scannedDocuments]);

  const docsByNumber = useMemo(() => {
    const map = new Map<string, ScannedDocument[]>();
    scannedDocuments.forEach((doc) => {
      const key = normalizeApplicationNumber(doc.application_number);
      if (!key) return;
      const existing = map.get(key) || [];
      existing.push(doc);
      map.set(key, existing);
    });
    return map;
  }, [scannedDocuments]);

  const getDocsForStudent = useCallback((student: Student) => {
    const merged = new Map<string, ScannedDocument>();
    (docsByApplicationId.get(student.id) || []).forEach((doc) => merged.set(doc.id, doc));

    const regKey = normalizeApplicationNumber(student.registration_number);
    if (regKey) {
      (docsByNumber.get(regKey) || []).forEach((doc) => merged.set(doc.id, doc));
    }

    return Array.from(merged.values());
  }, [docsByApplicationId, docsByNumber]);

  const openScannedDocument = useCallback(async (storagePath: string) => {
    const { data, error } = await supabase.storage
      .from("scanned-documents")
      .createSignedUrl(storagePath, 3600);

    if (error || !data?.signedUrl) return;
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }, []);

  const searchQuery = search.trim().toLowerCase();
  const normalizedSearchQuery = normalizeApplicationNumber(searchQuery);

  const filtered = students.filter((s) => {
    const sponsorshipNo = getSponsorshipNumber(s.id);
    const studentDocs = getDocsForStudent(s);
    const normalizedRegistrationNumber = normalizeApplicationNumber(s.registration_number);

    const matchesSearch =
      !searchQuery ||
      s.student_name.toLowerCase().includes(searchQuery) ||
      s.parent_name.toLowerCase().includes(searchQuery) ||
      sponsorshipNo.toLowerCase().includes(searchQuery) ||
      s.id.toLowerCase().startsWith(searchQuery) ||
      (s.district && s.district.toLowerCase().includes(searchQuery)) ||
      (s.registration_number && (
        s.registration_number.toLowerCase().includes(searchQuery) ||
        (!!normalizedSearchQuery && normalizedRegistrationNumber.includes(normalizedSearchQuery))
      )) ||
      studentDocs.some((doc) => {
        const rawDocNumber = doc.application_number.toLowerCase();
        const normalizedDocNumber = normalizeApplicationNumber(doc.application_number);
        return rawDocNumber.includes(searchQuery) || (!!normalizedSearchQuery && normalizedDocNumber.includes(normalizedSearchQuery));
      });

    const matchesLevel = levelFilter === "all" || s.education_level === levelFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-3 sm:p-6 w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Student Search
        </h1>
        <Badge variant="outline">{filtered.length} of {students.length} students</Badge>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, application no., sponsorship no., district..." className="pl-9 pr-20" autoFocus />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"><Command size={10} />K</kbd>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {Object.entries(levelLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {(search || levelFilter !== "all" || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setLevelFilter("all"); setStatusFilter("all"); }} className="gap-1 text-muted-foreground">
                <SearchX size={14} /> Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">⌘K</kbd> to search · <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">Esc</kbd> to clear
          </p>
        </CardContent>
      </Card>

      {/* Card Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <SearchX className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No students match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-4">
          {filtered.map((s) => {
            const studentDocs = getDocsForStudent(s);
            const displayApplicationNumber = s.registration_number || studentDocs[0]?.application_number || null;
            const statusKey = s.status || "pending";
            const statusStrip = statusKey === "approved" ? "bg-accent" : statusKey === "rejected" ? "bg-destructive" : statusKey === "under_review" ? "bg-blue-500" : "bg-secondary";

            return (
              <div key={s.id} className="group cursor-pointer" onClick={() => setSelectedStudent(s)}>
                <div className="relative">
                  {/* Folder tab */}
                  <div
                    className="absolute -top-3 left-2 right-[50%] h-5 rounded-t-lg z-0"
                    style={{ background: "linear-gradient(180deg, hsl(var(--folder-tab)) 0%, hsl(var(--folder-body)) 100%)" }}
                  >
                    <div className="absolute bottom-0 left-1 right-1 h-1 rounded-t-sm bg-folder-inner opacity-60" />
                  </div>

                  {/* Folder body */}
                  <div
                    className="relative rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg z-10"
                    style={{
                      background: "linear-gradient(170deg, hsl(var(--folder-body-light)) 0%, hsl(var(--folder-body)) 40%, hsl(var(--folder-tab)) 100%)",
                      boxShadow: "0 2px 8px hsl(var(--folder-shadow) / 0.25), inset 0 1px 0 hsl(var(--folder-body-light) / 0.5)",
                    }}
                  >
                    {/* Status strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusStrip}`} />

                    <div className="p-3 sm:p-4 pl-4 space-y-2.5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-mono text-[11px] font-semibold text-folder-shadow dark:text-folder-inner truncate">{getSponsorshipNumber(s.id)}</p>
                          <p className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 truncate text-primary-foreground dark:text-foreground">
                            <User size={13} className="shrink-0 opacity-70" /> {s.student_name}
                          </p>
                        </div>
                        <Badge className={`text-[10px] capitalize shrink-0 ${statusColors[s.status] || ""}`}>
                          {s.status?.replace("_", " ")}
                        </Badge>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <Badge variant="secondary" className="bg-folder-inner/60 text-folder-shadow dark:bg-folder-inner dark:text-foreground border-0 text-[10px]">
                          {levelLabels[s.education_level] || s.education_level}
                        </Badge>
                        {displayApplicationNumber && (
                          <Badge variant="outline" className="font-mono border-folder-shadow/20 text-folder-shadow dark:border-folder-inner/30 dark:text-folder-inner text-[10px]">
                            #{displayApplicationNumber}
                          </Badge>
                        )}
                        {studentDocs.length > 0 && (
                          <Badge variant="outline" className="border-folder-shadow/20 text-folder-shadow dark:border-folder-inner/30 dark:text-folder-inner text-[10px]">
                            PDF {studentDocs.length}
                          </Badge>
                        )}
                        {(() => {
                          const docSchoolId = studentDocs.find(d => d.school_id)?.school_id;
                          const schoolName = docSchoolId ? schoolNames[docSchoolId] : null;
                          return schoolName ? (
                            <span className="text-folder-shadow/70 dark:text-folder-inner/80 flex items-center gap-1"><School size={11} /> {schoolName}</span>
                          ) : null;
                        })()}
                        {s.district && (
                          <span className="text-folder-shadow/70 dark:text-folder-inner/80 flex items-center gap-1"><MapPin size={11} /> {s.district}</span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <p className="text-[11px] text-folder-shadow/70 dark:text-folder-inner/80 flex items-center gap-1 truncate">
                          <Phone size={11} className="shrink-0" /> {s.parent_name}
                        </p>
                        <div className="flex items-center gap-1">
                          {studentDocs[0] && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-[10px] h-7 bg-folder-inner/40 border-folder-shadow/20 text-folder-shadow hover:bg-folder-inner/70 dark:bg-folder-inner/20 dark:border-folder-inner/30 dark:text-folder-inner"
                              onClick={(e) => {
                                e.stopPropagation();
                                openScannedDocument(studentDocs[0].storage_path);
                              }}
                            >
                              <ExternalLink size={11} /> PDF
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-folder-shadow/70 hover:bg-folder-inner/40 dark:text-folder-inner/80 dark:hover:bg-folder-inner/20"
                            onClick={(e) => { e.stopPropagation(); setSelectedStudent(s); }}
                          >
                            <Eye size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Student Details
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && <ApplicationFullDetail app={selectedStudent} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStudentSearch;
