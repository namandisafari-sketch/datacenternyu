import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UGANDA_DISTRICTS } from "@/data/ugandaDistricts";

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
  const [subCounties, setSubCounties] = useState<LocationOption[]>([]);
  const [parishes, setParishes] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);

  // Internal IDs for cascading lookups
  const [districtId, setDistrictId] = useState("");
  const [subCountyId, setSubCountyId] = useState("");
  const [parishId, setParishId] = useState("");

  // Load sub-counties when district changes
  useEffect(() => {
    if (!districtId) {
      setSubCounties([]);
      return;
    }
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "subcounty")
      .eq("parent_id", districtId)
      .order("name")
      .then(({ data }) => setSubCounties((data as LocationOption[]) || []));
  }, [districtId]);

  // Load parishes when sub-county changes
  useEffect(() => {
    if (!subCountyId) {
      setParishes([]);
      return;
    }
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "parish")
      .eq("parent_id", subCountyId)
      .order("name")
      .then(({ data }) => setParishes((data as LocationOption[]) || []));
  }, [subCountyId]);

  // Load villages when parish changes
  useEffect(() => {
    if (!parishId) {
      setVillages([]);
      return;
    }
    supabase
      .from("uganda_locations")
      .select("id, name")
      .eq("level", "village")
      .eq("parent_id", parishId)
      .order("name")
      .then(({ data }) => setVillages((data as LocationOption[]) || []));
  }, [parishId]);

  const handleDistrictChange = useCallback(
    (id: string) => {
      setDistrictId(id);
      setSubCountyId("");
      setParishId("");
      const found = UGANDA_DISTRICTS.find((d) => d.id === id);
      onDistrictChange(found?.name || id);
      onSubCountyChange("");
      onParishChange("");
      onVillageChange("");
    },
    [onDistrictChange, onSubCountyChange, onParishChange, onVillageChange]
  );

  const handleSubCountyChange = useCallback(
    (id: string) => {
      setSubCountyId(id);
      setParishId("");
      const found = subCounties.find((sc) => sc.id === id);
      onSubCountyChange(found?.name || id);
      onParishChange("");
      onVillageChange("");
    },
    [subCounties, onSubCountyChange, onParishChange, onVillageChange]
  );

  const handleParishChange = useCallback(
    (id: string) => {
      setParishId(id);
      const found = parishes.find((p) => p.id === id);
      onParishChange(found?.name || id);
      onVillageChange("");
    },
    [parishes, onParishChange, onVillageChange]
  );

  const handleVillageChange = useCallback(
    (id: string) => {
      const found = villages.find((v) => v.id === id);
      onVillageChange(found?.name || id);
    },
    [villages, onVillageChange]
  );

  // Resolve the current district name to an ID for the select value
  const currentDistrictId = districtId || UGANDA_DISTRICTS.find((d) => d.name === district)?.id || "";
  const currentSubCountyId = subCountyId || subCounties.find((sc) => sc.name === subCounty)?.id || "";
  const currentParishId = parishId || parishes.find((p) => p.name === parish)?.id || "";
  const currentVillageId = villages.find((v) => v.name === village)?.id || "";

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>District *</Label>
        <Select value={currentDistrictId} onValueChange={handleDistrictChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select district..." />
          </SelectTrigger>
          <SelectContent className="max-h-60 bg-background">
            {UGANDA_DISTRICTS.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sub-county</Label>
        <Select value={currentSubCountyId} onValueChange={handleSubCountyChange} disabled={!currentDistrictId}>
          <SelectTrigger>
            <SelectValue placeholder={currentDistrictId ? "Select sub-county..." : "Select district first"} />
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
        <Select value={currentParishId} onValueChange={handleParishChange} disabled={!currentSubCountyId}>
          <SelectTrigger>
            <SelectValue placeholder={currentSubCountyId ? "Select parish..." : "Select sub-county first"} />
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
        <Select value={currentVillageId} onValueChange={handleVillageChange} disabled={!currentParishId}>
          <SelectTrigger>
            <SelectValue placeholder={currentParishId ? "Select village..." : "Select parish first"} />
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
