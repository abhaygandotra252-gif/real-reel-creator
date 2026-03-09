import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Build profile URL from platform + username
function buildProfileUrl(platform: string, username: string): string {
  if (!username) return "";
  const clean = username.replace(/^[@\/u\/]+/, "").trim();
  switch (platform) {
    case "twitter": return `https://twitter.com/${clean}`;
    case "reddit": return `https://www.reddit.com/user/${clean}`;
    case "linkedin": return `https://www.linkedin.com/in/${clean}`;
    case "quora": return `https://www.quora.com/profile/${clean}`;
    case "indie_hackers": return `https://www.indiehackers.com/${clean}`;
    default: return "";
  }
}

// Fetch real posts via Firecrawl search
async function fetchLivePosts(platform: string, queries: string[], productContext: string): Promise<any[]> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    console.error("FIRECRAWL_API_KEY not configured, falling back to Reddit API");
    if (platform === "reddit") return fetchRedditPosts(queries);
    return [];
  }

  const siteMap: Record<string, string> = {
    twitter: "site:twitter.com OR site:x.com",
    reddit: "site:reddit.com",
    linkedin: "site:linkedin.com",
    quora: "site:quora.com",
    indie_hackers: "site:indiehackers.com",
  };

  const siteFilter = siteMap[platform] || "";
  const posts: any[] = [];
  const seenUrls = new Set<string>();

  // Use top 3 queries to search
  for (const query of queries.slice(0, 3)) {
    try {
      const searchQuery = `${query} ${siteFilter}`;
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 8,
          tbs: "qdr:w", // last week only
        }),
      });

      if (!res.ok) {
        console.error(`Firecrawl search failed for "${query}":`, res.status);
        continue;
      }

      const data = await res.json();
      const results = data?.data || [];

      for (const result of results) {
        if (!result.url || seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);

        // Extract author from URL patterns
        let author = "";
        let profileUrl = "";
        const url = result.url;

        if (platform === "reddit") {
          const authorMatch = url.match(/reddit\.com\/r\/\w+\/comments\/\w+/) 
            || result.description?.match(/by\s+(u\/\w+)/);
          if (result.description) {
            const byMatch = result.description.match(/(?:by|posted by|from)\s+(?:u\/)?(\w+)/i);
            if (byMatch) {
              author = byMatch[1];
              profileUrl = buildProfileUrl("reddit", author);
            }
          }
        } else if (platform === "twitter") {
          const twitterMatch = url.match(/(?:twitter|x)\.com\/(\w+)\/status/);
          if (twitterMatch) {
            author = twitterMatch[1];
            profileUrl = buildProfileUrl("twitter", author);
          }
        } else if (platform === "linkedin") {
          const linkedinMatch = url.match(/linkedin\.com\/(?:in|posts)\/([^\/\?]+)/);
          if (linkedinMatch) {
            author = linkedinMatch[1];
            profileUrl = buildProfileUrl("linkedin", author);
          }
        } else if (platform === "quora") {
          const quoraMatch = url.match(/quora\.com\/profile\/([^\/\?]+)/);
          if (quoraMatch) {
            author = quoraMatch[1];
            profileUrl = buildProfileUrl("quora", author);
          }
        } else if (platform === "indie_hackers") {
          const ihMatch = url.match(/indiehackers\.com\/([^\/\?]+)/);
          if (ihMatch && ihMatch[1] !== "post") {
            author = ihMatch[1];
            profileUrl = buildProfileUrl("indie_hackers", author);
          }
        }

        posts.push({
          title: result.title || "Untitled post",
          url: result.url,
          description: (result.description || "").slice(0, 300),
          author: author || "Unknown",
          profileUrl,
          query_matched: query,
          platform,
        });
      }
    } catch (e) {
      console.error(`Firecrawl search error for "${query}":`, e);
    }
  }

  return posts.slice(0, 20);
}

// Fallback: Reddit public JSON API
async function fetchRedditPosts(queries: string[]): Promise<any[]> {
  const posts: any[] = [];
  const seen = new Set<string>();

  for (const query of queries.slice(0, 4)) {
    try {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=5`;
      const res = await fetch(url, { headers: { "User-Agent": "ProspectFinder/1.0" } });
      if (!res.ok) continue;
      const data = await res.json();
      const children = data?.data?.children || [];
      for (const child of children) {
        const post = child.data;
        if (!post || seen.has(post.id)) continue;
        seen.add(post.id);
        posts.push({
          title: post.title,
          url: `https://www.reddit.com${post.permalink}`,
          description: (post.selftext || "").slice(0, 300),
          author: post.author,
          profileUrl: buildProfileUrl("reddit", post.author),
          query_matched: query,
          platform: "reddit",
          subreddit: post.subreddit_name_prefixed,
          score: post.score,
          num_comments: post.num_comments,
          created_utc: post.created_utc,
        });
      }
    } catch { /* skip */ }
  }

  posts.sort((a, b) => (b.created_utc || 0) - (a.created_utc || 0));
  return posts.slice(0, 15);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, productDescription, targetAudience, nicheCategory, benefits, platform, customIcp } = await req.json();

    if (!productName || !platform) {
      return new Response(JSON.stringify({ error: "Product name and platform are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const platformInstructions: Record<string, string> = {
      twitter: `Generate simple search terms to find real tweets from people who have the problem this product solves. Plain phrases only.`,
      reddit: `Generate simple search terms to find real Reddit posts from people struggling with problems this product solves. Plain phrases only.`,
      linkedin: `Generate simple search terms to find LinkedIn posts from professionals discussing problems this product solves. Plain phrases only.`,
      quora: `Generate simple search terms to find Quora questions from people asking about problems this product solves. Plain phrases only.`,
      indie_hackers: `Generate simple search terms to find Indie Hackers posts from founders discussing problems this product solves. Plain phrases only.`,
    };

    const systemPrompt = `You are a B2B growth strategist. Direct, no-nonsense.

Your task: Generate a prospect-finding playbook for ${platform}.

CRITICAL: Every search query must be a simple phrase — NO operators, NO filters, NO quotes, NO colons. Just plain words someone would type into a search bar.

${platformInstructions[platform] || ""}

Return a JSON object:
{
  "searchQueries": [
    { "query": "simple search phrase", "description": "what this finds", "expectedResults": "what kind of results" }
  ],
  "icpSignals": [
    { "signal": "what to look for", "why": "why this matters", "priority": "high | medium | low" }
  ],
  "prospectPersonas": [
    { "name": "Name", "title": "Role", "background": "2 sentences", "painPoints": ["pain 1"], "whereToFind": "where on platform", "typicalPost": "example post" }
  ],
  "dmTemplates": [
    { "scenario": "when to use", "subject": "subject if applicable", "message": "the message", "followUp": "follow-up" }
  ],
  "engagementPlaybook": [
    { "step": 1, "action": "what to do", "timing": "when", "details": "instructions" }
  ]
}

Generate 5-8 search queries, 5 ICP signals, 4 personas, 3 DM templates, and a 5-step playbook. Session seed: ${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const userPrompt = `Product: ${productName}
Description: ${productDescription || "Not provided"}
Target Audience: ${targetAudience || "Not provided"}
Niche/Category: ${nicheCategory || "Not provided"}
Key Benefits: ${benefits?.join(", ") || "Not provided"}
Platform: ${platform}
${customIcp ? `Additional ICP Criteria: ${customIcp}` : ""}

Generate a prospect-finding playbook for this product on ${platform}.`;

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
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      try {
        const stripped = content.replace(/[^\x20-\x7E\n\r\t]/g, "");
        const jsonMatch = stripped.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch { parsed = null; }
    }

    if (!parsed) {
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch live posts using Firecrawl (or Reddit fallback)
    if (parsed.searchQueries?.length) {
      try {
        const queries = parsed.searchQueries.map((q: any) => q.query);
        const productContext = `${productName} - ${productDescription || ""}`;
        parsed.livePosts = await fetchLivePosts(platform, queries, productContext);
      } catch (e) {
        console.error("Failed to fetch live posts:", e);
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
