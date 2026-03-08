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

    const platformInstructions: Record<string, string> = {
      "producthunt": "Product Hunt: Generate a tagline (max 60 chars), a short description (max 260 chars), a detailed description, a maker comment introducing yourself and the product story, and a suggested first comment to get discussion going.",
      "reddit": "Reddit: Write an authentic, non-promotional post for r/SideProject or r/Entrepreneur. Include a compelling title, body text that tells a story (problem you solved, how you built it), and a soft CTA. Avoid sounding like an ad.",
      "hackernews": "Hacker News: Write a Show HN post. Title format: 'Show HN: [Product] – [one-line description]'. Body should be technical, honest, concise. Mention the tech stack. Ask for feedback.",
      "indiehackers": "Indie Hackers: Write a Show & Tell post. Include revenue/user numbers context (suggest placeholders), what you built, why, lessons learned, and what's next.",
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
            content: `You are an expert startup launch copywriter who has helped hundreds of products launch successfully. Write in a clear, professional tone. No emojis. No filler phrases like "game-changer" or "revolutionary." Sound like a human expert, not a marketing bot.

${platformInstructions[platform] || platformInstructions["producthunt"]}

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`,
          },
          { role: "user", content: `Generate launch copy for "${product_name}" on ${platform}. Make it authentic, engaging, and optimized for that platform's community.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_launch_copy",
            description: "Create platform-specific launch copy",
            parameters: {
              type: "object",
              properties: {
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "Section name e.g. Tagline, Title, Body, Maker Comment" },
                      content: { type: "string" },
                      char_count: { type: "number" },
                      tip: { type: "string", description: "Platform-specific tip for this section" },
                    },
                    required: ["label", "content", "char_count", "tip"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["sections"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_launch_copy" } },
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
    console.error("generate-launch-copy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
