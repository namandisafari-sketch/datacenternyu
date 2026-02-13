import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { UGANDA_DISTRICTS } from "@/data/ugandaDistricts";

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

interface LocOption {
  id: string;
  name: string;
}

const LocationStats = ({ applications }: LocationStatsProps) => {
  const [level, setLevel] = useState<LocationLevel>("district");
  const [filterDistrict, setFilterDistrict] = useState<string>("all");
  const [filterSubCounty, setFilterSubCounty] = useState<string>("all");
  const [filterParish, setFilterParish] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [subCounties, setSubCounties] = useState<LocOption[]>([]);
  const [parishes, setParishes] = useState<LocOption[]>([]);

  // Name lookup maps
  const districtMap = useMemo(() => {
    const m: Record<string, string> = {};
    UGANDA_DISTRICTS.forEach((d) => { m[d.id] = d.name; });
    return m;
  }, []);

  const [nameCache, setNameCache] = useState<Record<string, string>>({});

  // Fetch names for all location IDs found in applications (for display)
  useEffect(() => {
    const allIds = new Set<string>();
    applications.forEach((a) => {
      [a.sub_county, a.parish, a.village].forEach((v) => {
        if (v && !districtMap[v] && !nameCache[v]) allIds.add(v);
      });
    });
    if (allIds.size === 0) return;

    const idsArr = Array.from(allIds);
    // Batch fetch in chunks of 500
    const fetchNames = async () => {
      const newCache: Record<string, string> = {};
      for (let i = 0; i < idsArr.length; i += 500) {
        const chunk = idsArr.slice(i, i + 500);
        const { data } = await supabase
          .from("uganda_locations")
          .select("id, name")
          .in("id", chunk);
        data?.forEach((loc) => { newCache[loc.id] = loc.name; });
      }
      setNameCache((prev) => ({ ...prev, ...newCache }));
    };
    fetchNames();
  }, [applications, districtMap]);

  // Load sub-counties for selected district from geo DB
  useEffect(() => {
    if (filterDistrict === "all") { setSubCounties([]); return; }
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "subcounty")
      .eq("parent_id", filterDistrict)
      .order("name")
      .then(({ data }) => setSubCounties((data as LocOption[]) || []));
  }, [filterDistrict]);

  // Load parishes for selected sub-county from geo DB
  useEffect(() => {
    if (filterSubCounty === "all") { setParishes([]); return; }
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "parish")
      .eq("parent_id", filterSubCounty)
      .order("name")
      .then(({ data }) => setParishes((data as LocOption[]) || []));
  }, [filterSubCounty]);

  const getName = (id: string | null): string => {
    if (!id) return "Unknown";
    return districtMap[id] || nameCache[id] || id;
  };

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (filterDistrict !== "all" && a.district !== filterDistrict) return false;
      if (filterSubCounty !== "all" && a.sub_county !== filterSubCounty) return false;
      if (filterParish !== "all" && a.parish !== filterParish) return false;
      return true;
    });
  }, [applications, statusFilter, filterDistrict, filterSubCounty, filterParish]);

  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredApps.forEach((a) => {
      const val = a[level];
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => ({ id, name: getName(id), count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredApps, level, districtMap, nameCache]);

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
    <Card className="mb-6">
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
            <SelectContent className="bg-background">
              {Object.entries(levelLabels).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDistrict} onValueChange={handleDistrictChange}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Districts" /></SelectTrigger>
            <SelectContent className="max-h-60 bg-background">
              <SelectItem value="all">All Districts</SelectItem>
              {UGANDA_DISTRICTS.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(level === "sub_county" || level === "parish" || level === "village") && (
            <Select value={filterSubCounty} onValueChange={handleSubCountyChange} disabled={filterDistrict === "all"}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filterDistrict === "all" ? "Select district first" : "All Sub-counties"} />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-background">
                <SelectItem value="all">All Sub-counties</SelectItem>
                {subCounties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(level === "parish" || level === "village") && (
            <Select value={filterParish} onValueChange={setFilterParish} disabled={filterSubCounty === "all"}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={filterSubCounty === "all" ? "Select sub-county first" : "All Parishes"} />
              </SelectTrigger>
              <SelectContent className="max-h-60 bg-background">
                <SelectItem value="all">All Parishes</SelectItem>
                {parishes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={14} />
          <span>
            <strong className="text-foreground">{filteredApps.length}</strong> students across{" "}
            <strong className="text-foreground">{locationCounts.length}</strong> {levelLabels[level].toLowerCase()}
            {locationCounts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Results */}
        {locationCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No location data available for this filter.</p>
        ) : (
          <div className="grid gap-2 max-h-[320px] overflow-y-auto pr-1">
            {locationCounts.map(({ id, name, count }) => (
              <div
                key={id}
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
