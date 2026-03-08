import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Order matters for foreign key dependencies
const IMPORT_ORDER = [
  "app_settings",
  "profiles",
  "user_roles",
  "schools",
  "school_users",
  "applications",
  "expenses",
  "parent_payments",
  "payment_codes",
  "accounting_transactions",
  "budget_allocations",
  "petty_cash",
  "material_categories",
  "material_distributions",
  "bursary_request_links",
  "bursary_requests",
  "appointments",
  "student_claims",
  "report_cards",
  "lawyer_form_templates",
  "lawyer_form_submissions",
  "staff_profiles",
  "attendance_records",
  "audit_logs",
  "access_logs",
  "lost_id_reports",
  "trusted_devices",
  "webauthn_credentials",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    if (!body.data || !body.metadata) {
      return new Response(JSON.stringify({ error: "Invalid backup file format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: backupData, metadata } = body;
    const results: Record<string, { inserted: number; skipped: number; errors: string[] }> = {};

    // Process tables in dependency order
    const tablesToImport = IMPORT_ORDER.filter((t) => backupData[t] && backupData[t].length > 0);

    for (const table of tablesToImport) {
      const rows = backupData[table];
      results[table] = { inserted: 0, skipped: 0, errors: [] };

      if (!rows || rows.length === 0) continue;

      // Insert in batches of 500, skip existing records
      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { data: inserted, error } = await adminClient.from(table).upsert(batch, { onConflict: "id", ignoreDuplicates: true }).select("id");
        if (error) {
          results[table].errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          const insertedCount = inserted?.length || 0;
          results[table].inserted += insertedCount;
          results[table].skipped += batch.length - insertedCount;
        }
      }
    }

    const totalInserted = Object.values(results).reduce((a, b) => a + b.inserted, 0);
    const totalSkipped = Object.values(results).reduce((a, b) => a + b.skipped, 0);
    const totalErrors = Object.values(results).reduce((a, b) => a + b.errors.length, 0);

    return new Response(JSON.stringify({
      success: true,
      imported_at: new Date().toISOString(),
      imported_by: user.email,
      source_export: metadata.exported_at,
      total_inserted: totalInserted,
      total_skipped: totalSkipped,
      total_errors: totalErrors,
      details: results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
