import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64url } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KLING_API_BASE = "https://api-singapore.klingai.com";

async function generateJWT(accessKey: string, secretKey: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey,
    exp: now + 1800,
    nbf: now - 5,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  const signatureB64 = base64url(new Uint8Array(signature));

  return `${signingInput}.${signatureB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const accessKey = Deno.env.get("KLING_ACCESS_KEY");
    const secretKey = Deno.env.get("KLING_SECRET_KEY");
    if (!accessKey || !secretKey) {
      throw new Error("Kling AI credentials not configured");
    }

    const { action, prompt, negative_prompt, duration, aspect_ratio, mode, task_id } = await req.json();
    const token = await generateJWT(accessKey, secretKey);
    const authHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // CREATE VIDEO TASK
    if (action === "create") {
      const body: Record<string, unknown> = {
        model_name: "kling-v2-6",
        prompt,
        negative_prompt: negative_prompt || "",
        duration: String(duration || "5"),
        mode: mode || "std",
        aspect_ratio: aspect_ratio || "16:9",
      };

      const response = await fetch(`${KLING_API_BASE}/v1/videos/text2video`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok || data.code !== 0) {
        const errMsg = data.message || `Kling API error [${response.status}]`;
        console.error("Kling create error:", JSON.stringify(data));
        return new Response(JSON.stringify({ error: errMsg, code: data.code }), {
          status: response.status === 200 ? 400 : response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        task_id: data.data.task_id,
        status: data.data.task_status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POLL VIDEO STATUS
    if (action === "poll") {
      if (!task_id) throw new Error("task_id is required for polling");

      const response = await fetch(`${KLING_API_BASE}/v1/videos/text2video/${task_id}`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await response.json();
      if (!response.ok || data.code !== 0) {
        const errMsg = data.message || `Kling API error [${response.status}]`;
        console.error("Kling poll error:", JSON.stringify(data));
        return new Response(JSON.stringify({ error: errMsg }), {
          status: response.status === 200 ? 400 : response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = data.data;
      const videoUrl = result.task_result?.videos?.[0]?.url || null;
      const videoDuration = result.task_result?.videos?.[0]?.duration || null;

      return new Response(JSON.stringify({
        task_id: result.task_id,
        status: result.task_status,
        status_msg: result.task_status_msg || "",
        video_url: videoUrl,
        video_duration: videoDuration,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("kling-video error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
