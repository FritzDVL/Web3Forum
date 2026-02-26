# Overscroll Bounce Color Fix - 2026-02-27

## Issue
When scrolling past the top or bottom of the page (bounce effect), a different background color was visible, creating a jarring visual experience.

## Root Cause
Background color mismatch between layers:
- **html**: `bg-white` (white)
- **body**: `bg-white` (white)  
- **Container**: `bg-slate-100` (light gray)

When the page "bounced," the white background from html/body was visible instead of the slate-100 gray used throughout the app.

## Fix Applied

### 1. `app/layout.tsx` - Synced Background Colors

**Before:**
```tsx
<html lang="en" suppressHydrationWarning className="bg-white dark:bg-gray-900">
  <body
    className={`${customFont.variable} bg-white font-custom text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
```

**After:**
```tsx
<html lang="en" suppressHydrationWarning className="bg-slate-100 dark:bg-gray-900">
  <body
    className={`${customFont.variable} bg-slate-100 font-custom text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
```

**Changes:**
- ✅ Changed `bg-white` → `bg-slate-100` on both html and body
- ✅ Matches Container's `bg-slate-100` background
- ✅ Dark mode already matched (`dark:bg-gray-900`)

### 2. `app/globals.css` - Added Overscroll Containment

**Before:**
```css
html {
  @apply w-full max-w-full overflow-x-hidden;
}
body {
  @apply w-full max-w-full overflow-x-hidden bg-background font-custom text-foreground;
}
```

**After:**
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

**Changes:**
- ✅ Added explicit `bg-slate-100 dark:bg-gray-900` to CSS
- ✅ Added `overscroll-behavior: contain` to prevent bounce from leaking to browser
- ✅ Replaced generic `bg-background` with specific color

## Why This Works

1. **Color Sync**: All layers (html → body → Container) now use the same `bg-slate-100` color
2. **Overscroll Containment**: `overscroll-behavior: contain` allows smooth trackpad scrolling but prevents the bounce effect from propagating to the parent browser window
3. **Dark Mode**: Already consistent with `dark:bg-gray-900` across all layers

## Benefits

✅ **No color flash**: Bounce effect shows consistent slate-100 background  
✅ **Smooth scrolling**: Trackpad/mousewheel still work perfectly  
✅ **Contained bounce**: Overscroll doesn't leak to browser chrome  
✅ **Dark mode**: Consistent gray-900 background when bouncing  

## Color Reference

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| html | `bg-slate-100` | `bg-gray-900` |
| body | `bg-slate-100` | `bg-gray-900` |
| Container | `bg-slate-100` | `bg-gray-900` |

## Files Modified

1. `app/layout.tsx` - Changed html/body from `bg-white` to `bg-slate-100`
2. `app/globals.css` - Added explicit backgrounds and `overscroll-behavior: contain`

---

**Status**: ✅ Fixed  
**Date**: 2026-02-27  
**Impact**: Consistent background color during overscroll bounce
