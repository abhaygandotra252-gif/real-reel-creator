

# Fix: Mobile/Tablet/Desktop Responsive Layout

The screenshot shows the dashboard is broken on mobile — the hero text is massive, content isn't properly contained, and the layout doesn't adapt to screen sizes.

## Problems Identified
1. Hero heading `text-4xl` is too large on mobile — text wraps badly and takes up the entire screen
2. Content padding and spacing not optimized per breakpoint
3. Cards and stats grid need better mobile sizing
4. Quick Create card text overflows on small screens
5. All pages (Products, Generate, Scripts, Studio) have similar sizing issues
6. Generate page 5-column grid doesn't collapse properly on tablet

## Changes

### AppLayout (`src/components/AppLayout.tsx`)
- Reduce padding on mobile: `px-4 py-4` → `sm:px-6 md:px-8 md:py-8`

### Index/Dashboard (`src/pages/Index.tsx`)
- Hero: `text-4xl` → `text-2xl sm:text-3xl md:text-4xl`
- Description: `text-lg` → `text-sm sm:text-base md:text-lg`
- Reduce margins on mobile (`mb-6` instead of `mb-8` on small screens)
- Quick Create card: smaller icon + text on mobile
- Stats: responsive padding in cards

### Products (`src/pages/Products.tsx`)
- Heading: `text-3xl` → `text-2xl sm:text-3xl`
- Header flex: stack on mobile (title above button)
- Dialog: full-screen on mobile with proper sizing

### Generate (`src/pages/Generate.tsx`)
- Heading: responsive sizing
- Grid: `lg:grid-cols-5` → keep but ensure single-column stacks cleanly on mobile/tablet

### Scripts (`src/pages/Scripts.tsx`)
- Heading: responsive sizing
- Script metadata chips: wrap properly on small screens

### Studio (`src/pages/Studio.tsx`)
- Heading and content: responsive sizing
- Buttons: stack vertically on mobile

All changes are CSS/Tailwind class adjustments — no structural changes needed.

