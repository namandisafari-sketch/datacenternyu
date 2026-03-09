import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, user_id, success, failure_reason, device_fingerprint } =
      await req.json();

    // Get IP from request headers
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const user_agent = req.headers.get("user-agent") || "unknown";

    // Log the access attempt
    await supabase.from("access_logs").insert({
      email: email || "",
      user_id: user_id || null,
      ip_address,
      user_agent,
      device_fingerprint: device_fingerprint || "",
      success: success || false,
      failure_reason: failure_reason || "",
    });

    // If login was successful, check/register trusted device
    let device_trusted = true;
    if (success && user_id && device_fingerprint) {
      // Look up existing device record
      const { data: existing, error: lookupError } = await supabase
        .from("trusted_devices")
        .select("id, is_active")
        .eq("user_id", user_id)
        .eq("device_fingerprint", device_fingerprint)
        .maybeSingle();

      if (lookupError) {
        console.error("Device lookup error:", lookupError.message);
        // On lookup error, default to trusted to avoid lockout
        device_trusted = true;
      } else if (!existing) {
        // Check if user has ANY trusted devices
        const { count } = await supabase
          .from("trusted_devices")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user_id);

        if (count === 0) {
          // First device — auto-trust it
          await supabase.from("trusted_devices").upsert(
            {
              user_id,
              device_fingerprint,
              device_name: user_agent.substring(0, 100),
              is_active: true,
              approved_by: user_id,
              last_used_at: new Date().toISOString(),
            },
            { onConflict: "user_id,device_fingerprint" }
          );
          device_trusted = true;
        } else {
          // New unrecognized device — register as inactive
          await supabase.from("trusted_devices").upsert(
            {
              user_id,
              device_fingerprint,
              device_name: user_agent.substring(0, 100),
              is_active: false,
            },
            { onConflict: "user_id,device_fingerprint" }
          );
          device_trusted = false;
        }
      } else {
        // Device exists — respect its current approval status
        device_trusted = existing.is_active;
        // Always update last_used_at timestamp
        await supabase
          .from("trusted_devices")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", existing.id);
      }
    }

    return new Response(
      JSON.stringify({ logged: true, device_trusted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
