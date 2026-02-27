# Phase 2: Display Real Feed Data - Implementation Plan

## Current Status ✅

- ✅ Database tables created (`feeds`, `feed_posts`)
- ✅ 28 feeds seeded with real EVM addresses
- ✅ Placeholder page working at `/commons/[address]`

---

## Next Step: Fetch and Display Feed Metadata

We'll update the placeholder page to show real feed information from Supabase.

### Step 1: Create Supabase Client Function (5 min)

**File**: `lib/external/supabase/feeds.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function fetchFeedByAddress(address: string) {
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .eq("lens_feed_address", address)
    .single();

  if (error) {
    console.error("Error fetching feed:", error);
    return null;
  }

  return data;
}

export async function fetchAllFeeds() {
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching feeds:", error);
    return [];
  }

  return data;
}
```

### Step 2: Update Feed Page to Show Real Data (10 min)

**File**: `app/commons/[address]/page.tsx`

```typescript
import { fetchFeedByAddress } from "@/lib/external/supabase/feeds";
import { StatusBanner } from "@/components/shared/status-banner";
import { Lock } from "lucide-react";

export default async function FeedPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  
  const feed = await fetchFeedByAddress(address);
  
  if (!feed) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner
            type="info"
            title="Feed not found"
            message="The requested feed does not exist."
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Feed Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-4">
          {feed.is_locked && (
            <Lock className="h-6 w-6 flex-shrink-0 text-yellow-500" />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
              {feed.title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {feed.description}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="rounded-full bg-blue-100 px-3 py-1 dark:bg-blue-900/30">
                {feed.category}
              </span>
              <span>{feed.post_count} posts</span>
            </div>
          </div>
        </div>
        
        {feed.is_locked && (
          <div className="mt-6 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              🔒 This feed requires a Society Protocol Pass to post. Read access is public.
            </p>
          </div>
        )}
        
        {/* Coming Soon Notice */}
        <div className="mt-8 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            🚧 Posts and discussions coming soon. The feed infrastructure is ready!
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Test It (2 min)

1. Restart dev server: `npm run dev`
2. Visit: http://localhost:3000
3. Click "Beginners & Help"
4. Should see:
   - Real feed title
   - Real description
   - Category badge
   - Post count (0 for now)
   - Lock icon for technical feeds

---

## What This Achieves

✅ **Real Data**: Shows actual feed metadata from Supabase  
✅ **Better UX**: Users see feed details, not just placeholder  
✅ **Lock Indicator**: Technical feeds show lock icon  
✅ **Category Display**: Shows which section feed belongs to  
✅ **Post Count**: Ready to show real count when posts exist  

---

## After This Works

**Phase 3 Options**:

**Option A**: Fetch posts from Lens Protocol (complex, 4-6 hours)
- Need to query Lens feeds for posts
- Parse and display posts
- Add pagination

**Option B**: Add "Create Post" button first (simpler, 2-3 hours)
- Let users create posts
- Posts go to Lens Protocol
- Cache in `feed_posts` table

**Option C**: Show mock posts (quickest, 30 min)
- Display sample posts to test UI
- Replace with real data later

---

## Recommendation

Implement **Step 1-3 above** (15 minutes total) to show real feed metadata.

Then decide:
- Want to see posts first? → Option A
- Want to let users post first? → Option B
- Want to test UI first? → Option C

What would you like to tackle next?
