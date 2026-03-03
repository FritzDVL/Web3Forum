# UI Label Change: "Replies" → "Posts"

## What Changed

Changed all feed-related UI labels from "Replies" to "Posts" to better reflect that the count includes all posts (original posts + replies/comments).

## Files Updated

1. **`components/home/forum-category.tsx`**
   - Homepage feed list: "Replies" → "Posts"

2. **`components/commons/post-detail.tsx`**
   - Post detail page stats: "X replies" → "X posts"

3. **`components/commons/feed-posts-list.tsx`**
   - Feed posts list: "X replies" → "X posts"

4. **`components/commons/paginated-feed-posts-list.tsx`**
   - Paginated feed list: "X replies" → "X posts"

## What Wasn't Changed

Thread/community components still use "replies" since that context makes sense:
- Thread reply cards
- Community thread discussions
- Profile activity (replies to threads)

## Result

Now the feed sections show:
- **Posts**: Total number of posts/replies in the feed
- **Views**: Total views across all posts
- **Last Post**: Time of most recent post

This better represents that the count includes all activity, not just replies.
