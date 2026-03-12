import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { school_id, term, year, reporter_name, reporter_phone, students } = await req.json();

    if (!school_id || !term || !reporter_name || !reporter_phone || !students?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch approved applications for matching
    const { data: applications } = await supabase
      .from("applications")
      .select("id, student_name, registration_number, class_grade, school_id, fees_per_term")
      .eq("status", "approved");

    // Fetch school fee info
    const { data: schoolData } = await supabase
      .from("schools")
      .select("parent_pays, full_fees, name")
      .eq("id", school_id)
      .single();

    const expectedFees = schoolData?.parent_pays || schoolData?.full_fees || 0;

    const attendanceRows: any[] = [];
    const newApplicationRows: any[] = [];
    const results: any[] = [];

    // System user ID for school-submitted students (no real user account)
    const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

    for (const student of students) {
      const name = (student.name || "").trim();
      if (!name) continue;

      const normalizedName = name.toLowerCase();
      const feesNum = parseFloat(student.fees_currently_paying) || 0;

      // Match against existing applications
      const match = (applications || []).find((app) => {
        const appName = (app.student_name || "").trim().toLowerCase();
        return appName === normalizedName || appName.includes(normalizedName) || normalizedName.includes(appName);
      });

      const matchStatus = match ? "matched" : "no_details";

      attendanceRows.push({
        school_id,
        student_name: name,
        class_grade: student.class_grade || "",
        registration_number: match?.registration_number || "",
        application_id: match?.id || null,
        match_status: matchStatus,
        term,
        year,
        reporter_name,
        reporter_phone,
        fees_currently_paying: feesNum,
      });

      // If no match, create a new application record so admin can update later
      let newAppId: string | null = null;
      if (!match) {
        const regNum = `ATT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        newApplicationRows.push({
          student_name: name,
          class_grade: student.class_grade || "",
          school_id,
          user_id: SYSTEM_USER_ID,
          status: "pending",
          education_level: "primary",
          parent_name: reporter_name,
          parent_phone: reporter_phone,
          fees_per_term: feesNum,
          registration_number: regNum,
          current_school: schoolData?.name || "",
          admin_notes: `Auto-created from school attendance report (${term} ${year}). Reporter: ${reporter_name} (${reporter_phone}). Needs admin review and data entry.`,
        });
        newAppId = regNum; // we'll use reg number as reference
      }

      results.push({
        student_name: name,
        class_grade: student.class_grade || "",
        match_status: matchStatus,
        registration_number: match?.registration_number || newAppId || "",
        fees_currently_paying: feesNum,
        expected_fees: match ? (match.fees_per_term || expectedFees) : expectedFees,
        existing_details: match ? {
          registration_number: match.registration_number,
          class_grade: match.class_grade,
          school_id: match.school_id,
        } : null,
        is_new: !match,
      });
    }

    // Insert attendance reports
    const { error: attError } = await supabase.from("school_attendance_reports").insert(attendanceRows);
    if (attError) throw attError;

    // Insert new application records for unmatched students
    if (newApplicationRows.length > 0) {
      const { error: appError } = await supabase.from("applications").insert(newApplicationRows);
      if (appError) {
        console.error("Failed to create application records:", appError);
        // Don't fail the whole request - attendance was recorded
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      total: results.length,
      matched: results.filter((r: any) => r.match_status === "matched").length,
      new_students: newApplicationRows.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
