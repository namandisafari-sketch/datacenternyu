import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credential_id } = await req.json();

    if (!credential_id) {
      return new Response(
        JSON.stringify({ error: "Missing credential_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the credential to find the user
    const { data: credential, error: credError } = await supabase
      .from("webauthn_credentials")
      .select("user_id, credential_id")
      .eq("credential_id", credential_id)
      .maybeSingle();

    if (credError || !credential) {
      return new Response(
        JSON.stringify({ error: "Passkey not recognized. Please register first or use email sign-in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update last_used_at
    await supabase
      .from("webauthn_credentials")
      .update({ last_used_at: new Date().toISOString() })
      .eq("credential_id", credential_id);

    // Get user email from auth.users via profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", credential.user_id)
      .maybeSingle();

    // Generate a magic link token for this user (sign them in without password)
    // We use admin.generateLink to create a one-time sign-in
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: profile?.email || "",
      options: {
        redirectTo: `${req.headers.get("origin") || supabaseUrl}/dashboard`,
      },
    });

    if (linkError || !linkData) {
      console.error("Magic link error:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to create login session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the token from the generated link
    const actionLink = linkData.properties?.action_link || "";
    // Parse token from the action link URL
    const url = new URL(actionLink);
    const hashed_token = linkData.properties?.hashed_token;

    // Use verifyOtp with the hashed token to get a session
    const { data: session, error: sessionError } = await supabase.auth.admin.getUserById(credential.user_id);

    if (sessionError) {
      return new Response(
        JSON.stringify({ error: "Failed to verify user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        user_id: credential.user_id,
        email: profile?.email,
        full_name: profile?.full_name,
        action_link: actionLink,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Passkey login error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
