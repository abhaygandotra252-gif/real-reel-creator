

# Add 4 Product Visibility Features (No Videos)

Replace the Video Studio with a comprehensive **Marketing Toolkit** that gives users real, actionable ways to boost product visibility on social media and beyond.

## Features Overview

### 1. AI Carousel Generator
Generate multi-slide Instagram/social carousels as downloadable images.
- Select a product, choose a theme (educational tips, product benefits, testimonial, before/after)
- AI generates slide content (headline, body, CTA per slide) via a new `generate-carousel` edge function
- Canvas API renders each slide as a styled image (similar approach to video generator but static — much higher quality since it's just images)
- Download individual slides or all as a zip (using JSZip or individual downloads)
- Supports Instagram (1080x1080), Stories (1080x1920), LinkedIn (1200x627)

### 2. AI Caption & Hashtag Writer
Generate platform-optimized captions and hashtag sets.
- Select a product and platform (Instagram, TikTok, Twitter/X, LinkedIn)
- AI generates 3 caption variations with relevant hashtags, optimal posting time suggestions
- New `generate-captions` edge function using Lovable AI
- Copy-to-clipboard for each caption
- Simple UI — no canvas needed, just text output cards

### 3. Product Mockup Graphics
Generate styled promotional banners and story graphics.
- Uses AI image generation (google/gemini-2.5-flash-image) via a new `generate-mockup` edge function
- User describes the scene or picks a template (lifestyle flat lay, minimal product shot, social ad banner)
- Returns AI-generated promotional image
- Download as PNG

### 4. Email & DM Templates
AI-generated outreach templates for influencer collabs and customer engagement.
- Select template type: influencer outreach, customer follow-up, launch announcement, collab proposal
- AI generates personalized templates based on product details
- New `generate-outreach` edge function
- Copy individual sections or full template

## Technical Plan

### Navigation Change
- Rename "Video Studio" → "Marketing" in sidebar
- Update route from `/studio` to `/marketing`

### New Page: `src/pages/Marketing.tsx`
- Tab-based layout with 4 tabs: Carousels, Captions, Mockups, Outreach
- Each tab is a self-contained component

### New Components
- `src/components/marketing/CarouselGenerator.tsx` — product select, theme picker, canvas-rendered slides, download
- `src/components/marketing/CaptionGenerator.tsx` — product + platform select, AI captions output
- `src/components/marketing/MockupGenerator.tsx` — AI image generation for product graphics
- `src/components/marketing/OutreachGenerator.tsx` — template type select, AI-generated email/DM templates

### New Edge Functions
- `supabase/functions/generate-carousel/index.ts` — generates slide content (headlines, body text per slide)
- `supabase/functions/generate-captions/index.ts` — generates captions + hashtags for selected platform
- `supabase/functions/generate-mockup/index.ts` — uses gemini-2.5-flash-image to generate product mockup images
- `supabase/functions/generate-outreach/index.ts` — generates email/DM templates

### Canvas Carousel Renderer
- `src/lib/carousel-renderer.ts` — takes slide content and renders styled carousel images on canvas
- Professional templates with gradients, typography, brand-consistent styling
- Outputs as PNG data URLs for preview and download

### Config
- Update `supabase/config.toml` with new function entries (verify_jwt = false)

### No Database Changes
All generation is stateless (generate → copy/download). No new tables needed.

