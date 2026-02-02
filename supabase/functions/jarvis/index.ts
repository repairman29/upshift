// JARVIS on the edge — Supabase Edge Function
// Call from site, blog workflow, or CLI to invoke JARVIS (e.g. add blog media, analyze, etc.)
// Set secrets in Supabase Dashboard → Edge Functions → jarvis → Secrets:
//   JARVIS_PLATFORM_API_URL = https://api.upshiftai.dev (or your platform URL)
//   UPSHIFTAI_SERVICE_KEY = optional service key for server-side calls

import { corsHeaders } from "../_shared/cors.ts";

const PLATFORM_URL =
  Deno.env.get("JARVIS_PLATFORM_API_URL") || "https://api.upshiftai.dev";

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

  try {
    const body = await req.json();
    const { task, apiKey, ...params } = body;

    if (!task) {
      return new Response(
        JSON.stringify({ error: "Missing 'task' in body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to platform API when a matching route exists
    const auth = apiKey
      ? { Authorization: `Bearer ${apiKey}` }
      : Deno.env.get("UPSHIFTAI_SERVICE_KEY")
        ? { Authorization: `Bearer ${Deno.env.get("UPSHIFTAI_SERVICE_KEY")}` }
        : {};

    switch (task) {
      case "track_usage": {
        const res = await fetch(`${PLATFORM_URL}/api/ai/track-usage`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...auth },
          body: JSON.stringify({ feature: params.feature || "jarvis", apiKey: apiKey || params.apiKey }),
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      default: {
        // Generic invoke: POST to platform /api/jarvis or similar when you add it
        const invokeUrl = `${PLATFORM_URL}/api/jarvis`;
        const res = await fetch(invokeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...auth },
          body: JSON.stringify({ task, ...params }),
        }).catch(() => null);

        if (!res || res.status === 404) {
          return new Response(
            JSON.stringify({
              ok: true,
              message: "JARVIS on the edge received request",
              task,
              hint: "Add POST /api/jarvis on the platform to handle tasks (e.g. add_blog_media).",
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const data = await res.json();
        return new Response(JSON.stringify(data), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
