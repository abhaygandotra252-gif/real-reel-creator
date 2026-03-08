import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, ad_platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const platformInstructions: Record<string, string> = {
      "google": "Google Ads: Generate 5 headline variations (max 30 chars each), 3 description variations (max 90 chars each). Include different angles: pain point, benefit, social proof, urgency, curiosity.",
      "meta": "Facebook/Instagram Ads: Generate 3 ad variations. Each needs: primary text (125 chars ideal), headline (40 chars), description (30 chars), and CTA suggestion. Different angles: emotional, logical, social proof.",
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a performance marketing expert specializing in paid ads. Write in a clear, professional tone. No emojis. No filler phrases like "game-changer" or "revolutionary." Sound like a human expert, not a marketing bot.

${platformInstructions[ad_platform] || platformInstructions["google"]}

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`,
          },
          { role: "user", content: `Generate ${ad_platform} ad copy variations for "${product_name}". Optimize for clicks and conversions. Include A/B test suggestions.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_ad_copy",
            description: "Create ad copy variations",
            parameters: {
              type: "object",
              properties: {
                variations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      angle: { type: "string", description: "e.g. Pain Point, Benefit, Social Proof, Urgency" },
                      headline: { type: "string" },
                      description: { type: "string" },
                      primary_text: { type: "string" },
                      cta: { type: "string" },
                    },
                    required: ["angle", "headline", "description", "primary_text", "cta"],
                    additionalProperties: false,
                  },
                },
                ab_test_tips: { type: "array", items: { type: "string" } },
              },
              required: ["variations", "ab_test_tips"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_ad_copy" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      throw new Error(`AI error ${response.status}: ${t}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-ad-copy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
