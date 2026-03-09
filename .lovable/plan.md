

# Replace Threads with Reddit Post Maker + X Post Maker

## What Changes

1. **Remove**: Twitter Threads tab and all related code (`ThreadBuilder.tsx`, `generate-thread` edge function)
2. **Add**: "Reddit Posts" tab -- generates platform-specific posts for Reddit and other text platforms (HN, Indie Hackers, Dev.to, Product Hunt, etc.), showing users which platforms exist for promotion
3. **Add**: "X Posts" tab -- generates standalone X/Twitter posts (not threads) in startups/products/marketing niches, under 280 chars, with proper line spacing, no emojis, no em dashes, no AI fluff -- pure reach-focused posts

## Technical Details

### 1. Reddit & Text Platforms Post Maker

**New edge function `generate-platform-posts/index.ts`**:
- Takes product info + selected platform(s)
- Platforms list: Reddit (multiple subreddit styles), Hacker News, Indie Hackers, Dev.to, Product Hunt Community, BetaList, Lobsters, Slashdot
- For each platform: generates a post matching that platform's tone, format, and rules (e.g. Reddit title + body, HN title-only, Dev.to markdown article intro)
- Tool call returns: `{ platforms: [{ name, post_title, post_body, tips, subreddit_suggestions? }] }`
- Temperature 1.1 + timestamp seed for unique results

**New component `PlatformPostMaker.tsx`**:
- Left panel: product selector + multi-select checkboxes for platforms (all selected by default so users see the full list of promotion platforms)
- Right panel: generated posts grouped by platform, each with copy button
- Shows platform count badge: "12 platforms available for promotion"

### 2. X Post Maker

**New edge function `generate-x-posts/index.ts`**:
- Takes product info + niche (startups, products, marketing)
- Strict prompt: no emojis, no em dashes, no "game-changer", no AI patterns, must sound like a real founder/marketer. Each post under 280 chars with proper line breaks. Posts should be opinionated, specific, contrarian where appropriate -- the kind that get engagement
- Generates 6 unique posts per tap, each with a different angle
- Temperature 1.2 + timestamp seed so every generation is fresh
- Tool call returns: `{ posts: [{ content, char_count, niche, angle }] }`

**New component `XPostMaker.tsx`**:
- Left panel: product selector + niche selector (Startups, Products, Marketing, or All)
- Right panel: 6 posts displayed as individual cards with char count and copy button
- "Generate More" button for infinite fresh posts

### 3. Marketing.tsx Updates

- Remove `threads` tab and `ThreadBuilder` import
- Add `reddit` tab (icon: `MessageCircle`) and `xposts` tab (icon: `AtSign` or similar)
- Register new components

### 4. Config

- Add `generate-platform-posts` and `generate-x-posts` to `supabase/config.toml` with `verify_jwt = false`
- Can optionally delete `generate-thread/index.ts`

## Files

- **Delete**: `src/components/marketing/ThreadBuilder.tsx`, `supabase/functions/generate-thread/index.ts`
- **Create**: `src/components/marketing/PlatformPostMaker.tsx`, `src/components/marketing/XPostMaker.tsx`, `supabase/functions/generate-platform-posts/index.ts`, `supabase/functions/generate-x-posts/index.ts`
- **Edit**: `src/pages/Marketing.tsx`, `supabase/config.toml`

