# Scroll Lock Fix (Round 2) - 2026-02-27

## Issue
After adding `overscroll-behavior: contain` to fix the bounce color issue, trackpad/mousewheel scrolling was completely locked again.

## Root Cause
The `overscroll-behavior: contain` CSS property on both `html` and `body` elements was blocking scroll events from trackpads and mousewheels.

```css
/* PROBLEMATIC CODE */
html {
  overscroll-behavior: contain;  /* ❌ Blocks scroll events */
}
body {
  overscroll-behavior: contain;  /* ❌ Blocks scroll events */
}
```

## Fix Applied

### `app/globals.css` - Removed overscroll-behavior

**Before:**
```css
html {
  @apply w-full max-w-full overflow-x-hidden bg-slate-100 dark:bg-gray-900;
  overscroll-behavior: contain;
}
body {
  @apply w-full max-w-full overflow-x-hidden bg-slate-100 font-custom text-foreground dark:bg-gray-900;
  overscroll-behavior: contain;
}
```

**After:**
```css
html {
  @apply w-full max-w-full overflow-x-hidden bg-slate-100 dark:bg-gray-900;
}
body {
  @apply w-full max-w-full overflow-x-hidden bg-slate-100 font-custom text-foreground dark:bg-gray-900;
}
```

**Changes:**
- ❌ Removed `overscroll-behavior: contain` from html
- ❌ Removed `overscroll-behavior: contain` from body
- ✅ Kept unified `bg-slate-100` background colors
- ✅ Kept `overflow-x-hidden` to prevent horizontal scroll

## Trade-offs

### ✅ What Works Now
- Trackpad scrolling works perfectly
- Mousewheel scrolling works perfectly
- Touch scrolling on mobile works
- Unified background colors maintained

### ⚠️ Known Issue
- Overscroll bounce may show a slight color difference on some browsers
- This is a minor visual issue vs completely broken scrolling

## Why overscroll-behavior: contain Failed

The `overscroll-behavior` property is meant to prevent scroll chaining (when scrolling in a child element continues to the parent). However, when applied to the root `html` and `body` elements, it can interfere with the browser's native scroll handling, especially for trackpad gestures.

## Alternative Solutions (For Future)

If we need to address the bounce color issue again, consider:

1. **CSS only on specific containers**: Apply `overscroll-behavior` to scrollable divs, not root elements
2. **JavaScript solution**: Detect overscroll and apply styles dynamically
3. **Accept the bounce**: The slight color difference during bounce is minor compared to broken scrolling

## Files Modified

1. `app/globals.css` - Removed `overscroll-behavior: contain` from html and body

## Current State

| Element | Background | Overflow-X | Overflow-Y | Overscroll |
|---------|------------|------------|------------|------------|
| html | `bg-slate-100` | hidden | auto (default) | auto (default) |
| body | `bg-slate-100` | hidden | auto (default) | auto (default) |
| Container | `bg-slate-100` | hidden | auto (default) | auto (default) |

---

**Status**: ✅ Fixed  
**Date**: 2026-02-27  
**Priority**: Scrolling functionality > Bounce color perfection
