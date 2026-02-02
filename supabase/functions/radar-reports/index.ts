// Radar Pro: list persisted reports for an upload token
// GET ?token=<uuid> or header X-Upload-Token / Authorization: Bearer <uuid>
// Returns: { reports: [{ id, name, created_at, outdated_count, vuln_count }] }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function summary(payload: { outdated?: unknown[]; vulnerabilities?: { items?: unknown[] } }) {
  const outdated = Array.isArray(payload?.outdated) ? payload.outdated.length : 0;
  const vulns = payload?.vulnerabilities?.items != null ? (payload.vulnerabilities.items as unknown[]).length : 0;
  return { outdated_count: outdated, vuln_count: vulns };
}

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

  const token =
    req.headers.get("x-upload-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    new URL(req.url).searchParams.get("token");
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Missing token (query ?token= or header X-Upload-Token)" }),
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
  const { data: rows, error } = await supabase
    .from("radar_reports")
    .select("id, name, created_at, payload")
    .eq("upload_token", token)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const reports = (rows ?? []).map((r: { id: string; name: string | null; created_at: string; payload: unknown }) => ({
    id: r.id,
    name: r.name ?? null,
    created_at: r.created_at,
    ...summary(r.payload as { outdated?: unknown[]; vulnerabilities?: { items?: unknown[] } }),
  }));

  return new Response(
    JSON.stringify({ reports }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
