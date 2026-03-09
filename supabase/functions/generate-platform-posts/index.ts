import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, target_audience, platforms } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const platformDetails: Record<string, string> = {
      "Reddit": "Write a Reddit post with a compelling title and body. Tone: casual, genuine, no self-promo vibes. Include which subreddits would be best (e.g. r/SideProject, r/startups, r/InternetIsBeautiful, r/webdev, etc). Body should tell a story or ask for feedback.",
      "Hacker News": "Write a Show HN post. Title format: 'Show HN: [Product] - [one-line description]'. Body: 2-3 paragraphs max. Technical, humble, explain what it does and why you built it. No marketing speak.",
      "Indie Hackers": "Write an Indie Hackers post. Storytelling format about building the product. Include metrics if possible. Community loves transparency about revenue, challenges, and lessons learned.",
      "Dev.to": "Write a Dev.to article intro and outline. Use markdown. Technical but accessible. Include tags suggestion. Dev.to readers want to learn something, so frame around a problem/solution.",
      "Product Hunt": "Write a Product Hunt community post. Short, punchy description. Include tagline (under 60 chars), a longer description (2-3 sentences), and a first comment from the maker.",
      "BetaList": "Write a BetaList submission. Need: one-liner description (under 140 chars), a short pitch (2-3 sentences), and what makes it unique.",
      "Lobsters": "Write a Lobsters post. Similar to HN but even more technical. Title should be descriptive, no clickbait. Brief context about the technical approach.",
      "Slashdot": "Write a Slashdot-style submission. News-style framing. What problem does this solve and why should the tech community care.",
      "Twitter/X Community": "Write a post for Twitter/X startup communities. Under 280 chars. Direct, no emojis, no em dashes. Just state what you built and why it matters.",
      "LinkedIn": "Write a LinkedIn post about the product launch. Professional but not corporate. Tell the story of why you built it. 3-5 short paragraphs.",
      "Facebook Groups": "Write a post for relevant Facebook groups (startup groups, maker groups). Conversational, ask for feedback, be genuine about what you built.",
      "Quora": "Write a Quora answer that naturally mentions the product. Frame it as answering a question in the product's problem space. Helpful first, product mention second.",
    };

    const selectedPlatforms = (platforms as string[]).filter(p => platformDetails[p]);
    const platformInstructions = selectedPlatforms.map(p => `### ${p}\n${platformDetails[p]}`).join("\n\n");

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
            content: `You are an expert at writing platform-specific promotional posts for startups and SaaS products. Each post must match the exact tone, format, and culture of the target platform. No generic marketing copy. Write like a real founder who understands each community.

Never use emojis. Never use em dashes. Never use words like "game-changer", "revolutionary", "cutting-edge", "seamless". Be direct and authentic.

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}
Target Audience: ${target_audience || "N/A"}

Generate posts for each of these platforms:

${platformInstructions}`,
          },
          {
            role: "user",
            content: `Generate platform-specific posts for "${product_name}" across ${selectedPlatforms.length} platforms. Each post must be unique to that platform's culture and format. Timestamp seed: ${Date.now()}`,
          },
        ],
        temperature: 1.1,
        tools: [{
          type: "function",
          function: {
            name: "create_platform_posts",
            description: "Create platform-specific promotional posts",
            parameters: {
              type: "object",
              properties: {
                platforms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Platform name" },
                      post_title: { type: "string", description: "Post title or headline" },
                      post_body: { type: "string", description: "Full post body text" },
                      tips: { type: "string", description: "Tips for posting on this platform (best time, etiquette, etc)" },
                      subreddit_suggestions: { type: "array", items: { type: "string" }, description: "Suggested subreddits (Reddit only)" },
                    },
                    required: ["name", "post_title", "post_body", "tips"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["platforms"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_platform_posts" } },
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
    console.error("generate-platform-posts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
