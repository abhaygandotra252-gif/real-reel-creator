

# Prospect Finder — Mobile Optimization + Clarity Overhaul

## Problems
1. **Results tabs overflow on mobile** — 5 tabs with icons + text in a single row don't fit on small screens, and there's no ScrollArea wrapping them
2. **No guidance** — the tool dumps raw data (search queries, signals, personas, templates, playbook) without explaining the workflow: what to do first, how these pieces connect
3. **Dense cards** — on mobile, persona cards and DM template cards have too much packed in with tiny labels

## Changes to `ProspectFinder.tsx`

### Add a "How This Works" guide section
Above the results, add a numbered step-by-step explainer that appears after generation:
- **Step 1: Search** — Copy a search query below, paste it into [platform]. Browse the results for people matching the ICP signals.
- **Step 2: Identify** — Look at the prospect personas to understand who you're looking for. Check profiles against the ICP signals list.
- **Step 3: Engage first** — Follow the engagement playbook. Don't DM immediately — interact with their content for 2-3 days first.
- **Step 4: Reach out** — Use the DM templates to send a value-first message. Never pitch on the first message.

This makes the whole flow crystal clear.

### Wrap results tabs in ScrollArea
Add `ScrollArea` + `ScrollBar` around the `TabsList` so all 5 tabs are accessible via horizontal scroll on mobile (same pattern as Marketing.tsx).

### Improve card readability on mobile
- Persona cards: stack to `grid-cols-1` always (remove `sm:grid-cols-2` — these are dense cards that need full width)
- DM templates: add clearer section headers with background highlights
- Search queries: make the copy button more prominent with "Copy" text label on mobile
- Playbook steps: increase step number circle size slightly, add subtle connector lines between steps

### Add "Copy All" button
A single button at the top of results that copies the entire playbook as formatted text — search queries, templates, everything — so users can paste it into their notes app.

## Files Modified
- `src/components/marketing/ProspectFinder.tsx` — all changes in this single file

