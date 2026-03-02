# Option 3 Implementation: Detailed Plan & Comparison with Communities

## Communities (Original LensForum) Architecture

### How Communities Work

```
Community (Group)
├── Has a Lens Feed (for posts)
├── Has a Lens Group (for membership)
└── Threads stored in database

Thread Creation Flow:
1. User creates thread (title, summary, content)
2. Creates Lens Post (article) in community feed
3. Saves thread metadata to Supabase (community_threads table)
4. Thread appears in community's thread list

Reply Creation Flow:
1. User replies to thread (just content)
2. Creates Lens Comment (commentOn: threadPostId)
3. Reply only visible on thread detail page
4. NOT saved to database
5. Fetched from Lens when viewing thread
```

### Database Schema (Communities)

```sql
-- community_threads table
CREATE TABLE community_threads (
  id UUID PRIMARY KEY,
  community_id UUID REFERENCES communities(id),
  lens_feed_address TEXT,
  title TEXT,
  summary TEXT,
  author TEXT,
  root_post_id TEXT,  -- Lens post ID
  slug TEXT,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Key Points
- **Threads** = Full posts (title, summary, content) → Stored in DB
- **Replies** = Comments (content only) → NOT stored in DB
- **Threads** appear in community list
- **Replies** only appear on thread detail page
- Uses `commentOn` for replies (Lens native comments)

---

## Current Feeds Implementation

### How Feeds Work Now

```
Feed (e.g., "General Discussion")
├── Has a Lens Feed address
└── Posts stored in database

Post Creation Flow:
1. User creates post (title, summary, content)
2. Creates Lens Post (article) in feed
3. Saves post metadata to Supabase (feed_posts table)
4. Post appears in feed list

Reply Creation Flow:
1. User replies to post (just content)
2. Creates Lens Comment (commentOn: postId)
3. Reply only visible on post detail page
4. NOT saved to database
5. Fetched from Lens when viewing post
```

### Database Schema (Current Feeds)

```sql
-- feed_posts table
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY,
  feed_id UUID REFERENCES feeds(id),
  lens_post_id TEXT,
  author TEXT,
  title TEXT,
  content TEXT,
  replies_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Key Points
- **Posts** = Full posts (title, summary, content) → Stored in DB
- **Replies** = Comments (content only) → NOT stored in DB
- **Posts** appear in feed list
- **Replies** only appear on post detail page
- Uses `commentOn` for replies (Lens native comments)

**Problem:** Replies are comments, not publications!

---

## Option 3: Publications as Replies

### Desired Architecture

```
Feed (e.g., "General Discussion")
├── Post 1 (Full publication)
├── Post 2 (Full publication)
├── Post 3 (Reply to Post 1, but ALSO a full publication)
├── Post 4 (Full publication)
├── Post 5 (Reply to Post 2, but ALSO a full publication)
└── Post 6 (Reply to Post 3, but ALSO a full publication)
```

### New Flow

#### Creating a Root Post (Same as now)
```typescript
1. User creates post (title, summary, content)
2. Create Lens Post (article) in feed
   - NO commentOn field
   - NO parent_post_id in metadata
3. Save to feed_posts table
   - parent_post_id = NULL
4. Post appears in feed list
```

#### Creating a Reply Post (NEW - Different from now)
```typescript
1. User creates reply (title, summary, content)  ← NEW: Has title/summary
2. Create Lens Post (article) in feed
   - NO commentOn field  ← KEY CHANGE
   - Add parent reference in metadata:
     {
       attributes: [
         { key: "replyTo", value: parentPostId },
         { key: "replyToTitle", value: parentTitle }
       ]
     }
3. Save to feed_posts table
   - parent_post_id = parentPostId  ← NEW: Track parent
4. Reply appears in feed list  ← NEW: Visible in main list
```

### Updated Database Schema

```sql
-- Add parent_post_id column to feed_posts
ALTER TABLE feed_posts
ADD COLUMN parent_post_id TEXT,  -- Lens post ID of parent (NULL for root posts)
ADD COLUMN reply_depth INTEGER DEFAULT 0;  -- 0 = root, 1 = direct reply, 2 = reply to reply

-- Index for fetching replies
CREATE INDEX idx_feed_posts_parent_post_id ON feed_posts(parent_post_id);

-- Index for fetching conversation threads
CREATE INDEX idx_feed_posts_parent_depth ON feed_posts(parent_post_id, reply_depth);
```

### Implementation Changes

#### 1. Update Reply Creation

**File:** `lib/services/feed/create-feed-reply.ts`

```typescript
export async function createFeedReply(
  feedId: string,
  feedAddress: Address,
  parentPostId: string,
  parentPostTitle: string,
  formData: FormData,  // Now includes title, summary, content
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateFeedReplyResult> {
  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const author = formData.get("author") as Address;

  // 1. Create article metadata with parent reference
  const metadata = article({
    title,
    content,
    attributes: [
      { key: "replyTo", value: parentPostId },
      { key: "replyToTitle", value: parentPostTitle },
      { key: "author", value: author },
      { key: "subtitle", value: summary },
    ],
  });

  // 2. Upload to storage
  const acl = immutable(lensChain.id);
  const { uri: replyUri } = await storageClient.uploadAsJson(metadata, { acl });

  // 3. Post to Lens (NO commentOn - regular post)
  const result = await post(sessionClient, {
    contentUri: uri(replyUri),
    feed: evmAddress(feedAddress),  // Just feed, no commentOn
  })
    .andThen(handleOperationWith(walletClient))
    .andThen(sessionClient.waitForTransaction)
    .andThen((txHash) => fetchPost(client, { txHash }));

  // 4. Save to database with parent reference
  const persistedPost = await persistFeedPost(
    feedId,
    result.value.id,
    author,
    title,
    content,
    parentPostId,  // NEW: Track parent
  );

  return { success: true, post: persistedPost };
}
```

#### 2. Update Database Persistence

**File:** `lib/external/supabase/feed-posts.ts`

```typescript
export async function persistFeedPost(
  feedId: string,
  lensPostId: string,
  author: Address,
  title: string,
  content: string,
  parentPostId?: string,  // NEW: Optional parent
): Promise<FeedPostSupabase> {
  const supabase = await supabaseClient();

  const { data: newPost, error } = await supabase
    .from("feed_posts")
    .insert({
      feed_id: feedId,
      lens_post_id: lensPostId,
      author,
      title,
      content,
      parent_post_id: parentPostId || null,  // NEW
      reply_depth: parentPostId ? 1 : 0,  // NEW: Calculate depth
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create feed post: ${error.message}`);
  return newPost;
}
```

#### 3. Update Feed Posts Fetching

**File:** `lib/services/feed/get-feed-posts.ts`

```typescript
export async function getFeedPosts(
  feedId: string,
  feedAddress: Address,
  options?: { 
    limit?: number; 
    cursor?: string;
    includeReplies?: boolean;  // NEW: Option to include/exclude replies
  },
): Promise<GetFeedPostsResult> {
  // Fetch ALL posts from Lens feed (no commentOn filter)
  const lensResult = await fetchPostsByFeed(feedAddress, undefined, { 
    sort: "desc", 
    limit: options?.limit || 10,
    cursor: options?.cursor 
  });

  const lensPosts = lensResult.posts;

  // Fetch DB records
  const dbPostsPromises = lensPosts.map(post => fetchFeedPostByLensId(post.id));
  const dbPosts = await Promise.all(dbPostsPromises);

  // Adapt to FeedPost objects
  const feedPosts = await Promise.all(
    lensPosts.map(async (lensPost, idx) => {
      const dbPost = dbPosts[idx];
      return await adaptLensPostToFeedPost(
        feedId, 
        feedAddress, 
        lensPost, 
        dbPost || undefined
      );
    })
  );

  // Filter out replies if needed
  const filteredPosts = options?.includeReplies 
    ? feedPosts 
    : feedPosts.filter(post => !post.parentPostId);

  return {
    success: true,
    posts: filteredPosts,
    nextCursor: lensResult.pageInfo?.next ?? null,
  };
}
```

#### 4. Update UI Components

**File:** `components/commons/feed-posts-list.tsx`

```typescript
export function FeedPostsList({ feedAddress, posts }: FeedPostsListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="...">
          {/* Show "In reply to" badge if it's a reply */}
          {post.parentPostId && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Reply className="h-4 w-4" />
              <span>In reply to:</span>
              <Link 
                href={`/commons/${feedAddress}/post/${post.parentPostId}`}
                className="text-blue-600 hover:underline"
              >
                {post.parentPostTitle || "View parent"}
              </Link>
            </div>
          )}

          {/* Post content */}
          <h3 className="text-lg font-semibold">
            <Link href={`/commons/${feedAddress}/post/${post.rootPost.id}`}>
              {post.title}
            </Link>
          </h3>
          
          {/* ... rest of post card ... */}
        </div>
      ))}
    </div>
  );
}
```

#### 5. Update Reply Form UI

**File:** `components/commons/reply-form.tsx`

```typescript
export function ReplyForm({ postId, postTitle, feedAddress }: ReplyFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      {/* NEW: Title field */}
      <input
        type="text"
        name="title"
        placeholder="Reply title"
        required
      />

      {/* NEW: Summary field */}
      <textarea
        name="summary"
        placeholder="Brief summary"
        rows={2}
      />

      {/* Content field (existing) */}
      <textarea
        name="content"
        placeholder="Write your reply..."
        rows={6}
        required
      />

      <button type="submit">Post Reply</button>
    </form>
  );
}
```

---

## Comparison: Communities vs Feeds (Option 3)

| Aspect | Communities (Threads) | Feeds (Current) | Feeds (Option 3) |
|--------|----------------------|-----------------|------------------|
| **Main Posts** | Full publications | Full publications | Full publications |
| **Replies** | Comments (no title) | Comments (no title) | Full publications |
| **Reply in List** | ❌ No | ❌ No | ✅ Yes |
| **Reply has Title** | ❌ No | ❌ No | ✅ Yes |
| **Reply has Summary** | ❌ No | ❌ No | ✅ Yes |
| **Reply in DB** | ❌ No | ❌ No | ✅ Yes |
| **Uses commentOn** | ✅ Yes | ✅ Yes | ❌ No |
| **Parent Tracking** | Lens native | Lens native | Metadata + DB |
| **Threading** | 1 level | 1 level | Multi-level possible |

---

## Benefits of Option 3

### 1. Publications as Replies
- Replies are full posts with title, summary, content
- Replies appear in feed list
- Replies have their own detail pages
- Replies can be replied to (nested conversations)

### 2. Better Discoverability
- All activity visible in feed
- No hidden comments
- Search can find replies
- Stats track all posts

### 3. Flexibility
- Can filter: "Show only root posts" or "Show all"
- Can sort by: newest, most replies, most views
- Can thread: Show conversation trees
- Can link: Direct links to any reply

### 4. Consistency
- Same UI for posts and replies
- Same creation flow
- Same stats tracking
- Same permissions

---

## Migration Path

### Phase 1: Database Changes
1. Add `parent_post_id` column to `feed_posts`
2. Add `reply_depth` column
3. Add indexes
4. Backfill existing data (all NULL for now)

### Phase 2: Backend Changes
1. Update `createFeedReply` to accept title/summary
2. Update `persistFeedPost` to accept parent
3. Update `getFeedPosts` to handle replies
4. Update adapters to extract parent from metadata

### Phase 3: UI Changes
1. Update reply form to include title/summary
2. Update feed list to show "In reply to" badge
3. Update post detail to show reply chain
4. Add filter toggle: "Root posts only" / "All posts"

### Phase 4: Testing
1. Create root post
2. Create reply with title/summary
3. Verify reply appears in feed list
4. Verify "In reply to" badge shows
5. Verify stats update correctly

---

## Key Differences from Communities

### Communities Keep Comments
- Threads use Lens `commentOn` for replies
- Replies are lightweight comments
- Works well for discussion threads

### Feeds Use Publications
- Posts use regular Lens posts for replies
- Replies are full publications
- Works well for forum-style discussions

### Why Different?
- **Communities** = Discussion threads (like Reddit threads)
  - Main post + comments
  - Comments are secondary
  
- **Feeds** = Forum topics (like traditional forums)
  - All posts are equal
  - Replies are also publications
  - Flat or threaded view

---

## Next Steps

Would you like me to:
1. Implement the database migration?
2. Update the backend services?
3. Update the UI components?
4. All of the above?

Let me know and I'll start implementing Option 3!
