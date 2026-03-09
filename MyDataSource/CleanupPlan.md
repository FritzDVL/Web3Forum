# Codebase Cleanup Plan - Console Logs

**Date:** March 10, 2026  
**Current State:** 227 console statements in 79 files  
**Goal:** Clean production code, keep useful error logging

---

## 📊 Current Situation

### Console Log Count:
- **Total:** 227 console statements
- **Files affected:** 79 files
- **Types:** console.log, console.error, console.warn, console.debug

### Top Offenders:
1. `scripts/verify-feeds.ts` - 15 logs (script, can keep)
2. `hooks/feeds/use-feed-post-create-form.ts` - 14 logs (our debug code)
3. `hooks/auth/use-switch-account.ts` - 13 logs (our debug code)
4. `lib/external/lens/primitives/groups.ts` - 13 logs
5. `lib/services/feed/create-feed-post.ts` - 11 logs

---

## 🎯 Cleanup Strategy

### Category 1: KEEP (Useful Error Logging)
```javascript
// Keep these - they help debug real issues
console.error("Error creating post:", error);
console.error("Failed to fetch:", error.message);
console.warn("API rate limit approaching");
```

**Why keep:**
- Helps debug production issues
- Only logs on errors
- Minimal performance impact

---

### Category 2: REMOVE (Debug Logging)
```javascript
// Remove these - temporary debug code
console.log("🔍 [Component] Starting...");
console.log("📊 Data:", data);
console.log("✅ Success!");
console.log("Function called with:", params);
```

**Why remove:**
- Performance impact
- Console pollution
- Temporary debug code
- Not useful in production

---

### Category 3: KEEP (Scripts)
```javascript
// In scripts/verify-feeds.ts
console.log("Verifying feeds...");
console.log("✓ Feed verified");
```

**Why keep:**
- Scripts are for development
- Need output to see progress
- Not loaded in production

---

## 🧹 Cleanup Plan

### Phase 1: Remove Our Debug Code (Now)
**Files we just added debug to:**
- `hooks/notifications/use-notifications.ts`
- `lib/services/notifications/get-all-notifications.ts`
- `lib/external/lens/primitives/notifications.ts`
- `app/notifications/page.tsx`
- `hooks/communities/use-join-community.ts`
- `components/communities/display/join-community-button.tsx`
- `hooks/auth/use-switch-account.ts`
- `components/layout/navbar-desktop.tsx`
- `hooks/feeds/use-feed-post-create-form.ts`

**Action:** Remove all console.log with emojis (🔍 📡 🚀 etc.)

---

### Phase 2: Clean Existing Codebase (Later)
**High priority files (lots of logs):**
- `lib/external/lens/primitives/groups.ts` - 13 logs
- `lib/services/feed/create-feed-post.ts` - 11 logs
- `lib/services/thread/create-thread.ts` - 6 logs
- `lib/external/supabase/feeds.ts` - 5 logs
- `lib/external/lens/primitives/feeds.ts` - 5 logs

**Action:** Review each, keep errors, remove debug logs

---

### Phase 3: Establish Logging Standards (Future)
Create a proper logging utility:

```typescript
// lib/utils/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  // Only in development
  debug: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  
  // Always log errors
  error: (...args: any[]) => {
    console.error(...args);
  },
  
  // Warnings in dev and production
  warn: (...args: any[]) => {
    console.warn(...args);
  }
};

// Usage:
logger.debug("🔍 Debug info"); // Only in dev
logger.error("❌ Error:", error); // Always
```

---

## 📋 Immediate Action Items

### For This PR (feature/bug-fixes-phase-1):

**Step 1: Test bugs** (you do this)
- See what the debug logs tell us
- Identify actual issues

**Step 2: Implement fixes** (I do this)
- Fix the actual bugs
- Keep validation code

**Step 3: Remove debug logs** (I do this)
- Remove all our emoji logs
- Keep only error logging
- Keep validation

**Step 4: Merge to main**
- Clean code only
- No debug pollution

---

### For Future PR (codebase-cleanup):

**Create new branch:**
```bash
git checkout main
git checkout -b chore/cleanup-console-logs
```

**Clean up:**
1. Review all 227 console statements
2. Remove debug logs
3. Keep error logging
4. Add proper logger utility
5. Update all files to use logger

**Merge when done:**
- Much cleaner codebase
- Better performance
- Professional code

---

## 🎯 Rules for Console Logs

### ✅ ALLOWED:
```javascript
// Error logging (always useful)
console.error("Error:", error);
console.error("Failed to fetch:", error.message);

// Warnings (important info)
console.warn("Deprecated API used");
console.warn("Rate limit approaching");

// Scripts (development tools)
// In scripts/*.ts files only
console.log("Processing...");
```

### ❌ NOT ALLOWED:
```javascript
// Debug logging
console.log("Function called");
console.log("Data:", data);
console.log("Starting...");

// Success logging
console.log("✅ Success!");
console.log("Done!");

// Verbose logging
console.log("Step 1");
console.log("Step 2");
console.log("Step 3");
```

---

## 📊 Expected Results

### After Phase 1 (This PR):
- Remove ~50 debug logs (our additions)
- Keep validation code
- Clean merge to main

### After Phase 2 (Future PR):
- Remove ~150 debug logs (existing code)
- Keep ~20 error logs
- Keep ~7 script logs
- Total: ~27 console statements (down from 227)

### After Phase 3 (Future):
- Proper logging utility
- Consistent logging across codebase
- Easy to toggle debug mode

---

## 🚀 Timeline

### This Week:
- ✅ Add debug code (done)
- 🔄 Test bugs (in progress)
- ⏳ Implement fixes
- ⏳ Remove debug code
- ⏳ Merge to main

### Next Week:
- Create cleanup branch
- Review all console logs
- Implement logger utility
- Clean up codebase
- Merge cleanup

---

## 💡 Benefits of Cleanup

### Performance:
- Faster app (no console.log overhead)
- Smaller bundle (no debug strings)
- Better mobile performance

### Developer Experience:
- Clean console (easier debugging)
- Professional code
- Easier maintenance

### Security:
- No accidental data logging
- No sensitive info in console
- Better production safety

---

## 📝 Notes

### Why So Many Logs?
- Original developer used console.log for debugging
- Never cleaned up after fixing bugs
- Accumulated over time
- Common in rapid development

### Is This Bad?
- For development: No, it's normal
- For production: Yes, should clean
- For open source: Yes, looks unprofessional

### Priority?
- **High:** Remove our debug code (this PR)
- **Medium:** Clean existing code (next PR)
- **Low:** Add logger utility (future enhancement)

---

## ✅ Action Plan Summary

**Now (This PR):**
1. Test with debug code
2. Fix bugs
3. Remove our debug logs (emoji ones)
4. Merge clean code

**Later (Next PR):**
1. Create cleanup branch
2. Remove all debug logs
3. Keep error logs
4. Add logger utility
5. Merge cleanup

**Result:**
- Professional codebase
- Better performance
- Easier maintenance

---

**Let's focus on testing and fixing bugs first, then we'll do a proper cleanup!** 🚀
