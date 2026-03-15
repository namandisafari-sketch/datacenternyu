import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

// Tables that reference auth.users and should remap user_id to the importing admin
const USER_FK_TABLES = ["profiles", "user_roles", "app_settings", "staff_profiles", "attendance_records", "trusted_devices", "webauthn_credentials"];

// Columns to strip from user_id remapping (updated_by references)
const UPDATED_BY_TABLES = ["app_settings"];

async function getTableColumns(adminClient: any, tableName: string): Promise<Set<string>> {
  // Query a single row with limit 0 to discover columns via the schema cache
  // We'll use information_schema instead
  const { data, error } = await adminClient.rpc("execute_readonly_query", {
    query_text: `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${tableName.replace(/'/g, "''")}'`,
  });
  
  if (error || !data) return new Set();
  return new Set((data as any[]).map((r: any) => r.column_name));
}

function stripUnknownColumns(rows: any[], validColumns: Set<string>): any[] {
  return rows.map((row) => {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(row)) {
      if (validColumns.has(key)) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  });
}

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

    // Cache table columns to avoid repeated queries
    const columnCache: Record<string, Set<string>> = {};

    // Process tables in dependency order
    const tablesToImport = IMPORT_ORDER.filter((t) => backupData[t] && backupData[t].length > 0);

    for (const table of tablesToImport) {
      let rows = backupData[table];
      results[table] = { inserted: 0, skipped: 0, errors: [] };

      if (!rows || rows.length === 0) continue;

      // Get valid columns for this table
      if (!columnCache[table]) {
        columnCache[table] = await getTableColumns(adminClient, table);
      }
      const validColumns = columnCache[table];

      if (validColumns.size === 0) {
        results[table].errors.push("Could not determine table schema");
        continue;
      }

      // Strip unknown columns from backup data
      rows = stripUnknownColumns(rows, validColumns);

      // For tables with user_id FK to auth.users, remap to current admin user
      // Skip profiles/user_roles/webauthn_credentials since those are user-specific
      if (table === "profiles" || table === "user_roles" || table === "webauthn_credentials") {
        // These tables are tightly coupled to auth.users - skip them on cross-project import
        results[table].skipped = rows.length;
        results[table].errors.push("Skipped: user-specific data cannot be imported across projects");
        continue;
      }

      // For tables referencing user_id, remap to importing admin
      if (table === "applications") {
        rows = rows.map((r: any) => ({
          ...r,
          user_id: user.id,
          reviewed_by: r.reviewed_by ? user.id : null,
        }));
      }

      if (table === "app_settings") {
        rows = rows.map((r: any) => ({
          ...r,
          updated_by: user.id,
        }));
      }

      if (table === "staff_profiles" || table === "attendance_records") {
        rows = rows.map((r: any) => ({
          ...r,
          user_id: user.id,
        }));
      }

      if (table === "trusted_devices") {
        rows = rows.map((r: any) => ({
          ...r,
          user_id: user.id,
        }));
      }

      // For tables with recorded_by, remap
      const recordedByTables = ["expenses", "parent_payments", "accounting_transactions", "petty_cash", "material_distributions"];
      if (recordedByTables.includes(table)) {
        rows = rows.map((r: any) => ({
          ...r,
          ...(r.recorded_by ? { recorded_by: user.id } : {}),
          ...(r.distributed_by ? { distributed_by: user.id } : {}),
        }));
      }

      if (table === "appointments" || table === "bursary_request_links" || table === "budget_allocations") {
        rows = rows.map((r: any) => ({
          ...r,
          ...(r.created_by ? { created_by: user.id } : {}),
        }));
      }

      if (table === "audit_logs" || table === "access_logs") {
        rows = rows.map((r: any) => ({
          ...r,
          ...(r.user_id ? { user_id: user.id } : {}),
        }));
      }

      if (table === "student_claims" || table === "lawyer_form_submissions") {
        rows = rows.map((r: any) => ({
          ...r,
          ...(r.created_by ? { created_by: user.id } : {}),
          ...(r.user_id ? { user_id: user.id } : {}),
        }));
      }

      if (table === "payment_codes") {
        rows = rows.map((r: any) => ({
          ...r,
          ...(r.created_by ? { created_by: user.id } : {}),
          ...(r.used_by ? { used_by: user.id } : {}),
        }));
      }

      if (table === "school_users") {
        rows = rows.map((r: any) => ({
          ...r,
          user_id: user.id,
        }));
      }

      // Insert in batches of 500, upsert to handle existing records
      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { data: inserted, error } = await adminClient
          .from(table)
          .upsert(batch, { onConflict: "id", ignoreDuplicates: true })
          .select("id");
        if (error) {
          console.error(`Import error for ${table}:`, error.message);
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
    console.error("Import error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
