import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationSelectorProps {
  district: string;
  subCounty: string;
  parish: string;
  village: string;
  onDistrictChange: (value: string) => void;
  onSubCountyChange: (value: string) => void;
  onParishChange: (value: string) => void;
  onVillageChange: (value: string) => void;
}

interface LocationOption {
  id: string;
  name: string;
}

const LocationSelector = ({
  district,
  subCounty,
  parish,
  village,
  onDistrictChange,
  onSubCountyChange,
  onParishChange,
  onVillageChange,
}: LocationSelectorProps) => {
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [subCounties, setSubCounties] = useState<LocationOption[]>([]);
  const [parishes, setParishes] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Load districts on mount
  useEffect(() => {
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "district")
      .order("name")
      .then(({ data }) => {
        setDistricts((data as LocationOption[]) || []);
        setLoading(false);
      });
  }, []);

  // Load sub-counties when district changes
  useEffect(() => {
    if (!district) {
      setSubCounties([]);
      return;
    }
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "subcounty")
      .eq("parent_id", district)
      .order("name")
      .then(({ data }) => setSubCounties((data as LocationOption[]) || []));
  }, [district]);

  // Load parishes when sub-county changes
  useEffect(() => {
    if (!subCounty) {
      setParishes([]);
      return;
    }
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "parish")
      .eq("parent_id", subCounty)
      .order("name")
      .then(({ data }) => setParishes((data as LocationOption[]) || []));
  }, [subCounty]);

  // Load villages when parish changes
  useEffect(() => {
    if (!parish) {
      setVillages([]);
      return;
    }
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "village")
      .eq("parent_id", parish)
      .order("name")
      .then(({ data }) => setVillages((data as LocationOption[]) || []));
  }, [parish]);

  const handleDistrictChange = useCallback(
    (val: string) => {
      onDistrictChange(val);
      onSubCountyChange("");
      onParishChange("");
      onVillageChange("");
    },
    [onDistrictChange, onSubCountyChange, onParishChange, onVillageChange]
  );

  const handleSubCountyChange = useCallback(
    (val: string) => {
      onSubCountyChange(val);
      onParishChange("");
      onVillageChange("");
    },
    [onSubCountyChange, onParishChange, onVillageChange]
  );

  const handleParishChange = useCallback(
    (val: string) => {
      onParishChange(val);
      onVillageChange("");
    },
    [onParishChange, onVillageChange]
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading locations...</p>;
  }

  if (districts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Location data not yet imported. Please contact an administrator.
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>District *</Label>
        <Select value={district} onValueChange={handleDistrictChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select district..." />
          </SelectTrigger>
          <SelectContent className="max-h-60 bg-background">
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sub-county</Label>
        <Select value={subCounty} onValueChange={handleSubCountyChange} disabled={!district}>
          <SelectTrigger>
            <SelectValue placeholder={district ? "Select sub-county..." : "Select district first"} />
          </SelectTrigger>
          <SelectContent className="max-h-60 bg-background">
            {subCounties.map((sc) => (
              <SelectItem key={sc.id} value={sc.id}>
                {sc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Parish</Label>
        <Select value={parish} onValueChange={handleParishChange} disabled={!subCounty}>
          <SelectTrigger>
            <SelectValue placeholder={subCounty ? "Select parish..." : "Select sub-county first"} />
          </SelectTrigger>
          <SelectContent className="max-h-60 bg-background">
            {parishes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Village</Label>
        <Select value={village} onValueChange={onVillageChange} disabled={!parish}>
          <SelectTrigger>
            <SelectValue placeholder={parish ? "Select village..." : "Select parish first"} />
          </SelectTrigger>
          <SelectContent className="max-h-60 bg-background">
            {villages.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LocationSelector;
