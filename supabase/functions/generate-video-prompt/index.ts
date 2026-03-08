import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { script_text, product_name, video_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isMotionGraphics = video_type === "motion-graphics";

    const systemPrompt = isMotionGraphics
      ? `You are a motion graphics video prompt expert. Convert the given content into a cinematic motion graphics video prompt. Focus on: dynamic typography animations, smooth transitions, abstract shapes, particle effects, color gradients, kinetic text, and professional motion design. The prompt should describe a visually stunning motion graphics sequence. Return ONLY the prompt text, no JSON, no markdown.`
      : `You are a product video prompt expert. Convert the given content into a cinematic AI video generation prompt. Focus on: product close-ups, lifestyle shots, beautiful lighting, smooth camera movements, and professional product videography aesthetics. The prompt should describe a visually compelling product showcase video. Return ONLY the prompt text, no JSON, no markdown.`;

    const userPrompt = `Create a video generation prompt for:
${product_name ? `Product: ${product_name}` : ""}
Content: ${script_text}

Make it visually descriptive and cinematic. Focus on what the viewer should SEE, not hear.`;

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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const prompt = aiData.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ prompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-video-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
