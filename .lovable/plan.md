

# Overhaul Video Generator — Professional Quality Animations

## Problem
The current generator produces basic visuals: a gradient background, tiny particles, and plain Arial text. It looks amateur.

## What Changes

Complete rewrite of `src/lib/video-generator.ts` with cinema-grade canvas rendering:

### 1. Multi-Scene Architecture
Instead of one static composition for the entire video, split into 3-4 scenes with smooth crossfade transitions (fade-to-black or dissolve). Each scene has distinct layout and motion.

### 2. Much Better Visuals
- **Bokeh / light orbs**: Large soft glowing circles with gaussian blur, drifting slowly — replaces tiny particles
- **Light streaks / anamorphic flares**: Horizontal light bands that sweep across
- **Film grain overlay**: Subtle noise texture for cinematic feel
- **Radial gradient light sources**: Moving spotlight effects
- **Grid / wireframe backgrounds** (motion graphics mode): Animated perspective grid lines
- **Glassmorphism panels**: Semi-transparent frosted panels behind text

### 3. Professional Typography
- **Larger, bolder text** with proper letter-spacing
- **Text reveal animations**: Character-by-character or word-by-word with stagger
- **Outlined / stroke text** for secondary words
- **Drop shadow + glow** layered for depth
- **Multiple text sizes** in composition (headline + subline + tagline as distinct visual layers)

### 4. Better Motion
- **Smooth easing curves** (cubic-bezier) instead of linear
- **Parallax layers**: Background moves slower than foreground elements
- **Zoom drift**: Slight continuous zoom-in on the whole scene for dynamism
- **Elastic/bounce** on text entry

### 5. Product Promo Mode
- Scene 1: Brand name reveal with light burst
- Scene 2: Keywords displayed as a stylish grid/list with stagger animation
- Scene 3: Tagline with call-to-action feel, accent underline animating in
- Scene 4: Outro fade with all elements

### 6. Motion Graphics Mode  
- Scene 1: Title slam with screen shake effect
- Scene 2: Words fly in from edges with rotation, stacking vertically
- Scene 3: Abstract shapes morph + scale with text overlay
- Scene 4: All keywords burst outward then fade

### 7. More Palettes
Expand from 5 to 10+ palettes, including modern dark themes (deep navy + neon cyan, black + gold, dark purple + pink gradient).

### 8. Higher Quality Output
- Increase particle/bokeh count to 100+
- Use `ctx.filter = "blur()"` for soft glow effects
- Add composite operations (`screen`, `lighter`) for light effects

## Files Changed
- `src/lib/video-generator.ts` — full rewrite with all above improvements

## No Other Changes
- Studio.tsx stays the same (same API contract)
- No backend changes needed

