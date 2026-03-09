import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: "URL is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    // Fetch the page HTML
    const pageRes = await fetch(formattedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandColorExtractor/1.0)" },
    });
    if (!pageRes.ok) throw new Error(`Failed to fetch URL: ${pageRes.status}`);
    const html = await pageRes.text();

    // Extract a manageable chunk for analysis (first 15k chars of CSS-related content)
    const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
    const metaTheme = html.match(/<meta[^>]*name=["']theme-color["'][^>]*>/gi) || [];
    const inlineStyles = html.match(/style=["'][^"']*["']/gi)?.slice(0, 20) || [];
    
    const cssSnippet = [
      ...metaTheme,
      ...styleMatches.map(s => s.slice(0, 3000)),
      ...inlineStyles,
    ].join("\n").slice(0, 12000);

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
            content: "You extract brand color palettes from website CSS/HTML. Return exactly 4-6 hex color codes that represent the brand's primary, secondary, accent, and background colors. Focus on the most visually prominent and intentional brand colors, not generic grays or whites.",
          },
          {
            role: "user",
            content: `Extract the brand color palette from this website's CSS and HTML:\n\n${cssSnippet}\n\nReturn the dominant brand colors as hex codes.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_colors",
            description: "Extract brand colors from website",
            parameters: {
              type: "object",
              properties: {
                colors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      hex: { type: "string", description: "Hex color code like #FF6B35" },
                      role: { type: "string", description: "Color role: primary, secondary, accent, background, text" },
                    },
                    required: ["hex", "role"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["colors"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_colors" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      throw new Error(`AI error ${response.status}: ${t}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-brand-colors error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
