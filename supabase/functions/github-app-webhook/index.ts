// GitHub App webhook: receive installation / installation_repositories events.
// Set GITHUB_WEBHOOK_SECRET in Supabase secrets (App's webhook secret).
// Supabase env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  return bufferToHex(sig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const secret = Deno.env.get("GITHUB_WEBHOOK_SECRET");
  if (!secret) {
    return new Response(
      JSON.stringify({ error: "GITHUB_WEBHOOK_SECRET not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const bodyText = await req.text();
  const sigHeader = req.headers.get("x-hub-signature-256") ?? "";
  if (!sigHeader.startsWith("sha256=")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid X-Hub-Signature-256" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const expectedSig = "sha256=" + (await hmacSha256Hex(secret, bodyText));
  if (!timingSafeEqual(expectedSig, sigHeader)) {
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let payload: { action?: string; installation?: { id: number; account?: { login?: string; id?: number }; target_type?: string }; repositories?: unknown[] };
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
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
  const event = req.headers.get("x-github-event") ?? "";

  if (event === "installation") {
    const inst = payload.installation;
    if (!inst?.id) {
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (payload.action === "created" || payload.action === "deleted") {
      if (payload.action === "created") {
        await supabase.from("github_app_installations").upsert(
          {
            installation_id: inst.id,
            account_login: inst.account?.login ?? null,
            account_id: inst.account?.id ?? null,
            target_type: inst.target_type ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "installation_id" }
        );
      } else {
        await supabase.from("github_app_installations").delete().eq("installation_id", inst.id);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
