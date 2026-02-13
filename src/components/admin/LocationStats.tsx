import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Application {
  district: string | null;
  sub_county: string | null;
  parish: string | null;
  village: string | null;
  student_name: string;
  status: string;
}

interface LocationStatsProps {
  applications: Application[];
}

type LocationLevel = "district" | "sub_county" | "parish" | "village";

const levelLabels: Record<LocationLevel, string> = {
  district: "District",
  sub_county: "Sub-county",
  parish: "Parish",
  village: "Village",
};

const LocationStats = ({ applications }: LocationStatsProps) => {
  const [level, setLevel] = useState<LocationLevel>("district");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterSubCounty, setFilterSubCounty] = useState<string>("all");
  const [filterParish, setFilterParish] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (filterDistrict !== "all" && a.district !== filterDistrict) return false;
      if (filterSubCounty !== "all" && a.sub_county !== filterSubCounty) return false;
      if (filterParish !== "all" && a.parish !== filterParish) return false;
      return true;
    });
  }, [applications, statusFilter, filterDistrict, filterSubCounty, filterParish]);

  const districts = useMemo(() => {
    const set = new Set(applications.map((a) => a.district).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [applications]);

  const subCounties = useMemo(() => {
    const base = filterDistrict !== "all" ? applications.filter((a) => a.district === filterDistrict) : applications;
    const set = new Set(base.map((a) => a.sub_county).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [applications, filterDistrict]);

  const parishes = useMemo(() => {
    let base = applications;
    if (filterDistrict !== "all") base = base.filter((a) => a.district === filterDistrict);
    if (filterSubCounty !== "all") base = base.filter((a) => a.sub_county === filterSubCounty);
    const set = new Set(base.map((a) => a.parish).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [applications, filterDistrict, filterSubCounty]);

  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredApps.forEach((a) => {
      const val = a[level];
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [filteredApps, level]);

  const handleDistrictChange = (v: string) => {
    setFilterDistrict(v);
    setFilterSubCounty("all");
    setFilterParish("all");
  };

  const handleSubCountyChange = (v: string) => {
    setFilterSubCounty(v);
    setFilterParish("all");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <MapPin size={20} className="text-primary" />
          Location Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={level} onValueChange={(v) => setLevel(v as LocationLevel)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(levelLabels).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Districts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>

          {(level === "parish" || level === "village" || level === "sub_county") && (
            <Select value={filterSubCounty} onValueChange={handleSubCountyChange}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Sub-counties" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sub-counties</SelectItem>
                {subCounties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {(level === "village" || level === "parish") && (
            <Select value={filterParish} onValueChange={setFilterParish}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Parishes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parishes</SelectItem>
                {parishes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={14} />
          <span><strong className="text-foreground">{filteredApps.length}</strong> students across <strong className="text-foreground">{locationCounts.length}</strong> {levelLabels[level].toLowerCase()}s</span>
        </div>

        {/* Results */}
        {locationCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No location data available for this filter.</p>
        ) : (
          <div className="grid gap-2 max-h-[320px] overflow-y-auto pr-1">
            {locationCounts.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium text-foreground truncate mr-2">{name}</span>
                <Badge variant="secondary" className="shrink-0">
                  {count} {count === 1 ? "student" : "students"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationStats;
