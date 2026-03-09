import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Build platform search URLs
function buildSearchUrl(platform: string, query: string): string {
  const q = encodeURIComponent(query);
  switch (platform) {
    case "twitter": return `https://twitter.com/search?q=${q}&f=live`;
    case "reddit": return `https://www.reddit.com/search/?q=${q}&sort=new&t=week`;
    case "linkedin": return `https://www.linkedin.com/search/results/content/?keywords=${q}&sortBy=%22date_posted%22`;
    case "quora": return `https://www.quora.com/search?q=${q}`;
    case "indie_hackers": return `https://www.indiehackers.com/search?q=${q}`;
    default: return "";
  }
}

// Fetch real recent posts from Reddit public JSON API
async function fetchRedditPosts(queries: string[]): Promise<any[]> {
  const posts: any[] = [];
  const seen = new Set<string>();

  for (const query of queries.slice(0, 4)) {
    try {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=month&limit=5`;
      const res = await fetch(url, {
        headers: { "User-Agent": "ProspectFinder/1.0" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const children = data?.data?.children || [];
      for (const child of children) {
        const post = child.data;
        if (!post || seen.has(post.id)) continue;
        seen.add(post.id);
        posts.push({
          title: post.title,
          subreddit: post.subreddit_name_prefixed,
          url: `https://www.reddit.com${post.permalink}`,
          author: post.author,
          score: post.score,
          num_comments: post.num_comments,
          created_utc: post.created_utc,
          selftext_preview: (post.selftext || "").slice(0, 200),
          query_matched: query,
        });
      }
    } catch {
      // skip failed queries
    }
  }

  // Sort by recency, limit to 15
  posts.sort((a, b) => b.created_utc - a.created_utc);
  return posts.slice(0, 15);
}

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
      "twitter": `Generate simple search terms and phrases to type into Twitter/X search bar. Just plain words and short phrases someone can copy-paste directly into the search box. Example: "struggling with invoicing freelance" or "need a better CRM".`,
      "reddit": `Generate simple search terms to type into Reddit's search bar. Just plain phrases. Include which subreddits to check. Example: "best tool for managing clients" or "tired of spreadsheets".`,
      "linkedin": `Generate simple search terms to type into LinkedIn's search bar. Just job titles, keywords, and short phrases. Example: "freelance designer" or "startup founder SaaS".`,
      "quora": `Generate simple search terms to type into Quora's search bar. Just questions and phrases people would search. Example: "how to manage freelance clients" or "best invoicing software".`,
      "indie_hackers": `Generate simple search terms to type into Indie Hackers search. Just plain phrases and keywords. Example: "looking for feedback on my SaaS" or "struggling with customer acquisition".`,
    };

    const systemPrompt = `You are a B2B growth strategist who finds ideal customers on social platforms. Direct, no-nonsense tone. No emojis. No filler.

Your task: Generate a prospect-finding playbook for ${platform}.

CRITICAL RULE FOR SEARCH QUERIES: Every search query must be a simple phrase that someone can copy and paste directly into the platform's search bar. No advanced search operators, no filters, no Boolean logic, no quotation marks wrapping phrases, no colons. Just plain everyday words and short phrases.

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
      let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      cleaned = cleaned.replace(/(["\d\]}])\s*[a-zA-Z]{1,5}\s+(\[{"])/g, "$1 $2");
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
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

    // Add clickable search URLs to each query
    if (parsed.searchQueries) {
      parsed.searchQueries = parsed.searchQueries.map((q: any) => ({
        ...q,
        searchUrl: buildSearchUrl(platform, q.query),
      }));
    }

    // For Reddit, fetch real recent posts
    if (platform === "reddit" && parsed.searchQueries?.length) {
      try {
        const queries = parsed.searchQueries.map((q: any) => q.query);
        parsed.livePosts = await fetchRedditPosts(queries);
      } catch (e) {
        console.error("Failed to fetch Reddit posts:", e);
        parsed.livePosts = [];
      }
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
