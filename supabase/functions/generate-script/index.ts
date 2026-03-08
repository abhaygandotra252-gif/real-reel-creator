import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, video_style, tone, duration } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const styleName = video_style.replace("-", " ");
    const features = (product.key_features || []).join(", ");
    const benefits = (product.benefits || []).join(", ");

    const systemPrompt = `You are an expert UGC (User Generated Content) script writer who creates authentic, converting video scripts that sound like a real person sharing their genuine experience with a product. Your scripts should feel natural, unscripted, and relatable — never salesy or robotic.

You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.

The JSON must have this exact structure:
{
  "title": "A catchy title for this script",
  "hook": "The opening 3-5 seconds attention grabber",
  "body": "The main script content with natural speech patterns, filler words, pauses indicated by ..., and authentic reactions",
  "cta": "The call to action at the end",
  "storyboard": [
    {"scene": "Scene description", "direction": "Camera/visual direction", "duration": "Time"}
  ]
}`;

    const userPrompt = `Create a ${duration} ${styleName} UGC video script for this product:

Product: ${product.name}
Description: ${product.description || "N/A"}
Key Features: ${features || "N/A"}
Benefits: ${benefits || "N/A"}
Target Audience: ${product.target_audience || "General"}
Niche: ${product.niche_category || "General"}

Tone: ${tone}
Duration: ${duration}
Style: ${styleName}

Make it sound like a real person genuinely excited about this product. Include natural speech patterns like "okay so...", "honestly...", "you guys...", pauses (...), and authentic reactions. The hook must stop the scroll in the first 3 seconds.

For the storyboard, break down each scene with camera angles and visual directions appropriate for a ${duration} video.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const script = JSON.parse(content);

    return new Response(JSON.stringify(script), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
