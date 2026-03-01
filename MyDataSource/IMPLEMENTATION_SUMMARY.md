# Feed Statistics Implementation - Summary

## What Was Done

Added automatic tracking of feed-level statistics that update in real-time as users interact with posts.

## Files Changed

### 1. Database Migration
- **`supabase/migrations/20260302_add_feed_stats.sql`** (NEW)
  - Added 3 columns to `feeds` table: `replies_count`, `views_count`, `last_post_at`
  - Created 3 triggers to auto-update stats when posts are created/updated
  - Backfilled existing data

### 2. TypeScript Types
- **`lib/services/feed/get-feeds.ts`** (MODIFIED)
  - Updated `FeedSection` interface to include new stats fields
  - Updated `getFeedSections()` to map stats from database

### 3. UI Components
- **`components/home/forum-category.tsx`** (MODIFIED)
  - Updated `Feed` interface to include stats
  - Added `formatLastPost()` helper for human-readable timestamps
  - Display actual stats instead of hardcoded zeros

### 4. Documentation
- **`MyDataSource/FEED_STATS_IMPLEMENTATION.md`** (NEW)
  - Complete guide on how the feature works
  - Migration instructions
  - Manual recalculation queries

### 5. Scripts
- **`scripts/apply-feed-stats-migration.sh`** (NEW)
  - Helper script to apply migration (if using psql)

## How to Deploy

1. **Apply the migration** to your Supabase database:
   - Go to Supabase Dashboard → SQL Editor
   - Copy/paste contents of `supabase/migrations/20260302_add_feed_stats.sql`
   - Click "Run"

2. **Deploy the code changes**:
   ```bash
   git add .
   git commit -m "Add feed statistics tracking"
   git push
   ```

3. **Verify it works**:
   - Visit your homepage
   - Check that feeds show actual stats (or zeros if no posts yet)
   - Create a test post and verify the feed's `last_post_at` updates

## What Happens Automatically

✅ When a post is created → `post_count` and `last_post_at` update  
✅ When a reply is added → `replies_count` increments  
✅ When a post is viewed → `views_count` increments (once you implement view tracking)

## What You Still Need to Do

### Implement View Tracking

Currently, `views_count` will stay at 0 because you need to add view tracking to your post detail page:

```typescript
// In app/commons/[address]/post/[postId]/page.tsx
// Add this to track views:

useEffect(() => {
  async function trackView() {
    await fetch(`/api/posts/${postId}/view`, { method: 'POST' });
  }
  trackView();
}, [postId]);
```

Then create the API endpoint:
```typescript
// app/api/posts/[postId]/view/route.ts
export async function POST(req: Request, { params }: { params: { postId: string } }) {
  const { postId } = params;
  
  // Increment view count in database
  await supabase
    .from('feed_posts')
    .update({ views_count: supabase.raw('views_count + 1') })
    .eq('lens_post_id', postId);
  
  return Response.json({ success: true });
}
```

The trigger will automatically update the feed's total view count.

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Homepage loads without errors
- [ ] Stats display correctly (or show 0 for empty feeds)
- [ ] Create a new post → `last_post_at` updates
- [ ] Add a reply → `replies_count` increments
- [ ] View tracking implemented → `views_count` increments

## Notes

- All stats are stored in the database (no performance impact)
- Triggers handle updates automatically (no manual code needed)
- Backfill query included to calculate stats for existing posts
- Time formatting shows relative times (e.g., "2h ago", "3d ago")
