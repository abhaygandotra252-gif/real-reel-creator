
# Switch Video Studio to Built-in Canvas Video Generator

## What Changes

Replace the Kling AI integration in `Studio.tsx` with the existing `src/lib/video-generator.ts` which generates videos entirely in the browser — no API keys, no credits, no external services.

## How It Works Already

The `video-generator.ts` file renders animated scenes frame-by-frame on a Canvas element, then captures them via `MediaRecorder` into a downloadable `.webm` video. It supports:
- **Product Promo**: Gradient backgrounds, particles, animated title text, cycling subtitle keywords, tagline reveal
- **Motion Graphics**: Geometric shapes, kinetic typography with slide-in animations, particle effects, progress bar
- **Aspect ratios**: 16:9, 9:16, 1:1, 4:3
- **Durations**: 5s or 10s at 30fps

## Changes

### 1. Update `Studio.tsx`
- Import `generateVideo` from `@/lib/video-generator`
- Replace `generateVideo()` function to call the local generator instead of Kling AI edge function
- Remove polling logic (canvas generation is instant — takes ~5-15 seconds)
- Show real-time progress bar using the `onProgress` callback
- Store result as a blob URL for preview and download
- Update durations to 5s and 10s (what the generator supports)
- Add 4:3 aspect ratio option
- Update copy to remove Kling AI references
- Keep the "enhance prompt from script" feature (still uses AI to create a good prompt, which feeds keywords to the canvas renderer)

### 2. Update video type
- Change generated video type from `.mp4` to `.webm`
- Update download filename accordingly

### 3. No backend changes needed
- The `generate-video-prompt` edge function stays (it enhances prompts via AI)
- The `kling-video` edge function becomes unused but doesn't need removal

## Result
Videos generate instantly in the browser in 5-15 seconds, completely free, unlimited usage.
