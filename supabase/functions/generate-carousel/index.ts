import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, theme, slide_count } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const themeInstructions: Record<string, string> = {
      "educational-tips": "Create educational tips related to the product. Each slide should teach something valuable.",
      "product-benefits": "Highlight key benefits of the product. Each slide focuses on one benefit with a compelling headline.",
      "testimonial": "Create realistic testimonial-style slides with quotes and social proof.",
      "before-after": "Create before/after comparison slides showing the transformation the product enables.",
    };

    const systemPrompt = `You are a social media content strategist creating carousel slide content. Write in a clear, professional tone. No emojis in the slide text. No filler phrases like "game-changer" or "revolutionary." Sound like a human expert, not a marketing bot.

Return structured data for ${slide_count || 5} carousel slides.
Theme: ${themeInstructions[theme] || themeInstructions["product-benefits"]}

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`;

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
          { role: "user", content: `Generate ${slide_count || 5} carousel slides for "${product_name}". Each slide needs a headline (max 8 words), body text (max 25 words), and a small tagline or CTA. The first slide should be a hook/title slide, and the last should be a CTA slide.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_carousel",
            description: "Create carousel slide content",
            parameters: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      headline: { type: "string" },
                      body: { type: "string" },
                      tagline: { type: "string" },
                    },
                    required: ["headline", "body", "tagline"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["slides"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_carousel" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      throw new Error(`AI error ${response.status}: ${t}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const slides = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(slides), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-carousel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
