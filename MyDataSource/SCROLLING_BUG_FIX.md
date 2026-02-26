# Scrolling Bug Fix - 2026-02-27

## Issue
Trackpad/mousewheel scrolling was broken. Users had to manually click the scrollbar to scroll the page.

## Root Cause
Multiple conflicting scroll configurations:

1. **`app/globals.css`**: Both `html` and `body` had `overflow-y: auto` + `overscroll-behavior: none`
2. **`app/layout.tsx`**: Inline style `overscrollBehavior: "none"` on `<body>`

These settings were blocking native scroll events from trackpads and mousewheels.

## Fix Applied

### 1. `app/globals.css` (lines 63-67)
**Before:**
```css
html {
  @apply w-full max-w-full overflow-x-hidden overflow-y-auto;
  overscroll-behavior: none;
  overscroll-behavior-y: none;
}
body {
  @apply w-full max-w-full overflow-x-hidden overflow-y-auto bg-background font-custom text-foreground;
  overscroll-behavior: none;
  overscroll-behavior-y: none;
}
```

**After:**
```css
html {
  @apply w-full max-w-full overflow-x-hidden;
}
body {
  @apply w-full max-w-full overflow-x-hidden bg-background font-custom text-foreground;
}
```

**Changes:**
- ❌ Removed `overflow-y: auto` from both elements
- ❌ Removed all `overscroll-behavior` rules
- ✅ Kept `overflow-x: hidden` to prevent horizontal scroll

### 2. `app/layout.tsx` (line 26)
**Before:**
```tsx
<body
  className={`${customFont.variable} bg-white font-custom text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
  suppressHydrationWarning
  style={{ overscrollBehavior: "none" }}
>
```

**After:**
```tsx
<body
  className={`${customFont.variable} bg-white font-custom text-gray-900 dark:bg-gray-900 dark:text-gray-100`}
  suppressHydrationWarning
>
```

**Changes:**
- ❌ Removed inline `style={{ overscrollBehavior: "none" }}`

## Why This Works

1. **Default browser scrolling**: By removing explicit `overflow-y` rules, the browser uses its native scrolling behavior
2. **No scroll blocking**: Removing `overscroll-behavior: none` allows trackpad/mousewheel events to propagate normally
3. **Horizontal scroll prevention**: Keeping `overflow-x: hidden` prevents unwanted horizontal scrolling

## Mobile Verification

✅ **Mobile navbar**: Uses `sticky top-0` positioning (not fixed), won't interfere with scrolling
✅ **Desktop navbar**: Same positioning strategy
✅ **Container**: Uses `min-h-screen` (not `height: 100vh`), allows natural content flow

## Testing Checklist

- [x] Desktop trackpad scrolling
- [x] Desktop mousewheel scrolling
- [x] Mobile touch scrolling
- [x] No horizontal scroll on narrow viewports
- [x] Navbar stays sticky on scroll
- [x] Dark mode compatibility

## Files Modified

1. `app/globals.css` - Removed conflicting overflow rules
2. `app/layout.tsx` - Removed inline overscroll-behavior style

---

**Status**: ✅ Fixed  
**Date**: 2026-02-27  
**Impact**: All scroll methods now work correctly
