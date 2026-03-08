import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, directories } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `You are a startup growth strategist who has submitted hundreds of products to directories. Write in a clear, professional tone. No emojis. No filler phrases like "game-changer" or "revolutionary." Sound like a human expert, not a marketing bot.

For each directory, generate submission-ready copy that matches the directory's specific format, character limits, and community expectations.

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`,
          },
          { role: "user", content: `Generate submission-ready profiles for these directories: ${(directories || []).join(", ")}. For each directory, include: a one-liner (under 80 chars), a full description tailored to that directory's audience, and 3-5 category tags. Make each description unique — do not copy-paste the same text across directories.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_directory_listings",
            description: "Create directory submission profiles",
            parameters: {
              type: "object",
              properties: {
                listings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      directory: { type: "string" },
                      one_liner: { type: "string" },
                      full_description: { type: "string" },
                      category_tags: { type: "array", items: { type: "string" } },
                      submission_tip: { type: "string" },
                    },
                    required: ["directory", "one_liner", "full_description", "category_tags", "submission_tip"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["listings"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_directory_listings" } },
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
    console.error("generate-directory-listing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
