import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TABLES = [
  "applications",
  "schools",
  "expenses",
  "parent_payments",
  "payment_codes",
  "accounting_transactions",
  "budget_allocations",
  "petty_cash",
  "material_categories",
  "material_distributions",
  "appointments",
  "bursary_request_links",
  "bursary_requests",
  "student_claims",
  "report_cards",
  "lawyer_form_templates",
  "lawyer_form_submissions",
  "staff_profiles",
  "attendance_records",
  "audit_logs",
  "access_logs",
  "profiles",
  "user_roles",
  "app_settings",
  "lost_id_reports",
  "school_users",
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

    // Verify user is admin
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

    // Parse request for optional table selection
    let selectedTables = TABLES;
    try {
      const body = await req.json();
      if (body.tables && Array.isArray(body.tables) && body.tables.length > 0) {
        selectedTables = body.tables.filter((t: string) => TABLES.includes(t));
      }
    } catch {
      // No body or invalid JSON, use all tables
    }

    const backup: Record<string, unknown[]> = {};
    const stats: Record<string, number> = {};

    for (const table of selectedTables) {
      let allRows: unknown[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await adminClient
          .from(table)
          .select("*")
          .range(from, from + pageSize - 1);

        if (error) {
          console.error(`Error fetching ${table}:`, error.message);
          backup[table] = allRows;
          stats[table] = allRows.length;
          break;
        }

        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      backup[table] = allRows;
      stats[table] = allRows.length;
    }

    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        exported_by: user.email,
        version: "1.0",
        tables: selectedTables,
        row_counts: stats,
        total_rows: Object.values(stats).reduce((a, b) => a + b, 0),
      },
      data: backup,
    };

    return new Response(JSON.stringify(exportData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
