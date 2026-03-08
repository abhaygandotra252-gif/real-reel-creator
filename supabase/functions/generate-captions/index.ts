import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const platformGuidelines: Record<string, string> = {
      instagram: "Instagram: Use emojis, line breaks, 20-30 relevant hashtags. Max 2200 chars. Engaging, visual language.",
      tiktok: "TikTok: Short, punchy, trendy. Use 4-5 hashtags. Include a hook in the first line. Casual tone.",
      twitter: "Twitter/X: Under 280 chars. Witty, concise. 2-3 hashtags max. Thread-worthy hooks.",
      linkedin: "LinkedIn: Professional but personable. Storytelling format. 3-5 hashtags. Use line breaks for readability.",
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
            content: `You are an expert social media copywriter. Generate 3 caption variations for ${platform}.
${platformGuidelines[platform] || platformGuidelines.instagram}

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`,
          },
          { role: "user", content: `Write 3 unique ${platform} captions for "${product_name}". Each should have a different angle (educational, emotional, promotional). Include relevant hashtags and a suggested posting time.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_captions",
            description: "Create social media captions",
            parameters: {
              type: "object",
              properties: {
                captions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      angle: { type: "string", description: "e.g. educational, emotional, promotional" },
                      caption: { type: "string" },
                      hashtags: { type: "array", items: { type: "string" } },
                      best_posting_time: { type: "string" },
                    },
                    required: ["angle", "caption", "hashtags", "best_posting_time"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["captions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_captions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      throw new Error(`AI error ${response.status}: ${t}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const captions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(captions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-captions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
