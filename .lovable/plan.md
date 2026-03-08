

# Responsive Optimization Plan

## Issues Found

After reviewing all pages and components, here are the responsive gaps:

1. **Marketing tabs bar**: 12 tabs each showing icon + label — overflows badly on mobile, requires excessive horizontal scrolling
2. **All marketing tool layouts**: Use `lg:grid-cols-5` breakpoint, so on tablets (768-1024px) everything stacks into a single column unnecessarily — wastes half the screen on iPads
3. **ProspectFinder nested tabs**: 5 sub-tabs with icons + labels inside the Prospects tab — same overflow problem on mobile
4. **Products dialog**: `grid-cols-2` for Target Audience / Category fields has no mobile fallback — fields get cramped on small screens
5. **Generate page**: Script output title + action buttons don't wrap on narrow screens
6. **App.css**: Contains unused Vite boilerplate styles that could cause layout conflicts
7. **Sidebar**: No tablet-specific behavior — on iPad it either shows full sidebar (eating 256px) or hides completely

## Changes

### Marketing Tabs (Marketing.tsx)
- Mobile: show only icons (no labels) with smaller tab triggers
- Tablet+: show icon + label as current

### All 12 Marketing Components
- Change `lg:grid-cols-5` to `md:grid-cols-5` so the sidebar/output split layout kicks in at tablet width (768px) instead of 1024px
- This affects: LaunchCopyGenerator, DirectorySubmitter, GrowthHacks, ThreadBuilder, CaptionGenerator, CarouselGenerator, SEOGenerator, AdCopyGenerator, LandingCopyGenerator, MockupGenerator, OutreachGenerator, ProspectFinder

### ProspectFinder Nested Tabs
- Mobile: icon-only tabs, stacked results
- Tablet+: icon + label

### Products Page
- Make dialog `grid-cols-2` responsive: `grid-cols-1 sm:grid-cols-2`
- Ensure delete button is always visible on touch devices (no hover-only opacity)

### Generate Page
- Wrap title + action buttons on mobile
- Stack "Copy All" and "Save" buttons below title on small screens

### Scripts Page
- Make delete button visible on mobile (touch devices can't hover)
- Ensure script metadata badges wrap properly

### App.css
- Remove unused Vite boilerplate (#root max-width, padding, .logo, .card, .read-the-docs)

### Sidebar (AppSidebar)
- On tablet (md-lg), use a collapsed icon-only sidebar (w-16) instead of full 256px
- On desktop (lg+), show full sidebar with labels
- Update AppLayout `md:ml-64` to match

## Scope
- 16 files modified
- No database changes
- No new dependencies
- Pure CSS/Tailwind class adjustments + minor JSX restructuring

