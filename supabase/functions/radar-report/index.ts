// Radar Pro: get one report payload by id (same token required)
// GET ?id=<uuid>&token=<uuid> or path /radar-report?id= and header X-Upload-Token

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token =
    req.headers.get("x-upload-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    url.searchParams.get("token");

  if (!id || !token) {
    return new Response(
      JSON.stringify({ error: "Missing id and token (query ?id= &token= or header X-Upload-Token)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !key) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, key);
  const { data, error } = await supabase
    .from("radar_reports")
    .select("id, name, created_at, payload")
    .eq("id", id)
    .eq("upload_token", token)
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: error?.message ?? "Not found" }),
      { status: error?.code === "PGRST116" ? 404 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ report: data.payload, id: data.id, name: data.name, created_at: data.created_at }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
