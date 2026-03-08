

# Expand Marketing Toolkit — Directory Submissions + Hidden Growth Tactics + Professional Tone Fix

## Problem
1. No way to submit/list products on startup directories (free distribution channels)
2. Missing unconventional growth tactics that actually work at zero users
3. Current AI prompts produce emoji-heavy, generic AI-sounding copy across all tools

## What We'll Add

### New Tab: Directory Listings
Generate ready-to-submit profiles for 10+ product directories where your target audience discovers tools:
- **BetaList** — early adopter directory for pre-launch products
- **AlternativeTo** — "alternatives to X" listings (massive organic traffic)
- **SaaSHub** — SaaS discovery platform
- **ToolFinder / There's An AI For That** — AI tool directories
- **Capterra / G2** — B2B software review sites
- **Product Hunt** (already covered, link to it)
- **Microlaunch** — daily product launches
- **Launching Next** — startup directory
- **BetaPage** — beta product directory
- **StartupBase** — curated startup directory

Each generates: product title, one-liner, full description, category tags, and the submission URL so you can go paste it directly.

### New Tab: Growth Hacks
Unconventional tactics most founders miss. AI generates personalized playbooks based on your product:
- **Cold Value DMs** — reach out to people complaining about the problem you solve (generates specific message templates for Twitter/LinkedIn)
- **Strategic Commenting** — find high-traffic blog posts/YouTube videos in your niche, generate insightful comments that mention your product naturally
- **Quora/StackOverflow Answers** — generate helpful answers to questions your product solves, with natural product mentions
- **Community Seeding** — generate introductory posts for Slack/Discord communities, Facebook Groups in your niche (non-spammy, value-first)
- **Partnership Pitches** — generate co-marketing proposals for complementary products
- **Micro-Influencer Briefs** — generate collaboration briefs for small creators (1K-10K followers) who are cheaper and more effective

### Professional Tone Fix (All Existing Tools)
Update ALL edge function prompts across the 9 existing tools to:
- Remove emoji usage instructions from system prompts
- Add "Write in a clear, professional tone. No emojis. No filler phrases like 'game-changer' or 'revolutionary'. Sound like a human expert, not a marketing bot."
- Remove emoji references from toast messages and UI labels in components

## Technical Plan

### New Edge Functions
- `supabase/functions/generate-directory-listing/index.ts` — generates directory-specific product profiles with submission-ready copy
- `supabase/functions/generate-growth-hacks/index.ts` — generates personalized unconventional growth playbooks

### New Components
- `src/components/marketing/DirectorySubmitter.tsx` — select product, pick directories, get submission-ready copy with direct links
- `src/components/marketing/GrowthHacks.tsx` — select product, pick tactic category, get actionable templates

### Update Marketing.tsx
Add 2 new tabs: "Directories" and "Growth". Total 11 tabs in scrollable bar.

### Update config.toml
Register 2 new functions.

### Professional Tone Updates
Update all 9 existing edge functions' system prompts to enforce professional, non-AI tone. Update all component toast messages and UI strings to remove emojis. Update `generate-captions` to stop forcing emoji-heavy Instagram copy (make it optional per user preference).

### No Database Changes
All stateless.

