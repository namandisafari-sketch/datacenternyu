import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileSpreadsheet, Search, Eye, Download, ExternalLink, BarChart3,
} from "lucide-react";

interface Sheet {
  id: string;
  school_id: string;
  term: string;
  year: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  file_url: string | null;
  status: string;
  created_at: string;
}

interface Score {
  id: string;
  sheet_id: string;
  student_name: string;
  class_grade: string | null;
  subjects: any[];
  total_marks: number;
  average_marks: number;
  grade: string | null;
  remarks: string | null;
}

const AdminPerformanceReports = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [schools, setSchools] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: sheetsData }, { data: schoolsData }] = await Promise.all([
        supabase.from("student_performance_sheets").select("*").order("created_at", { ascending: false }),
        supabase.from("schools").select("id, name"),
      ]);

      setSheets((sheetsData as unknown as Sheet[]) || []);
      const map: Record<string, string> = {};
      (schoolsData || []).forEach((s: any) => { map[s.id] = s.name; });
      setSchools(map);
      setLoading(false);
    };
    fetchData();
  }, []);

  const viewSheet = async (sheet: Sheet) => {
    setSelectedSheet(sheet);
    const { data } = await supabase
      .from("student_performance_scores")
      .select("*")
      .eq("sheet_id", sheet.id)
      .order("student_name");
    setScores((data as unknown as Score[]) || []);
    setDetailOpen(true);
  };

  const filtered = sheets.filter((s) => {
    const schoolName = schools[s.school_id] || "";
    const matchesSearch = !search || schoolName.toLowerCase().includes(search.toLowerCase()) ||
      (s.reporter_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesTerm = filterTerm === "all" || s.term === filterTerm;
    return matchesSearch && matchesTerm;
  });

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" /> Student Performance Reports
      </h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by school..." className="pl-9" />
        </div>
        <Select value={filterTerm} onValueChange={setFilterTerm}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            <SelectItem value="Term 1">Term 1</SelectItem>
            <SelectItem value="Term 2">Term 2</SelectItem>
            <SelectItem value="Term 3">Term 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <FileSpreadsheet size={28} className="text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{sheets.length}</p>
              <p className="text-xs text-muted-foreground">Total Submissions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <Download size={28} className="text-secondary" />
            <div>
              <p className="text-xl font-bold text-foreground">{sheets.filter((s) => s.file_url).length}</p>
              <p className="text-xs text-muted-foreground">File Uploads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex items-center gap-4">
            <BarChart3 size={28} className="text-accent" />
            <div>
              <p className="text-xl font-bold text-foreground">{sheets.filter((s) => !s.file_url).length}</p>
              <p className="text-xs text-muted-foreground">Online Entries</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sheets list */}
      <div className="space-y-3">
        {filtered.map((sheet) => (
          <Card key={sheet.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {schools[sheet.school_id] || "Unknown School"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sheet.term} {sheet.year} • Submitted by {sheet.reporter_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sheet.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={sheet.file_url ? "secondary" : "outline"}>
                    {sheet.file_url ? "File Upload" : "Online Entry"}
                  </Badge>
                  {sheet.file_url ? (
                    <a href={sheet.file_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1">
                        <ExternalLink size={14} /> View File
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => viewSheet(sheet)}>
                      <Eye size={14} /> View Scores
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No performance reports found.</CardContent></Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSheet && `${schools[selectedSheet.school_id]} — ${selectedSheet.term} ${selectedSheet.year}`}
            </DialogTitle>
          </DialogHeader>
          {scores.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    {(scores[0]?.subjects || []).map((sub: any, i: number) => (
                      <TableHead key={i} className="text-center text-xs">{sub.subject}</TableHead>
                    ))}
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Avg</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((score, idx) => (
                    <TableRow key={score.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{score.student_name}</TableCell>
                      <TableCell>{score.class_grade || "—"}</TableCell>
                      {(score.subjects || []).map((sub: any, i: number) => (
                        <TableCell key={i} className="text-center">{sub.marks || "—"}</TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">{score.total_marks}</TableCell>
                      <TableCell className="text-center">{score.average_marks}</TableCell>
                      <TableCell className="text-xs">{score.remarks || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {scores.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No scores recorded for this sheet.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPerformanceReports;
