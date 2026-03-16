import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Haversine formula to calculate distance between two GPS points
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from JWT
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, lat, lng, accuracy, device_fingerprint } = await req.json();

    if (!action || !lat || !lng) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: action, lat, lng" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get office location from settings
    const { data: setting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "office_location")
      .single();

    if (!setting) {
      return new Response(
        JSON.stringify({ error: "Office location not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settingVal = setting.value as any;
    // Support multiple locations
    const officeLocations: { name: string; lat: number; lng: number; radius_meters: number }[] =
      Array.isArray(settingVal.locations) && settingVal.locations.length > 0
        ? settingVal.locations
        : [{ name: settingVal.name || "Office", lat: settingVal.lat, lng: settingVal.lng, radius_meters: settingVal.radius_meters }];

    // Find closest office
    let closestDistance = Infinity;
    let closestOffice = officeLocations[0];
    for (const office of officeLocations) {
      const d = haversineDistance(lat, lng, office.lat, office.lng);
      if (d < closestDistance) {
        closestDistance = d;
        closestOffice = office;
      }
    }
    const distance = closestDistance;
    const withinRadius = distance <= closestOffice.radius_meters;

    // Reject if GPS accuracy is too poor (> 100m)
    if (accuracy && accuracy > 100) {
      return new Response(
        JSON.stringify({ 
          error: "GPS signal too weak. Please move to an open area and try again.",
          distance: Math.round(distance),
          accuracy: Math.round(accuracy),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!withinRadius) {
      return new Response(
        JSON.stringify({
          error: `You are ${Math.round(distance)}m from ${closestOffice.name || "the office"}. You must be within ${closestOffice.radius_meters}m to ${action === "check_in" ? "check in" : "check out"}.`,
          distance: Math.round(distance),
          radius: closestOffice.radius_meters,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    if (action === "check_in") {
      // Check if already checked in today
      const { data: existing } = await supabaseAdmin
        .from("attendance_records")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "You have already checked in today.", record: existing }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: record, error: insertError } = await supabaseAdmin
        .from("attendance_records")
        .insert({
          user_id: user.id,
          date: today,
          check_in_at: new Date().toISOString(),
          check_in_lat: lat,
          check_in_lng: lng,
          check_in_accuracy: accuracy || null,
          check_in_distance: Math.round(distance),
          device_fingerprint: device_fingerprint || "",
          status: "checked_in",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, action: "check_in", record, distance: Math.round(distance) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_out") {
      const { data: existing } = await supabaseAdmin
        .from("attendance_records")
        .select("id, status, check_in_at")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (!existing || existing.status !== "checked_in") {
        return new Response(
          JSON.stringify({ error: "You haven't checked in today or already checked out." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: record, error: updateError } = await supabaseAdmin
        .from("attendance_records")
        .update({
          check_out_at: new Date().toISOString(),
          check_out_lat: lat,
          check_out_lng: lng,
          check_out_accuracy: accuracy || null,
          check_out_distance: Math.round(distance),
          status: "checked_out",
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, action: "check_out", record, distance: Math.round(distance) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'check_in' or 'check_out'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
