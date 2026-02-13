import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DATA_BASE_URL =
  "https://raw.githubusercontent.com/kusaasira/uganda-geo-data/main/src/Uganda/Data";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if data already imported
    const { count } = await supabase
      .from("uganda_locations")
      .select("*", { count: "exact", head: true });

    if (count && count > 0) {
      return new Response(
        JSON.stringify({ success: true, message: `Already imported ${count} locations` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching Uganda geo data...");

    // Fetch all data files in parallel
    const [districtsRes, countiesRes, subCountiesRes, parishesRes, villagesRes] =
      await Promise.all([
        fetch(`${DATA_BASE_URL}/districts.json`),
        fetch(`${DATA_BASE_URL}/counties.json`),
        fetch(`${DATA_BASE_URL}/sub_counties.json`),
        fetch(`${DATA_BASE_URL}/parishes.json`),
        fetch(`${DATA_BASE_URL}/villages.json`),
      ]);

    const districts = await districtsRes.json();
    const counties = await countiesRes.json();
    const subCounties = await subCountiesRes.json();
    const parishes = await parishesRes.json();
    const villages = await villagesRes.json();

    console.log(
      `Data fetched: ${districts.length} districts, ${counties.length} counties, ${subCounties.length} sub-counties, ${parishes.length} parishes, ${villages.length} villages`
    );

    // Build county→district mapping
    const countyToDistrict: Record<string, string> = {};
    for (const c of counties) {
      countyToDistrict[c.id] = c.district;
    }

    // Insert districts (prefix IDs to avoid collisions across levels)
    const districtRows = districts.map((d: any) => ({
      id: `d_${d.id}`,
      name: d.name,
      level: "district",
      parent_id: null,
    }));

    // Insert in batches
    const batchInsert = async (rows: any[], label: string) => {
      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const { error } = await supabase.from("uganda_locations").insert(batch);
        if (error) {
          console.error(`Error inserting ${label} batch ${i}:`, error.message);
          throw error;
        }
      }
      console.log(`Inserted ${rows.length} ${label}`);
    };

    await batchInsert(districtRows, "districts");

    // Sub-counties: parent is district (through county)
    const subcountyRows = subCounties.map((sc: any) => ({
      id: `sc_${sc.id}`,
      name: sc.name,
      level: "subcounty",
      parent_id: `d_${countyToDistrict[sc.county] || sc.county}`,
    }));
    await batchInsert(subcountyRows, "sub-counties");

    // Parishes: parent is sub-county
    const parishRows = parishes.map((p: any) => ({
      id: `p_${p.id}`,
      name: p.name,
      level: "parish",
      parent_id: `sc_${p.subcounty}`,
    }));
    await batchInsert(parishRows, "parishes");

    // Villages: parent is parish
    const villageRows = villages.map((v: any) => ({
      id: `v_${v.id}`,
      name: v.name,
      level: "village",
      parent_id: `p_${v.parish}`,
    }));
    await batchInsert(villageRows, "villages");

    const total =
      districtRows.length +
      subcountyRows.length +
      parishRows.length +
      villageRows.length;

    return new Response(
      JSON.stringify({ success: true, message: `Imported ${total} locations` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
