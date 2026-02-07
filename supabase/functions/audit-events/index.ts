// Platform audit endpoint: receive events from CLI when UPSHIFT_AUDIT_URL points here.
// POST body: { event_type, resource_type, resource_id?, metadata?, org_id?, timestamp }
// Optional: Authorization: Bearer <UPSHIFT_API_TOKEN> (platform may validate later)
// Supabase env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type AuditPayload = {
  event_type: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  org_id?: string;
  timestamp?: string;
};

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

  let payload: AuditPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!payload.event_type || !payload.resource_type) {
    return new Response(
      JSON.stringify({ error: "Missing event_type or resource_type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
  const { error } = await supabase.from("audit_logs").insert({
    org_id: payload.org_id ?? null,
    user_id: null,
    event_type: payload.event_type,
    resource_type: payload.resource_type,
    resource_id: payload.resource_id ?? null,
    metadata: payload.metadata ?? null,
    ip: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
    action: payload.event_type, // some DBs have action column; use event_type
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
