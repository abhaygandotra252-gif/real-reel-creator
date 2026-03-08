import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_name, product_description, key_features, benefits, thread_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeInstructions: Record<string, string> = {
      "launch": "Product launch thread: Hook tweet → Problem → Solution → Key features (1 per tweet) → Social proof/results → CTA. Make the hook irresistible.",
      "build-in-public": "Building in public thread: Share the journey of building this product. Start with a hook, then cover: the problem noticed, early decisions, challenges faced, current state, lessons learned. Authentic and vulnerable tone.",
      "how-i-built": "Technical breakdown thread: 'How I built X' format. Cover tech stack, architecture decisions, interesting challenges, what you'd do differently. Developer-friendly tone.",
      "tips": "Tips/value thread related to the product's domain. Each tweet is a standalone tip. Hook tweet promises value. End with a CTA to check out the product. Educational and generous.",
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
            content: `You are a viral Twitter/X thread writer. Every tweet MUST be under 280 characters.
${typeInstructions[thread_type] || typeInstructions["launch"]}

Product: ${product_name}
Description: ${product_description || "N/A"}
Key Features: ${(key_features || []).join(", ") || "N/A"}
Benefits: ${(benefits || []).join(", ") || "N/A"}`,
          },
          { role: "user", content: `Write a ${thread_type} Twitter/X thread for "${product_name}". 8-12 tweets. Each under 280 chars. Make the first tweet a scroll-stopping hook.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_thread",
            description: "Create a Twitter/X thread",
            parameters: {
              type: "object",
              properties: {
                tweets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      number: { type: "number" },
                      content: { type: "string", description: "Tweet text, max 280 chars" },
                      char_count: { type: "number" },
                    },
                    required: ["number", "content", "char_count"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["tweets"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_thread" } },
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
    console.error("generate-thread error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
