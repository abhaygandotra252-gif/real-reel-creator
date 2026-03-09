import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, niche } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const nicheInstructions: Record<string, string> = {
      startups: "Focus on startup life, building products, founder mindset, hiring, fundraising, pivoting, shipping fast. Reference real startup patterns.",
      products: "Focus on product building, user feedback, feature decisions, design, UX, shipping, iteration, product-market fit.",
      marketing: "Focus on growth tactics, distribution, content strategy, SEO, paid ads, organic growth, community building, launch strategies.",
      all: "Mix of startup life, product building, and marketing. Vary the angles across all three niches.",
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 1.2,
        messages: [
          {
            role: "system",
            content: `You write X/Twitter posts that get real engagement. You sound like a sharp founder who ships products and has opinions from experience, not theory.

Your writing style:
- Short, punchy, direct. Like texting a smart friend.
- You state observations, not motivational quotes.
- You share real takes, not "content."
- You sometimes start mid-thought. No preamble.
- You use line breaks to create rhythm and pacing, not walls of text.

ABSOLUTE RULES:
- Every post MUST be under 280 characters. Count carefully.
- NEVER use emojis. Not a single one.
- NEVER use em dashes (—). Use periods or commas instead.
- NEVER use these words/phrases: game-changer, revolutionary, cutting-edge, seamless, leverage, unlock, elevate, robust, innovative, disrupt, synergy, next-level, excited to, thrilled, proud to, comprehensive, streamline, empower, harness, optimize, transform, reimagine, supercharge, hot take, unpopular opinion, here's the thing, let that sink in, read that again, this is the way, say it louder
- NEVER start with "Just" or "I just" or "PSA:" or "Reminder:"
- NEVER use the format "X. But Y." or "Most people X. Top performers Y."
- NO hashtags
- NO threads format (no 1/, 2/, etc)
- NO motivational platitudes or hustle porn
- NO "nobody talks about this" or "nobody is ready for this conversation"
- Use contractions naturally (don't, can't, won't, it's, that's)
- Be opinionated. Take a stance. Contrarian is good when honest.
- Sound like a real person sharing a real observation, not a content creator performing
- Each post must have a completely different angle/format/structure
- Some posts can be one-liners. Some can use 2-3 short lines with breaks. Vary it.
- Reference the product naturally when relevant, but some posts can be pure value/opinion

Niche focus: ${nicheInstructions[niche] || nicheInstructions["all"]}

Product context (use subtly, not in every post):
Name: ${product_name}
Description: ${product_description || "N/A"}
Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`,
          },
          {
            role: "user",
            content: `Write 6 unique X posts. Each under 280 chars. Each with a different angle. Make them the kind of posts that make people stop scrolling and hit like. Timestamp seed: ${Date.now()}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_x_posts",
            description: "Create X/Twitter posts",
            parameters: {
              type: "object",
              properties: {
                posts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      content: { type: "string", description: "Post text, max 280 chars, use \\n for line breaks" },
                      char_count: { type: "number", description: "Character count of the post" },
                      niche: { type: "string", description: "Which niche this post targets" },
                      angle: { type: "string", description: "Brief description of the angle/format used" },
                    },
                    required: ["content", "char_count", "niche", "angle"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["posts"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_x_posts" } },
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
    console.error("generate-x-posts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
