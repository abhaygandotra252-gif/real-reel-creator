import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, productName, productDescription, benefits } = await req.json();

    if (!url || !productName) {
      return new Response(JSON.stringify({ error: "URL and product name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    // Step 1: Scrape the URL to get context
    let pageContent = "";
    let pageTitle = "";
    let authorName = "";
    let isProfile = false;

    if (FIRECRAWL_API_KEY) {
      try {
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url.trim(),
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          pageContent = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          pageTitle = scrapeData?.data?.metadata?.title || scrapeData?.metadata?.title || "";
          
          // Detect if it's a profile URL
          const profilePatterns = [
            /twitter\.com\/\w+\/?$/,
            /x\.com\/\w+\/?$/,
            /linkedin\.com\/in\//,
            /reddit\.com\/user\//,
            /reddit\.com\/u\//,
            /quora\.com\/profile\//,
            /indiehackers\.com\/\w+\/?$/,
            /github\.com\/\w+\/?$/,
          ];
          isProfile = profilePatterns.some(p => p.test(url));
          
          // Extract author from URL
          const twitterMatch = url.match(/(?:twitter|x)\.com\/(\w+)/);
          const redditMatch = url.match(/reddit\.com\/(?:user|u)\/(\w+)/);
          const linkedinMatch = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
          if (twitterMatch) authorName = twitterMatch[1];
          else if (redditMatch) authorName = redditMatch[1];
          else if (linkedinMatch) authorName = linkedinMatch[1];
        }
      } catch (e) {
        console.error("Scrape failed:", e);
      }
    }

    // Truncate content to avoid token limits
    const truncatedContent = pageContent.slice(0, 3000);

    const systemPrompt = `You are a founder who writes direct, no-nonsense replies and outreach messages. Your writing style:

- Short sentences. Vary length. Some long, some just 3-4 words.
- Zero emojis. Zero em dashes. Zero colons followed by lists.
- Never use: "Quick question", "Just wanted to", "I'd love to", "game-changer", "revolutionary", "excited to", "Hey there", "Hope you're doing well"
- Never start with a compliment that sounds fake
- Sound like someone who actually uses the product and genuinely wants to help
- Reference something SPECIFIC from their post/profile. Not vague praise.
- If it's a post/comment: write a reply that adds value, shares a genuine perspective, and naturally mentions the product ONLY if relevant. Don't force it.
- If it's a profile: write a DM that references their specific work/interests and connects it to a real problem the product solves
- The goal is to make them curious enough to check out the product on their own
- Write like a real person texting, not a marketer crafting copy
- 0% plagiarism. Every reply must feel handwritten for this exact person/post.

Product: ${productName}
Description: ${productDescription || "Not provided"}
Key Benefits: ${benefits?.join(", ") || "Not provided"}

Session: ${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const userPrompt = isProfile
      ? `This is someone's profile page. Write a cold DM to this person that connects their work to the problem ${productName} solves. Make it feel like you actually looked at their profile and found something genuinely interesting.

Profile URL: ${url}
${authorName ? `Username: ${authorName}` : ""}
Profile content:
${truncatedContent || "Could not scrape profile content. Write a general but specific-sounding DM based on the platform and URL context."}

Generate 2 different DM variations. One shorter (2-3 sentences), one slightly longer (4-5 sentences). Both must sound completely different from each other.`
      : `This is a post or comment someone wrote. Write a reply that adds genuine value to the conversation and naturally positions ${productName} as helpful IF it's relevant. If the product isn't directly relevant to what they're discussing, just write a genuinely helpful reply without mentioning the product at all.

Post URL: ${url}
Post title: ${pageTitle || "Unknown"}
${authorName ? `Author: ${authorName}` : ""}
Post content:
${truncatedContent || "Could not scrape post content. Write a general but authentic-sounding reply based on the URL and title context."}

Generate 2 reply variations. One that subtly mentions the product (only if natural), and one that's purely value-add without any product mention. Both must sound like a real person wrote them.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 1.0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_replies",
            description: "Create humanized reply variations",
            parameters: {
              type: "object",
              properties: {
                replies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string", description: "e.g. 'With product mention', 'Pure value-add', 'Short DM', 'Longer DM'" },
                      content: { type: "string", description: "The actual reply/DM text" },
                      context_used: { type: "string", description: "What specific detail from their post/profile this references" },
                    },
                    required: ["label", "content", "context_used"],
                    additionalProperties: false,
                  },
                },
                is_profile: { type: "boolean" },
                platform_detected: { type: "string" },
              },
              required: ["replies", "is_profile", "platform_detected"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_replies" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-reply error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
