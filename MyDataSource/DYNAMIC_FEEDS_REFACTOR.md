# Dynamic Feeds Refactoring - Complete

**Date**: 2026-02-28  
**Status**: ✅ Complete

---

## Problem Statement

The application had a critical mismatch between:
- **Frontend config** (`config/commons-config.ts`): Static hardcoded feed addresses
- **Database** (`feeds` table): Dynamic feed addresses that could be updated

This caused feeds to break when database addresses were updated, requiring manual config file changes.

---

## Solution: Database-Driven Architecture

### Changes Made

#### 1. Created Service Layer
**File**: `lib/services/feed/get-feeds.ts`

```typescript
export async function getFeedSections(): Promise<FeedSection[]>
```

- Fetches all feeds from Supabase database
- Groups feeds by category (general, partners, functions, technical, others)
- Maps database structure to UI-friendly format
- Maintains category configuration (layout, colors, titles)

#### 2. Updated Homepage
**File**: `app/page.tsx`

**Before**:
```typescript
import { COMMONS_SECTIONS } from "@/config/commons-config";
// Static data from config file
```

**After**:
```typescript
import { getFeedSections } from "@/lib/services/feed/get-feeds";
const feedSections = await getFeedSections();
// Dynamic data from database
```

#### 3. Decoupled Components
**Files**: 
- `components/home/forum-category.tsx`
- `components/home/function-grid.tsx`

- Removed dependency on `@/config/commons-config`
- Now accept generic `Feed` interface
- Work with any feed data structure

---

## Architecture Flow

```
Database (Supabase)
    ↓
lib/external/supabase/feeds.ts
    ↓ fetchAllFeeds()
lib/services/feed/get-feeds.ts
    ↓ getFeedSections()
app/page.tsx
    ↓ props
components/home/forum-category.tsx
components/home/function-grid.tsx
    ↓
User sees feeds
```

---

## Benefits

### 1. **Data-Driven**
- Feed list comes from database
- No code changes needed to add/update feeds
- Single source of truth

### 2. **Scalable**
- Add feeds via database insert
- Update addresses without touching code
- Reorder feeds by changing `display_order`

### 3. **Maintainable**
- No hardcoded addresses in config
- Components are decoupled
- Clear separation of concerns

### 4. **Flexible**
- Can add new categories in database
- Can change feed properties dynamically
- Easy to implement admin UI later

---

## Database Schema Reference

```sql
CREATE TABLE feeds (
  id UUID PRIMARY KEY,
  lens_feed_address TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,  -- 'general', 'partners', 'functions', 'technical', 'others'
  display_order INTEGER NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## How to Add/Update Feeds

### Add New Feed
```sql
INSERT INTO feeds (
  lens_feed_address, 
  title, 
  description, 
  category, 
  display_order
) VALUES (
  '0xYourFeedAddress',
  'Your Feed Title',
  'Your feed description',
  'general',  -- or 'partners', 'functions', 'technical', 'others'
  100
);
```

### Update Feed Address
```sql
UPDATE feeds 
SET lens_feed_address = '0xNewAddress'
WHERE title = 'Beginners & Help';
```

### Reorder Feeds
```sql
UPDATE feeds 
SET display_order = 5
WHERE title = 'Your Feed';
```

---

## Testing

✅ Build successful  
✅ No TypeScript errors  
✅ Components properly typed  
✅ Database queries working  

---

## Migration Notes

### What Changed
- `app/page.tsx`: Now fetches from database
- `lib/services/feed/get-feeds.ts`: New service layer
- `components/home/*`: Removed config dependency

### What Stayed the Same
- UI appearance unchanged
- Component props interface compatible
- User experience identical

### What's Deprecated
- `config/commons-config.ts`: Still exists but no longer used for homepage
- Can be removed in future cleanup

---

## Next Steps (Optional)

1. **Admin UI**: Create interface to manage feeds via dashboard
2. **Caching**: Add Redis/ISR caching for feed list
3. **Validation**: Add feed address validation before insert
4. **Analytics**: Track which feeds are most popular
5. **Cleanup**: Remove `config/commons-config.ts` entirely

---

## Root Cause Analysis

### Original Problem
1. Database seeded with placeholder addresses (`feed-1`, `feed-2`)
2. User manually updated database with real addresses
3. Frontend config still had placeholders
4. Mismatch caused "Feed not found" errors

### Why Hardcoding Was Wrong
- Required code changes for data changes
- Created tight coupling between DB and code
- Not scalable for production
- Error-prone manual synchronization

### Why This Solution Is Right
- Database is single source of truth
- Frontend adapts to database changes
- No code deployment needed for feed updates
- Follows proper separation of concerns

---

**Status**: Production Ready ✅  
**Build**: Passing ✅  
**Tests**: Manual verification complete ✅
