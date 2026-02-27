# Codebase Status Report - 2026-02-27

## Executive Summary

**Embassy System (Communities)**: ✅ Fully functional  
**Feed System (Commons)**: ❌ 0% implemented (UI only)  
**Gap**: Missing routes, services, database tables, and components for feeds

---

## 1. EMBASSY STATUS (Communities) ✅

### Route: `app/communities/[address]/page.tsx`

**Status**: ✅ Fully functional

**Implementation**:
```tsx
- Imports: CommunityThreads component
- Services: getCommunity(), getCommunityThreads()
- Features: 
  ✅ Fetches community from Supabase
  ✅ Fetches threads with pagination
  ✅ Cookie-based crosspost preference
  ✅ Protected route (auth required)
  ✅ Error handling (community not found)
```

**Create Post Button**: ✅ Working
- Located in `CommunityNavActions` component
- Route: `/communities/[address]/new-thread`
- Full thread creation flow implemented

**Database Support**: ✅ Complete
- `communities` table (Supabase)
- `community_threads` table (Supabase)
- Helper functions for counts

**Services**: ✅ Complete
- `lib/services/community/` (12 files)
- `lib/services/thread/` (8 files)
- `lib/services/membership/` (5 files)

---

## 2. FEED STATUS (Commons) ❌

### Route: `app/commons/[address]/page.tsx`

**Status**: ❌ Does not exist

**Current State**:
- No `/commons/` directory in `app/`
- All 28 feed links on homepage are broken
- Links point to `/commons/feed-1`, `/commons/feed-2`, etc.

**What's Missing**:
```
❌ app/commons/[address]/page.tsx
❌ app/commons/[address]/new-thread/page.tsx
❌ components/commons/ (entire directory)
❌ lib/services/feed/ (entire directory)
❌ Database tables for feeds
```

---

## 3. SUPABASE CONNECTION ANALYSIS

### Communities (Working) ✅

**Service**: `lib/services/community/get-featured-communities.ts`

**Flow**:
```
1. fetchFeaturedCommunities() → Supabase query
2. Extract lens_group_address from DB
3. Batch fetch from Lens Protocol:
   - fetchGroupsBatch()
   - fetchGroupStatsBatch()
   - fetchGroupAdminsBatch()
4. adaptGroupToCommunity() → Transform to UI objects
5. Return Community[]
```

**Database Tables Used**:
- `communities` (stores lens_group_address, name, featured flag)
- `community_threads` (stores threads for each community)

### Feeds (Missing) ❌

**Service**: Does not exist

**Expected Flow** (not implemented):
```
1. fetchFeaturedFeeds() → Supabase query ❌
2. Extract lens_feed_address from DB ❌
3. Batch fetch from Lens Protocol:
   - fetchFeedsBatch() ✅ (exists in primitives)
   - fetchFeedPostsBatch() ❌ (does not exist)
4. adaptFeedToCommons() ❌ (does not exist)
5. Return Feed[] ❌
```

**Database Tables**: ❌ Do not exist
- `feeds` table (should store lens_feed_address, title, description)
- `feed_posts` table (should cache posts from Lens feeds)

---

## 4. GAP ANALYSIS: What's Missing for Commons/Feeds

### A. Database Layer (Supabase)

**Missing Tables**:

```sql
-- feeds table (similar to communities)
CREATE TABLE feeds (
  id UUID PRIMARY KEY,
  lens_feed_address TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- "general", "partners", "functions", "technical", "others"
  display_order INTEGER,
  is_locked BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- feed_posts table (similar to community_threads)
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY,
  feed_id UUID REFERENCES feeds(id),
  lens_post_id TEXT UNIQUE NOT NULL,
  author TEXT NOT NULL,
  title TEXT,
  content TEXT,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Migration Needed**:
- `supabase/migrations/YYYYMMDD_create_feeds_tables.sql`

### B. Supabase Client Functions

**Missing**: `lib/external/supabase/feeds.ts`

```typescript
// Needed functions:
- fetchAllFeeds() → Get all feeds from DB
- fetchFeedByAddress(address: string) → Get single feed
- fetchFeedPosts(feedId: string) → Get cached posts
- insertFeedPost(post: FeedPost) → Cache new post
- updateFeedPostRepliesCount(postId: string) → Increment replies
```

**Existing Pattern**: `lib/external/supabase/communities.ts` (use as template)

### C. Lens Protocol Integration

**Existing** ✅:
- `lib/external/lens/primitives/feeds.ts`
  - `fetchFeed(address)` ✅
  - `fetchFeedsBatch(addresses)` ✅
  - `createFeed()` ✅

**Missing** ❌:
- `lib/external/lens/primitives/feed-posts.ts`
  - `fetchFeedPosts(feedAddress)` ❌
  - `createFeedPost(feedAddress, content)` ❌
  - `fetchFeedPostsBatch(feedAddresses)` ❌

**Note**: Lens Protocol uses "posts" or "articles" for feed content. Need to determine which primitive to use.

### D. Service Layer

**Missing**: `lib/services/feed/` directory

**Required Files**:
```
lib/services/feed/
  ├── get-feed.ts                    // Get single feed
  ├── get-featured-feeds.ts          // Get featured feeds for homepage
  ├── get-feed-posts.ts              // Get posts for a feed
  ├── create-feed-post.ts            // Create new post in feed
  └── get-feed-posts-paginated.ts   // Paginated posts
```

**Pattern**: Copy from `lib/services/community/` and adapt

### E. Adapter Layer

**Missing**: `lib/adapters/feed-adapter.ts`

```typescript
// Needed functions:
- adaptLensFeedToFeed(lensFeed, dbFeed) → Feed
- adaptLensPostToFeedPost(lensPost) → FeedPost
```

**Existing Pattern**: `lib/adapters/community-adapter.ts` (use as template)

### F. Domain Types

**Missing**: `lib/domain/feeds/types.ts`

```typescript
export interface Feed {
  id: string;
  address: string;
  title: string;
  description: string;
  category: string;
  isLocked: boolean;
  postCount: number;
  // ... other fields
}

export interface FeedPost {
  id: string;
  feedId: string;
  lensPostId: string;
  author: string;
  title: string;
  content: string;
  repliesCount: number;
  createdAt: Date;
  // ... other fields
}
```

### G. React Components

**Missing**: `components/commons/` directory

**Required Components**:
```
components/commons/
  ├── feed-header.tsx              // Feed title, description
  ├── feed-posts-list.tsx          // List of posts in feed
  ├── feed-post-card.tsx           // Individual post card
  ├── feed-nav-actions.tsx         // "New Post" button
  ├── feed-sidebar.tsx             // Feed info sidebar
  └── create-post-form.tsx         // Post creation form
```

**Pattern**: Copy from `components/communities/` and adapt

### H. React Hooks

**Missing**: `hooks/feeds/` directory

**Required Hooks**:
```
hooks/feeds/
  ├── use-feed.ts                  // Fetch single feed
  ├── use-feed-posts.ts            // Fetch posts for feed
  ├── use-feed-posts-paginated.ts // Paginated posts
  └── use-create-feed-post.ts     // Create post mutation
```

**Pattern**: Copy from `hooks/communities/` and adapt

### I. App Routes

**Missing**: `app/commons/` directory

**Required Routes**:
```
app/commons/
  ├── [address]/
  │   ├── page.tsx                 // Feed detail page
  │   └── new-post/
  │       └── page.tsx             // Create post page
  └── page.tsx                     // All feeds list (optional)
```

**Pattern**: Copy from `app/communities/` and adapt

---

## 5. IMPLEMENTATION PRIORITY

### Phase 1: Database Foundation (1-2 hours)
1. Create `feeds` and `feed_posts` tables in Supabase
2. Seed `feeds` table with 28 feeds from `config/commons-config.ts`
3. Create Supabase client functions (`lib/external/supabase/feeds.ts`)

### Phase 2: Lens Integration (2-3 hours)
1. Create `lib/external/lens/primitives/feed-posts.ts`
2. Implement `fetchFeedPosts()` and `createFeedPost()`
3. Test Lens Protocol feed queries

### Phase 3: Service & Adapter Layer (2-3 hours)
1. Create `lib/services/feed/` directory with core services
2. Create `lib/adapters/feed-adapter.ts`
3. Create `lib/domain/feeds/types.ts`

### Phase 4: UI Components (3-4 hours)
1. Create `components/commons/` directory
2. Implement feed detail components
3. Implement post creation form

### Phase 5: Routes & Hooks (2-3 hours)
1. Create `app/commons/[address]/page.tsx`
2. Create `app/commons/[address]/new-post/page.tsx`
3. Create hooks in `hooks/feeds/`

### Phase 6: Testing & Polish (1-2 hours)
1. Test all 28 feed links
2. Test post creation
3. Test pagination
4. Fix any bugs

**Total Estimated Time**: 11-17 hours

---

## 6. QUICK WIN: Minimal Viable Feed Page

To unblock the 28 broken links quickly, create a minimal feed page:

**File**: `app/commons/[address]/page.tsx`

```tsx
export default async function FeedPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  
  // TODO: Fetch feed from Supabase
  // TODO: Fetch posts from Lens Protocol
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Feed: {address}</h1>
      <p className="mt-4 text-gray-600">
        This feed page is under construction. Posts will appear here soon.
      </p>
      {/* TODO: Add feed posts list */}
      {/* TODO: Add "Create Post" button */}
    </div>
  );
}
```

This would:
- ✅ Fix all 28 broken links
- ✅ Show a placeholder page
- ✅ Allow incremental development

---

## 7. EXISTING ASSETS (Can Be Reused)

### ✅ Lens Protocol Primitives
- `lib/external/lens/primitives/feeds.ts` (fetch feeds)
- `lib/external/lens/primitives/articles.ts` (create articles)
- `lib/external/lens/primitives/posts.ts` (create posts)

### ✅ UI Components (Reusable)
- `components/editor/` (rich text editor)
- `components/shared/pagination.tsx`
- `components/shared/status-banner.tsx`
- `components/ui/` (all shadcn components)

### ✅ Patterns to Copy
- Community system architecture
- Thread creation flow
- Pagination logic
- Supabase caching strategy

---

## 8. DECISION POINT

### Option A: Full Implementation (11-17 hours)
- Complete feed system with all features
- Matches community system functionality
- Production-ready

### Option B: Quick Win + Incremental (2 hours + ongoing)
- Create minimal feed page to fix broken links
- Add features incrementally
- Ship faster, iterate later

### Option C: Hybrid Approach (6-8 hours)
- Database + basic services (Phase 1-3)
- Minimal UI (read-only feed view)
- Add post creation later

---

## Recommendation

**Start with Option B (Quick Win)**, then implement Phase 1-3 (database + services) to enable real data display. This unblocks users immediately while building the foundation for full functionality.

---

**Status**: Analysis Complete  
**Next Step**: Choose implementation approach and begin Phase 1
