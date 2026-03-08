

# Fix: Actually Generate Videos in Studio

## Problem
The `generateVideo` function calls a non-existent `/api/generate-video` endpoint and just stores the prompt with an empty URL. No actual video is created.

## Solution: Client-Side Motion Graphics Video Generator

Since there's no free video generation API available, I'll build a **real client-side video generator** using the **Canvas API + MediaRecorder**. This creates actual downloadable `.webm` video files directly in the browser — no API costs.

### What it will generate

**Product Promo videos:**
- Animated text overlays with product name/tagline
- Gradient backgrounds with particle effects
- Smooth fade-in/out transitions, scale animations
- Professional-looking kinetic text sequences

**Motion Graphics videos:**
- Dynamic typography animations (words flying in, scaling, rotating)
- Abstract shape animations (circles, rectangles morphing)
- Color gradient transitions
- Particle systems

### Technical approach

1. **New utility: `src/lib/video-generator.ts`**
   - Canvas-based animation renderer
   - Uses `canvas.captureStream()` + `MediaRecorder` to produce real WebM video files
   - Two render modes: `product-promo` and `motion-graphics`
   - Supports all 4 aspect ratios and both durations (5s/10s)
   - Parses prompt text to extract key words for animated display

2. **Update `src/pages/Studio.tsx`**
   - Replace the fake fetch with the real canvas video generator
   - Generated videos get a blob URL that works with `<video>` player and download button
   - Show a progress indicator during generation (real-time, takes ~5-10 seconds)

3. **Edge function `generate-video-prompt`** — keep as-is for the "enhance from script" feature

### Result
Users click "Generate Video" → see a progress bar → get a real playable/downloadable video with animated text and motion graphics based on their prompt.

