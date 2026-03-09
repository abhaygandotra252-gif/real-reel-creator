

# Fix PDF Download — Mobile Compatibility

## Problem
The `printAsPdf` function uses a hidden iframe + `window.print()`, which doesn't work reliably on mobile browsers (especially inside Lovable's embedded preview). The PDF either shows blank content or fails to trigger the print dialog.

## Solution
Replace the hidden iframe approach with `window.open()` — open the styled HTML in a new browser tab, then trigger `window.print()` from that tab. This works on both desktop and mobile, gives the user a visible page they can print/save as PDF, and avoids iframe sandboxing issues.

## Changes

**`src/lib/pdf-export.ts`** — Rewrite to use `window.open()`:
- Open a new tab with `window.open("")`
- Write the same styled HTML document into the new tab
- Call `newWindow.print()` after a short delay
- The user sees the actual content and can save as PDF from the browser's print dialog

This is a single-file change. No other files need modification since `ProspectFinder.tsx` and `SEOGenerator.tsx` already call `printAsPdf` correctly.

