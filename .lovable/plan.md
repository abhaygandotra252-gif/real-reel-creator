

# Expand Marketing Toolkit — Zero-to-Launch Growth Suite

## Current State
You have 4 tools: Carousels, Captions, Mockups, Outreach. These are good for social media content but miss key channels for someone starting from zero users.

## What's Missing (and What We'll Add)

### 5 New Tabs in the Marketing Toolkit

**1. Launch Copy Generator**
Generate ready-to-post copy for launch platforms where early adopters hang out:
- Product Hunt (tagline, description, maker comment, first comment)
- Reddit (r/SideProject, r/EntrepreneurRidealong, r/indiehackers — authentic, non-spammy posts)
- Indie Hackers (show & tell post)
- Hacker News (Show HN post)
- Each generates platform-appropriate copy with the right tone and format

**2. Twitter/X Thread Builder**
Generate multi-tweet threads optimized for virality:
- "Building in public" threads (journey stories)
- Product launch threads (hook → problem → solution → CTA)
- "How I built X" breakdown threads
- Outputs numbered tweets with character counts, ready to copy-paste

**3. SEO Content Generator**
Generate organic traffic assets:
- Meta title + description for your landing page
- 5 blog post title ideas with outlines (targeting keywords related to your product)
- Open Graph / social share text
- Alt text suggestions for product images

**4. Ad Copy Generator**
Generate paid acquisition copy for when you're ready to spend:
- Google Ads (headlines + descriptions in character limits)
- Facebook/Instagram Ads (primary text, headline, description)
- Multiple variations for A/B testing
- Different angles: pain point, benefit, social proof, urgency

**5. Landing Page Copy**
Generate conversion-focused website copy:
- Hero headline + subheadline
- Feature section (3-4 features with headlines + descriptions)
- Social proof / testimonial suggestions
- FAQ section (5 common objections turned into answers)
- CTA variations

## Technical Plan

### New Components (one per tab)
- `src/components/marketing/LaunchCopyGenerator.tsx`
- `src/components/marketing/ThreadBuilder.tsx`
- `src/components/marketing/SEOGenerator.tsx`
- `src/components/marketing/AdCopyGenerator.tsx`
- `src/components/marketing/LandingCopyGenerator.tsx`

### New Edge Functions
- `supabase/functions/generate-launch-copy/index.ts`
- `supabase/functions/generate-thread/index.ts`
- `supabase/functions/generate-seo/index.ts`
- `supabase/functions/generate-ad-copy/index.ts`
- `supabase/functions/generate-landing-copy/index.ts`

All use Lovable AI (`google/gemini-3-flash-preview`) with structured tool calls for reliable JSON output. Same pattern as existing edge functions.

### Update Marketing.tsx
Add 5 new tabs. Switch from `TabsList` to a scrollable tab bar so all 9 tabs fit on mobile.

### Update config.toml
Register all new functions with `verify_jwt = false`.

### No Database Changes
All stateless — generate and copy/download. No new tables needed.

## Result
A complete marketing launch toolkit: from writing your Product Hunt post, to crafting Twitter threads, to generating Google Ads — all from one product entry. Zero to everywhere.

