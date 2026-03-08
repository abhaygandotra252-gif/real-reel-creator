import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, template_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeInstructions: Record<string, string> = {
      "influencer-outreach": "Write a warm, professional influencer collaboration outreach email. Include: subject line, greeting, why they're a great fit, collaboration offer, and sign-off.",
      "customer-followup": "Write a friendly customer follow-up email after purchase. Include: subject line, thank you, usage tips, request for review, and support info.",
      "launch-announcement": "Write an exciting product launch announcement email. Include: subject line, teaser hook, key features reveal, launch offer, and CTA.",
      "collab-proposal": "Write a brand collaboration proposal email. Include: subject line, brand intro, mutual value proposition, collaboration ideas, and next steps.",
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
            content: `You are an expert email copywriter and outreach specialist.
${typeInstructions[template_type] || typeInstructions["influencer-outreach"]}

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`,
          },
          { role: "user", content: `Generate 2 email/DM template variations for "${product_name}" (${template_type}). Make them personalized and ready to send with minimal editing.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_templates",
            description: "Create outreach email/DM templates",
            parameters: {
              type: "object",
              properties: {
                templates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      variation: { type: "string", description: "e.g. Formal, Casual" },
                      subject_line: { type: "string" },
                      body: { type: "string" },
                      dm_version: { type: "string", description: "Shorter DM-friendly version" },
                    },
                    required: ["variation", "subject_line", "body", "dm_version"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["templates"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_templates" } },
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
    const templates = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(templates), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-outreach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
