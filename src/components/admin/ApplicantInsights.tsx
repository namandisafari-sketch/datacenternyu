import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users, Heart, HeartPulse, Eye, Link2, MapPin, GraduationCap,
} from "lucide-react";
import type { FullApplication } from "./ApplicationFullDetail";

interface Props {
  applications: FullApplication[];
}

const ApplicantInsights = ({ applications }: Props) => {
  const total = applications.length;
  if (total === 0) return null;

  // Orphan stats
  const orphans = applications.filter((a) => a.orphan_status === "yes");
  const orphanFather = orphans.filter((a) => a.deceased_parent === "father").length;
  const orphanMother = orphans.filter((a) => a.deceased_parent === "mother").length;
  const orphanBoth = orphans.filter((a) => a.deceased_parent === "both").length;

  // Health
  const withPhysicalDefect = applications.filter((a) => a.physical_defect).length;
  const withChronicDisease = applications.filter((a) => a.chronic_disease).length;

  // Gender
  const males = applications.filter((a) => a.gender?.toLowerCase() === "male").length;
  const females = applications.filter((a) => a.gender?.toLowerCase() === "female").length;

  // Blood relations: group by parent phone or parent names (father+mother)
  const familyGroups: Record<string, FullApplication[]> = {};
  applications.forEach((a) => {
    // Use parent_phone as family key (most reliable), fallback to parent_name
    const key = a.parent_phone?.replace(/\s/g, "") || a.parent_name?.toLowerCase().trim();
    if (key) {
      if (!familyGroups[key]) familyGroups[key] = [];
      familyGroups[key].push(a);
    }
  });
  const relatedFamilies = Object.entries(familyGroups)
    .filter(([, members]) => members.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  const totalRelated = relatedFamilies.reduce((s, [, m]) => s + m.length, 0);

  // Top districts
  const districtCounts: Record<string, number> = {};
  applications.forEach((a) => {
    if (a.district) districtCounts[a.district] = (districtCounts[a.district] || 0) + 1;
  });
  const topDistricts = Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Education level breakdown
  const levelLabels: Record<string, string> = {
    nursery: "Nursery", primary: "Primary", secondary_o: "O-Level", secondary_a: "A-Level", vocational: "Vocational", university: "University",
  };
  const levelCounts: Record<string, number> = {};
  applications.forEach((a) => {
    levelCounts[a.education_level] = (levelCounts[a.education_level] || 0) + 1;
  });

  const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(0)}%` : "0%";

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Eye size={18} className="text-primary" /> Applicant Insights
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <Users size={20} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <Heart size={20} className="mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold text-foreground">{orphans.length}</p>
            <p className="text-xs text-muted-foreground">Orphans ({pct(orphans.length)})</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <HeartPulse size={20} className="mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold text-foreground">{withChronicDisease}</p>
            <p className="text-xs text-muted-foreground">Chronic Disease</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <Eye size={20} className="mx-auto text-accent mb-1" />
            <p className="text-lg font-bold text-foreground">{withPhysicalDefect}</p>
            <p className="text-xs text-muted-foreground">Physical Defect</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <Link2 size={20} className="mx-auto text-secondary mb-1" />
            <p className="text-lg font-bold text-foreground">{totalRelated}</p>
            <p className="text-xs text-muted-foreground">Related by Blood</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <Users size={20} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{males}M / {females}F</p>
            <p className="text-xs text-muted-foreground">Gender Split</p>
          </CardContent>
        </Card>
      </div>

      {/* Orphan breakdown */}
      {orphans.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Orphan Breakdown</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Father deceased: {orphanFather}</Badge>
              <Badge variant="outline">Mother deceased: {orphanMother}</Badge>
              <Badge variant="destructive">Both deceased: {orphanBoth}</Badge>
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Orphan students:</p>
              <div className="flex flex-wrap gap-1">
                {orphans.map((a) => (
                  <Badge key={a.id} variant="secondary" className="text-xs">
                    {a.student_name} ({a.deceased_parent || "unspecified"})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blood relations */}
      {relatedFamilies.length > 0 && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Link2 size={14} /> Related by Blood ({relatedFamilies.length} famil{relatedFamilies.length === 1 ? "y" : "ies"})
            </p>
            <div className="space-y-2">
              {relatedFamilies.map(([key, members]) => (
                <div key={key} className="p-2 bg-muted/30 rounded-md">
                  <p className="text-xs font-medium text-foreground mb-1">
                    Parent: {members[0].parent_name} • {members[0].parent_phone}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {members.map((m) => (
                      <Badge key={m.id} variant="outline" className="text-xs">
                        {m.student_name} — {levelLabels[m.education_level] || m.education_level}
                        {m.class_grade ? ` (${m.class_grade})` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education & District */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <GraduationCap size={14} /> Education Level
            </p>
            <div className="space-y-1">
              {Object.entries(levelCounts).sort((a, b) => b[1] - a[1]).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between text-sm">
                  <span>{levelLabels[level] || level}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <MapPin size={14} /> Top Districts
            </p>
            <div className="space-y-1">
              {topDistricts.map(([district, count]) => (
                <div key={district} className="flex items-center justify-between text-sm">
                  <span>{district}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicantInsights;
