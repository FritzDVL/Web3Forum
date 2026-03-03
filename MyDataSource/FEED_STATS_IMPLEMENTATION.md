# Feed Statistics Tracking

## Overview

Added automatic tracking of feed-level statistics:
- **Replies Count**: Total replies across all posts in the feed
- **Views Count**: Total views across all posts in the feed  
- **Last Post At**: Timestamp of the most recent post in the feed

## Database Changes

### New Columns in `feeds` table:
```sql
replies_count INTEGER DEFAULT 0
views_count INTEGER DEFAULT 0
last_post_at TIMESTAMP WITH TIME ZONE
```

### Automatic Updates via Triggers:

1. **On Post Creation**: Updates `post_count` and `last_post_at`
2. **On Reply Count Change**: Increments feed's `replies_count`
3. **On View Count Change**: Increments feed's `views_count`

## How to Apply

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20260302_add_feed_stats.sql`
4. Run the query

### Option 2: Using psql (if you have direct database access)
```bash
psql "$DATABASE_URL" < supabase/migrations/20260302_add_feed_stats.sql
```

### Option 3: Using Supabase CLI
```bash
supabase db push
```

## UI Changes

The homepage now displays real-time stats for each feed:

**Before:**
```
Replies: 0
Views: 0
Last Post: Never
```

**After:**
```
Replies: 1,234
Views: 5,678
Last Post: 2h ago
```

## How It Works

### Automatic Tracking

When you create a post:
```typescript
await createFeedPost(feedAddress, postData);
// Triggers automatically update:
// - feeds.post_count += 1
// - feeds.last_post_at = NOW()
```

When a post gets a reply:
```typescript
await createFeedReply(postId, replyData);
// Triggers automatically update:
// - feed_posts.replies_count += 1
// - feeds.replies_count += 1
```

When a post is viewed:
```typescript
await incrementPostViews(postId);
// Triggers automatically update:
// - feed_posts.views_count += 1
// - feeds.views_count += 1
```

### Manual Updates (if needed)

To recalculate stats for a specific feed:
```sql
UPDATE feeds f
SET 
  replies_count = COALESCE((
    SELECT SUM(replies_count)
    FROM feed_posts
    WHERE feed_id = f.id
  ), 0),
  views_count = COALESCE((
    SELECT SUM(views_count)
    FROM feed_posts
    WHERE feed_id = f.id
  ), 0),
  last_post_at = (
    SELECT MAX(created_at)
    FROM feed_posts
    WHERE feed_id = f.id
  )
WHERE f.id = 'YOUR_FEED_ID';
```

## Time Formatting

Last post times are displayed in a human-readable format:
- `Just now` - Less than 1 minute ago
- `5m ago` - Minutes ago
- `2h ago` - Hours ago
- `3d ago` - Days ago (up to 7 days)
- `Mar 1` - Older than 7 days

## Performance

- All stats are stored in the database (no real-time calculations)
- Triggers update stats automatically (no manual intervention needed)
- Indexed for fast sorting by `last_post_at`
- Backfill query included to calculate existing data

## Next Steps

To track post views, you'll need to implement view counting:

```typescript
// In your post detail page
useEffect(() => {
  incrementPostViews(postId);
}, [postId]);
```

This will automatically update both the post's view count and the feed's total view count.
