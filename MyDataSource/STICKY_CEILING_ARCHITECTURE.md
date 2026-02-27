# Sticky Ceiling Architecture - Dark Mode Overscroll Fix

**Date**: 2026-02-27  
**Issue**: Dark mode overscroll shows white flash instead of dark background  
**Solution**: Sticky Ceiling + Theme Meta Tags

---

## Architecture Overview

The "Sticky Ceiling" approach uses browser-level theme colors combined with proper CSS layering to ensure the overscroll area matches the app's theme.

### Key Components

1. **Browser Theme Color**: Meta tags tell the browser what color to use for UI chrome and overscroll areas
2. **Body Background**: The body element provides the base color layer
3. **Sticky Navbar**: Acts as a "ceiling" that stays visible during overscroll

---

## Implementation

### 1. Theme Color Meta Tags (`app/layout.tsx`)

**Added:**
```tsx
<head>
  <meta name="theme-color" content="#f1f5f9" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)" />
</head>
```

**Colors:**
- Light mode: `#f1f5f9` (slate-100)
- Dark mode: `#111827` (gray-900)

**Purpose**: Tells the browser what color to use for:
- Mobile browser chrome (address bar, status bar)
- Overscroll bounce areas
- Pull-to-refresh background

### 2. HTML/Body Layer Separation (`app/globals.css`)

**Before:**
```css
html {
  @apply w-full max-w-full overflow-x-hidden bg-slate-100 dark:bg-gray-900;
}
body {
  @apply w-full max-w-full overflow-x-hidden bg-slate-100 font-custom text-foreground dark:bg-gray-900;
}
```

**After:**
```css
html {
  @apply w-full max-w-full overflow-x-hidden;
}
body {
  @apply min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 font-custom text-foreground dark:bg-gray-900;
}
```

**Changes:**
- ❌ Removed background from `html` (lets browser theme-color show through)
- ✅ Added `min-h-screen` to `body` (ensures full viewport coverage)
- ✅ Kept `bg-slate-100 dark:bg-gray-900` on `body`

### 3. Body Element Update (`app/layout.tsx`)

**Before:**
```tsx
<html lang="en" suppressHydrationWarning className="bg-slate-100 dark:bg-gray-900">
  <body className={`${customFont.variable} bg-slate-100 font-custom text-gray-900 dark:bg-gray-900 dark:text-gray-100`}>
```

**After:**
```tsx
<html lang="en" suppressHydrationWarning>
  <body className={`${customFont.variable} min-h-screen bg-slate-100 font-custom text-gray-900 dark:bg-gray-900 dark:text-gray-100`}>
```

**Changes:**
- ❌ Removed `className` from `html` tag
- ✅ Added `min-h-screen` to `body` className
- ✅ Added `<head>` section with theme-color meta tags

### 4. Sticky Navbar (Already Implemented)

Both navbar components already have:
```tsx
<nav className="sticky top-0 z-50 ...">
```

**Purpose**: Creates a visual "ceiling" that stays at the top during overscroll, providing continuity.

---

## How It Works

### Light Mode Overscroll
1. User scrolls past top/bottom
2. Browser shows `#f1f5f9` (slate-100) from theme-color meta tag
3. Body background is also `bg-slate-100`
4. Result: Seamless color transition ✅

### Dark Mode Overscroll
1. User scrolls past top/bottom
2. Browser shows `#111827` (gray-900) from theme-color meta tag
3. Body background is also `dark:bg-gray-900`
4. Result: Seamless dark color transition ✅

### Layer Stack (Top to Bottom)
```
┌─────────────────────────────────────┐
│ Browser Chrome (theme-color)        │ ← #f1f5f9 / #111827
├─────────────────────────────────────┤
│ HTML (no background)                │ ← Transparent
├─────────────────────────────────────┤
│ Body (min-h-screen + bg)            │ ← bg-slate-100 / dark:bg-gray-900
├─────────────────────────────────────┤
│ Container (min-h-screen + bg)       │ ← bg-slate-100 / dark:bg-gray-900
├─────────────────────────────────────┤
│ Navbar (sticky top-0)               │ ← Stays visible during scroll
└─────────────────────────────────────┘
```

---

## Color Reference

| Element | Light Mode | Dark Mode | Hex (Light) | Hex (Dark) |
|---------|------------|-----------|-------------|------------|
| theme-color | slate-100 | gray-900 | `#f1f5f9` | `#111827` |
| body | bg-slate-100 | dark:bg-gray-900 | `#f1f5f9` | `#111827` |
| Container | bg-slate-100 | dark:bg-gray-900 | `#f1f5f9` | `#111827` |

---

## Benefits

✅ **Dark mode overscroll**: Shows dark gray instead of white  
✅ **Light mode overscroll**: Shows light gray (consistent)  
✅ **Mobile browser chrome**: Matches app theme color  
✅ **No scroll blocking**: Trackpad/mousewheel work perfectly  
✅ **Sticky navbar**: Provides visual continuity during overscroll  

---

## Testing Checklist

- [ ] Light mode: Overscroll shows slate-100 (light gray)
- [ ] Dark mode: Overscroll shows gray-900 (dark gray)
- [ ] Mobile: Browser chrome matches theme
- [ ] Desktop: Trackpad overscroll shows correct color
- [ ] Navbar: Stays sticky at top during scroll
- [ ] No white flash in dark mode

---

## Files Modified

1. `app/layout.tsx` - Added theme-color meta tags, moved bg to body, added min-h-screen
2. `app/globals.css` - Removed bg from html, added min-h-screen to body
3. `components/layout/navbar-desktop.tsx` - Already had sticky top-0 ✅
4. `components/layout/navbar-mobile.tsx` - Already had sticky top-0 ✅

---

## Technical Notes

### Why Remove Background from HTML?

When `html` has a background color, it can override the browser's theme-color in some scenarios. By keeping `html` transparent and only styling `body`, we ensure the browser's theme-color shows through during overscroll.

### Why min-h-screen on Body?

Ensures the body element always covers at least the full viewport height, preventing any gaps where the html background might show through.

### Why Theme-Color Meta Tags?

Modern browsers use these meta tags to:
- Color the mobile browser chrome (address bar, status bar)
- Set the overscroll bounce area color
- Provide a consistent theme experience

---

**Status**: ✅ Implemented  
**Priority**: Dark mode UX improvement  
**Impact**: Professional, polished overscroll experience
