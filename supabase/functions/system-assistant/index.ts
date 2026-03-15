import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Nyunga's Helper — the AI assistant for the Nyunga Foundation Bursary Management System. You help staff and admins understand and operate the system effectively.

You have tools available to take actions in the system. USE THEM when the user asks you to do something actionable.

## Navigation
When a user asks to "go to", "open", "show me", or "navigate to" any page, use the navigate_to_page tool immediately. Here are the available pages:
- Dashboard: /admin
- Applications: /admin/applications
- Students: /admin/students
- Schools: /admin/schools
- Payments: /admin/payments
- Payment History: /admin/payment-history
- Payments Dashboard: /admin/payments-dashboard
- Receipts: /admin/receipts
- ID Cards: /admin/id-cards
- Appointments: /admin/appointments
- Passport Photo: /admin/passport-photo
- Staff: /admin/staff
- Attendance: /admin/attendance
- Attendance Reports: /admin/attendance-reports
- Materials: /admin/materials
- Accounting: /admin/accounting
- Bursary Requests: /admin/bursary-requests
- Batch Processing: /admin/batch-processing
- Security: /admin/security
- Audit Logs: /admin/audit-logs
- Backup: /admin/backup
- Settings: /admin/settings
- Photocopying: /admin/photocopying
- Student Search: /admin/student-search
- Register New Application: /register

## Data Queries
When a user asks about counts, statistics, lists, or any data question, use the query_database tool to get real data. Examples:
- "How many students do we have?" → query applications table
- "How many schools?" → query schools table
- "Show me pending applications" → query applications with status filter
- "What's the total budget?" → query budget_allocations

## Database Tables Reference
- applications: student bursary applications (student_name, education_level, school_id, status [pending/approved/rejected], registration_number NYF-YY-XXXX)
- schools: partner schools (name, district, level, full_fees, nyunga_covered_fees, parent_pays, total_bursaries)
- profiles: user profiles (full_name, email)
- user_roles: role-based access (admin, staff, school, parent, etc.)
- staff_profiles: staff details (full_name, department, role_title, staff_number STF-XXXX)
- attendance_records: GPS check-in/out
- parent_payments: payment records
- payment_codes: unique payment codes
- appointments: scheduled meetings
- material_categories & material_distributions: scholastic materials
- accounting_transactions: financial records
- budget_allocations: budgets by category/term/year
- petty_cash: petty cash
- expenses: expense tracking
- bursary_requests: public bursary requests
- report_cards: student academic reports
- student_claims: issues about students
- app_settings: system config (admission_locked, skip_payment_code)

## Key Workflows
1. Application Process: Parent gets payment code → fills physical form → worker enters in system → admin reviews → approves/rejects
2. Payment Flow: Admin generates codes → parent pays → recorded → receipt generated
3. Staff Attendance: GPS check-in → verify location → record hours → reports
4. School Management: Schools registered with fees → slots allocated → students assigned

Always be helpful, concise, and action-oriented. If the user asks you to do something, DO IT using tools rather than just explaining how.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "navigate_to_page",
      description: "Navigate the user to a specific page in the system. Use this when a user asks to go to, open, or view a page.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The URL path to navigate to, e.g. /admin/students"
          },
          description: {
            type: "string",
            description: "Brief description of where you're navigating the user"
          }
        },
        required: ["path", "description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_database",
      description: "Query the database to get real data. Use this when a user asks about counts, statistics, lists, or any data question. Write a SELECT-only SQL query.",
      parameters: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description: "A read-only SELECT SQL query to execute against the database. NEVER use INSERT/UPDATE/DELETE/DROP/ALTER."
          },
          description: {
            type: "string",
            description: "Brief description of what this query does"
          }
        },
        required: ["sql", "description"],
        additionalProperties: false,
      },
    },
  },
];

async function executeQuery(sql: string): Promise<string> {
  // Strip trailing semicolons - the model often adds them
  const cleanSql = sql.trim().replace(/;+$/, '');
  const normalized = cleanSql.toUpperCase();
  if (!normalized.startsWith("SELECT")) {
    return JSON.stringify({ error: "Only SELECT queries are allowed" });
  }
  if (/\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b/.test(normalized)) {
    return JSON.stringify({ error: "Dangerous SQL keywords detected" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data, error } = await supabase.rpc("execute_readonly_query", { query_text: cleanSql });
    if (error) {
      console.error("Query error:", error.message, "SQL:", sql);
      return JSON.stringify({ error: error.message });
    }
    console.log("Query result for:", sql, "→", JSON.stringify(data));
    return JSON.stringify(data ?? []);
  } catch (e) {
    console.error("Query exception:", e);
    return JSON.stringify({ error: e instanceof Error ? e.message : "Query failed" });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First call: let the model decide if it needs tools
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools: TOOLS,
        stream: false,
      }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (firstResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please top up." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await firstResponse.text();
      console.error("AI gateway error:", firstResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstResult = await firstResponse.json();
    const choice = firstResult.choices?.[0];

    // Check if the model wants to call tools
    if (choice?.finish_reason === "tool_calls" || choice?.message?.tool_calls?.length) {
      const toolCalls = choice.message.tool_calls;
      const toolResults: any[] = [];
      const clientActions: any[] = [];

      for (const tc of toolCalls) {
        const args = JSON.parse(tc.function.arguments);

        if (tc.function.name === "navigate_to_page") {
          clientActions.push({ type: "navigate", path: args.path, description: args.description });
          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ success: true, navigated_to: args.path }),
          });
        } else if (tc.function.name === "query_database") {
          const result = await executeQuery(args.sql);
          toolResults.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }
      }

      // Second call: let model respond with tool results
      const secondResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
            choice.message,
            ...toolResults,
          ],
          stream: false,
        }),
      });

      if (!secondResponse.ok) {
        const errText = await secondResponse.text();
        console.error("AI second call error:", secondResponse.status, errText);
        return new Response(
          JSON.stringify({ error: "AI processing failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const secondResult = await secondResponse.json();
      const finalContent = secondResult.choices?.[0]?.message?.content || "Done!";

      return new Response(
        JSON.stringify({
          content: finalContent,
          actions: clientActions,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool calls - regular text response, stream it
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!streamResponse.ok) {
      const errText = await streamResponse.text();
      console.error("AI stream error:", streamResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
