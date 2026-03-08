import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, productDescription, targetAudience, nicheCategory, benefits, platform, customIcp } = await req.json();

    if (!productName || !platform) {
      return new Response(JSON.stringify({ error: "Product name and platform are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const platformInstructions: Record<string, string> = {
      "twitter": `Generate Twitter/X advanced search queries using operators like "from:", "min_faves:", quotes for exact phrases, and keyword combinations. Include hashtag-based searches and bio keyword searches.`,
      "reddit": `Generate Reddit search queries for specific subreddits where the ICP hangs out. Include subreddit names, search strings, and sort-by recommendations (new, top, controversial). Focus on complaint/question posts.`,
      "linkedin": `Generate LinkedIn search filter combinations: job titles, industries, company sizes, keywords for the search bar, and Boolean search strings. Include LinkedIn Sales Navigator filters if applicable.`,
      "quora": `Generate Quora search queries targeting questions the ICP would ask. Include specific question formats, topic/space names to follow, and answer-monitoring strategies.`,
      "indie_hackers": `Generate Indie Hackers search queries, group names, and topic filters. Focus on milestone posts, "ask IH" threads, and product feedback requests where the ICP congregates.`,
    };

    const systemPrompt = `You are a B2B growth strategist who specializes in finding ideal customers on social platforms. You write in a direct, professional tone. No emojis. No filler phrases like "game-changer," "revolutionary," or "unlock your potential." Sound like a seasoned growth operator giving a colleague specific, actionable instructions.

Your task: Given a product and its ICP, generate a comprehensive prospect-finding playbook for ${platform}.

${platformInstructions[platform] || ""}

Return a JSON object with this exact structure:
{
  "searchQueries": [
    { "query": "the exact search string to paste", "description": "what this query finds and why it works", "expectedResults": "what kind of profiles/posts this surfaces" }
  ],
  "icpSignals": [
    { "signal": "what to look for", "why": "why this indicates they're a prospect", "priority": "high | medium | low" }
  ],
  "prospectPersonas": [
    { "name": "Fictional Name", "title": "Their role/title", "background": "2-3 sentence description of who they are", "painPoints": ["specific pain point 1", "specific pain point 2"], "whereToFind": "specific platform locations", "typicalPost": "an example post they would write that signals they need this product" }
  ],
  "dmTemplates": [
    { "scenario": "when to use this template", "subject": "subject line if applicable", "message": "the full message text", "followUp": "what to send if no reply after 3-5 days" }
  ],
  "engagementPlaybook": [
    { "step": 1, "action": "what to do", "timing": "when to do it", "details": "specific instructions" }
  ]
}

Generate 5-8 search queries, 5-7 ICP signals, 5 prospect personas, 3 DM templates (value-first, not salesy), and a 5-step engagement playbook. Every DM template must lead with value — a genuine observation, compliment on their work, or a free resource — never an immediate pitch. The first message should never mention pricing or ask for a call.`;

    const userPrompt = `Product: ${productName}
Description: ${productDescription || "Not provided"}
Target Audience: ${targetAudience || "Not provided"}
Niche/Category: ${nicheCategory || "Not provided"}
Key Benefits: ${benefits?.join(", ") || "Not provided"}
Platform: ${platform}
${customIcp ? `Additional ICP Criteria: ${customIcp}` : ""}

Generate a complete prospect-finding playbook for this product on ${platform}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      // Clean common AI artifacts before parsing
      let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      // Remove stray non-whitespace between JSON tokens (e.g. "msg" randomly inserted)
      cleaned = cleaned.replace(/(["\d\]}])\s*[a-zA-Z]{1,5}\s+(\[{"])/g, "$1 $2");
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Try a second pass: strip all control chars and retry
      try {
        const stripped = content.replace(/[^\x20-\x7E\n\r\t]/g, "");
        const jsonMatch = stripped.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
