import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, tactic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const tacticInstructions: Record<string, string> = {
      "cold-value-dms": "Generate 3 cold DM templates for Twitter and LinkedIn. Each DM should lead with value (helping the recipient with their problem) and mention the product only at the end as a soft suggestion. Include: where to find prospects, what to look for in their posts, and the exact message template. Make it feel like a genuine conversation, not a pitch.",
      "strategic-commenting": "Generate 5 comment templates for high-traffic content (blog posts, YouTube videos, Reddit threads, LinkedIn posts) in the product's niche. Each comment should add genuine value to the discussion and mention the product naturally, not as a plug. Include: types of content to target, how to find them, and the comment template.",
      "quora-answers": "Generate 3 Quora/StackOverflow answer templates for questions the product solves. Each answer should be genuinely helpful — 80% value, 20% product mention. Include: example question topics to search for, the full answer template, and where to naturally place the product mention.",
      "community-seeding": "Generate 3 community introduction/value posts for Slack groups, Discord servers, and Facebook groups in the product's niche. Each should introduce the maker and share something useful before mentioning the product. Include: types of communities to join, how to contribute before posting, and the actual post template.",
      "partnership-pitches": "Generate 2 co-marketing partnership proposals for complementary products. Include: how to identify good partners, the pitch email template, specific collaboration ideas (content swap, newsletter mention, bundle deal), and what to offer in return.",
      "micro-influencer": "Generate 2 micro-influencer collaboration briefs for creators with 1K-10K followers. Include: how to find relevant creators, what to look for, the outreach message, the collaboration brief (what you want them to create), and compensation suggestions.",
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
            content: `You are a growth advisor who has taken dozens of products from zero to their first 1,000 users using unconventional tactics. Write in a clear, direct, professional tone. No emojis. No filler phrases like "game-changer," "revolutionary," or "unlock your potential." Sound like a seasoned founder sharing real playbooks, not a marketing bot.

${tacticInstructions[tactic] || tacticInstructions["cold-value-dms"]}

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`,
          },
          { role: "user", content: `Generate a detailed, actionable playbook for the "${tactic}" growth tactic applied to "${product_name}". Include step-by-step instructions, ready-to-use templates, and specific examples.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_growth_playbook",
            description: "Create a growth tactic playbook",
            parameters: {
              type: "object",
              properties: {
                tactic_name: { type: "string" },
                overview: { type: "string", description: "2-3 sentence overview of why this tactic works" },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step_number: { type: "number" },
                      title: { type: "string" },
                      description: { type: "string" },
                      template: { type: "string", description: "Ready-to-use template or script" },
                    },
                    required: ["step_number", "title", "description", "template"],
                    additionalProperties: false,
                  },
                },
                pro_tips: { type: "array", items: { type: "string" } },
                expected_results: { type: "string" },
              },
              required: ["tactic_name", "overview", "steps", "pro_tips", "expected_results"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_growth_playbook" } },
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
    console.error("generate-growth-hacks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
