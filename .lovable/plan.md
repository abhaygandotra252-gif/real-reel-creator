

# Show Text Labels Everywhere — No Icon-Only States

## Problem
The sidebar on tablet shows only icons (no text labels), and the marketing tabs on mobile show only icons. The user wants readable text everywhere.

## Changes

### 1. Sidebar (`AppSidebar.tsx`)
- Remove the tablet icon-only state (`md:w-16`). Make sidebar always full-width (`w-64`) when visible.
- Show text labels at all breakpoints (remove `hidden lg:block` from labels, use `hidden md:block`).
- On mobile: keep the slide-over behavior (hamburger menu opens it).
- On `md+`: sidebar is always visible at `w-64` with full text labels.

### 2. AppLayout (`AppLayout.tsx`)
- Change `md:ml-16 lg:ml-64` to just `md:ml-64` since the sidebar is always 64 wide on md+.
- Mobile header shows only below `md`.

### 3. Marketing Tabs (`Marketing.tsx`)
- Remove `hidden sm:inline` from tab labels — always show text.
- Keep icons + text at all sizes. The ScrollArea handles overflow with horizontal scrolling.

### 4. ProspectFinder Nested Tabs (`ProspectFinder.tsx`)
- Same fix: remove `hidden sm:inline` from sub-tab labels so text is always visible.

## Files Modified
- `src/components/AppSidebar.tsx`
- `src/components/AppLayout.tsx`
- `src/pages/Marketing.tsx`
- `src/components/marketing/ProspectFinder.tsx`

