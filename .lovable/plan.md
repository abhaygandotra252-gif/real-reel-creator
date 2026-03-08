

# ICP Prospect Finder + Directory Submission Reality

## Auto-Submitting to Directories — Not Possible

Most directories (BetaList, Product Hunt, Capterra, G2, etc.) require manual account creation, CAPTCHA verification, email confirmation, and human review. There is no public API for any of them. Automated submissions would violate their terms of service and get your product banned.

**What we already have works well**: the Directory Submitter generates submission-ready copy with direct links. The manual step of pasting that copy into each directory's form takes 2-3 minutes per directory. That's the fastest legitimate path.

## What We Will Build: ICP Prospect Finder

A new "Prospects" tab that uses AI to identify real people across platforms who match your product's ideal customer profile, complete with profile links and personalized outreach templates.

### How It Works

1. User selects a product (which already has `target_audience`, `description`, `niche_category`, `benefits`)
2. User picks a platform: Twitter/X, Reddit, LinkedIn, Quora, Indie Hackers
3. User optionally adds custom ICP criteria (e.g. "solo founders building SaaS", "freelance designers struggling with invoicing")
4. AI generates:
   - **Search queries** — exact strings to paste into each platform's search to find prospects (e.g. Twitter advanced search queries, Reddit search queries, LinkedIn search filters)
   - **ICP signals** — what to look for in profiles/posts that indicate they're a match
   - **Sample prospect personas** — 5-8 fictional-but-realistic prospect profiles based on the ICP, with the type of posts they'd make and where to find them
   - **Personalized DM/comment templates** — value-first messages tailored to each persona, not pitches
   - **Engagement playbook** — step-by-step: follow, engage with their content for a few days, then DM

### Why Not Live Scraping?

Twitter, LinkedIn, and Reddit APIs either require expensive paid access, have strict rate limits, or prohibit scraping profiles for outreach. Instead, we generate the exact search queries and signals so users can find prospects themselves in 5 minutes — which is more reliable and won't get accounts flagged.

## Technical Plan

### New Edge Function
- `supabase/functions/generate-prospect-search/index.ts` — uses Lovable AI to generate platform-specific search queries, ICP signals, prospect personas, and outreach templates based on product data

### New Component
- `src/components/marketing/ProspectFinder.tsx` — product select, platform picker, optional custom ICP input, displays search queries (with copy buttons), prospect personas, and DM templates

### Update Marketing.tsx
Add "Prospects" tab with Users icon. Total: 12 tabs.

### Update config.toml
Register `generate-prospect-search` with `verify_jwt = false`.

### No Database Changes
Stateless generation.

