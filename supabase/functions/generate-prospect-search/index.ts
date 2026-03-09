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
      "twitter": `Generate simple search terms and phrases to type into Twitter/X search bar. No advanced operators like "from:" or "min_faves:". Just plain words and short phrases someone can copy-paste directly into the search box. Example: "struggling with invoicing freelance" or "need a better CRM". Keep it dead simple.`,
      "reddit": `Generate simple search terms to type into Reddit's search bar or Google with "site:reddit.com". Just plain phrases, no complex operators. Include which subreddits to check. Example: "best tool for managing clients" or "tired of spreadsheets". Keep it dead simple.`,
      "linkedin": `Generate simple search terms to type into LinkedIn's search bar. Just job titles, keywords, and short phrases. No Boolean operators or Sales Navigator filters. Example: "freelance designer" or "startup founder SaaS". Keep it dead simple.`,
      "quora": `Generate simple search terms to type into Quora's search bar. Just questions and phrases people would search. Example: "how to manage freelance clients" or "best invoicing software". Keep it dead simple.`,
      "indie_hackers": `Generate simple search terms to type into Indie Hackers search. Just plain phrases and keywords. Example: "looking for feedback on my SaaS" or "struggling with customer acquisition". Keep it dead simple.`,
    };

    const systemPrompt = `You are a B2B growth strategist who finds ideal customers on social platforms. Direct, no-nonsense tone. No emojis. No filler.

Your task: Generate a prospect-finding playbook for ${platform}.

CRITICAL RULE FOR SEARCH QUERIES: Every search query must be a simple phrase that someone can copy and paste directly into the platform's search bar. No advanced search operators, no filters, no Boolean logic, no quotation marks wrapping phrases, no colons. Just plain everyday words and short phrases. Think of what a normal person would type into a search box.

${platformInstructions[platform] || ""}

Return a JSON object with this exact structure:
{
  "searchQueries": [
    { "query": "the exact simple search term to paste", "description": "what this finds", "expectedResults": "what kind of results this surfaces" }
  ],
  "icpSignals": [
    { "signal": "what to look for", "why": "why this indicates they're a prospect", "priority": "high | medium | low" }
  ],
  "prospectPersonas": [
    { "name": "Fictional Name", "title": "Their role", "background": "2 sentence description", "painPoints": ["pain 1", "pain 2"], "whereToFind": "where on the platform", "typicalPost": "example post they'd write" }
  ],
  "dmTemplates": [
    { "scenario": "when to use this", "subject": "subject line if applicable", "message": "the message", "followUp": "follow-up if no reply" }
  ],
  "engagementPlaybook": [
    { "step": 1, "action": "what to do", "timing": "when", "details": "instructions" }
  ]
}

Generate 5-8 search queries (SIMPLE PHRASES ONLY), 5-7 ICP signals, 5 personas, 3 DM templates (value-first, never salesy), and a 5-step engagement playbook. First DM must never mention pricing or ask for a call.`;

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
        temperature: 1.2,
        messages: [
          { role: "system", content: `${systemPrompt}\n\nIMPORTANT: Generate completely unique and creative results every time. Do not repeat patterns from previous generations. Session seed: ${Date.now()}-${Math.random().toString(36).slice(2)}` },
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
