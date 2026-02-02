// Radar Pro: upload scan report from CLI/CI
// POST body: { report: object, name?: string }
// Header: X-Upload-Token: <uuid> or Authorization: Bearer <uuid>
// Supabase env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const token =
    req.headers.get("x-upload-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Missing X-Upload-Token or Authorization: Bearer <token>" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { report?: unknown; name?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const report = body.report ?? body;
  if (!report || typeof report !== "object") {
    return new Response(
      JSON.stringify({ error: "Body must include 'report' object (scan JSON)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const name = typeof body.name === "string" ? body.name : undefined;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(url, key);
  const payload = report as { outdated?: unknown[]; vulnerabilities?: { items?: unknown[] } };
  const outdatedCount = Array.isArray(payload?.outdated) ? payload.outdated.length : 0;
  const vulnCount = payload?.vulnerabilities?.items != null ? (payload.vulnerabilities.items as unknown[]).length : 0;

  const { data, error } = await supabase
    .from("radar_reports")
    .insert({ upload_token: token, payload: report, name })
    .select("id, created_at")
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Alerts: if settings exist and thresholds exceeded, POST to webhook
  const { data: settings } = await supabase
    .from("radar_alert_settings")
    .select("webhook_url, max_outdated, max_vulns")
    .eq("upload_token", token)
    .single();

  if (settings?.webhook_url) {
    const maxOut = settings.max_outdated ?? 999999;
    const maxVuln = settings.max_vulns ?? 999999;
    if (outdatedCount > maxOut || vulnCount > maxVuln) {
      try {
        await fetch(settings.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "radar_alert",
            report_id: data.id,
            upload_token: token,
            outdated_count: outdatedCount,
            vuln_count: vulnCount,
            max_outdated: maxOut,
            max_vulns: maxVuln,
            created_at: data.created_at,
          }),
        });
      } catch {
        // best-effort; don't fail the upload
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, id: data.id, created_at: data.created_at }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
