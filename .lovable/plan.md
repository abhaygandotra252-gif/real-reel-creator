

# Color Palette, Fresh Results, and PDF Downloads

## What's Being Built

1. **Brand color palette on products** — Add a `brand_colors` field (JSON array of hex codes) to the products table. In the product form / carousel generator, let users either paste their website URL to auto-extract colors or manually pick colors. Confirm the palette before generating. Exclude mockups from this flow.

2. **Fresh results every time** — Add `temperature: 1.2` and a random seed instruction to both `generate-prospect-search` and `generate-seo` edge functions so every tap produces different content.

3. **Download as PDF** — Add "Download PDF" buttons to the Prospect Playbook results and the SEO Blog Ideas section. Use browser-native `window.print()` with a styled print view (no external library needed).

## Technical Details

### 1. Brand Colors on Products

**Database migration**: Add `brand_colors text[]` column to `products` table (nullable, default null).

**New edge function `extract-brand-colors`**: Takes a URL, fetches the page HTML, extracts hex colors from CSS custom properties / meta theme-color / inline styles using regex. Returns top 4-5 dominant colors. Uses the Lovable AI gateway to analyze: "Given this website's HTML, extract the primary brand color palette as hex codes."

**Carousel Generator changes** (`CarouselGenerator.tsx`):
- Add a "Use Brand Colors" toggle alongside the existing preset palettes
- When toggled on, if the product has `brand_colors`, use those; otherwise show a prompt to enter a URL or pick colors manually
- Add a color confirmation step: show swatches and "Use these colors" / "Edit" buttons
- Pass custom palette to `renderAllSlides` by adding a `customPalette` parameter to `carousel-renderer.ts`

**carousel-renderer.ts**: Accept an optional custom palette object `{ bg: string[], text: string, accent: string, sub: string }` that overrides the preset when provided.

### 2. Always Fresh Results

**`generate-prospect-search/index.ts`**: Add `temperature: 1.2` to the API call body. Prepend a randomness instruction to the system prompt: `"Generate completely unique and creative results. Do not repeat patterns from previous generations. Current session: ${Date.now()}"`

**`generate-seo/index.ts`**: Same approach — add `temperature: 1.1` and a timestamp-based uniqueness instruction to ensure different blog ideas each time.

### 3. PDF Downloads

**ProspectFinder.tsx**: Add a "Download PDF" button next to "Copy Entire Playbook". On click, create a hidden iframe, write the playbook as styled HTML, and call `iframe.contentWindow.print()`. This gives users a native Save as PDF option with clean formatting.

**SEOGenerator.tsx**: Add a "Download Blog Ideas PDF" button in the Blog Post Ideas card. Same print-to-PDF approach, formatting blog titles, keywords, and outlines.

Utility: Create a shared `src/lib/pdf-export.ts` helper with a `printAsPdf(title: string, htmlContent: string)` function that both components use.

## Files Modified
- `supabase/functions/generate-prospect-search/index.ts` — add temperature + uniqueness seed
- `supabase/functions/generate-seo/index.ts` — add temperature + uniqueness seed
- `supabase/functions/extract-brand-colors/index.ts` — new edge function
- `supabase/config.toml` — register new function
- `src/lib/carousel-renderer.ts` — accept custom palette
- `src/lib/pdf-export.ts` — new shared PDF helper
- `src/components/marketing/CarouselGenerator.tsx` — brand color toggle + confirmation
- `src/components/marketing/ProspectFinder.tsx` — Download PDF button
- `src/components/marketing/SEOGenerator.tsx` — Download PDF button
- Database migration: add `brand_colors` column to `products`

