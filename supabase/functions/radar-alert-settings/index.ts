// Radar Pro: get or update alert settings (webhook + thresholds) for an upload token
// GET/PUT; header X-Upload-Token or Authorization: Bearer <token>
// PUT body: { webhook_url?: string, max_outdated?: number, max_vulns?: number }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function getToken(req: Request): string | null {
  return (
    req.headers.get("x-upload-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    null
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = getToken(req);
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Missing X-Upload-Token or Authorization: Bearer <token>" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(url, key);

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("radar_alert_settings")
      .select("webhook_url, max_outdated, max_vulns, updated_at")
      .eq("upload_token", token)
      .single();

    if (error && error.code !== "PGRST116") {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        webhook_url: data?.webhook_url ?? null,
        max_outdated: data?.max_outdated ?? null,
        max_vulns: data?.max_vulns ?? null,
        updated_at: data?.updated_at ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method === "PUT") {
    let body: { webhook_url?: string; max_outdated?: number; max_vulns?: number } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const row: Record<string, unknown> = {
      upload_token: token,
      updated_at: new Date().toISOString(),
    };
    if (body.webhook_url !== undefined) row.webhook_url = body.webhook_url || null;
    if (body.max_outdated !== undefined) row.max_outdated = body.max_outdated;
    if (body.max_vulns !== undefined) row.max_vulns = body.max_vulns;

    const { data, error } = await supabase
      .from("radar_alert_settings")
      .upsert(row, { onConflict: "upload_token" })
      .select("webhook_url, max_outdated, max_vulns, updated_at")
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, webhook_url: data.webhook_url, max_outdated: data.max_outdated, max_vulns: data.max_vulns }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
