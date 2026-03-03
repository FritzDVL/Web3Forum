# Current Feed Workflow Explanation

## What You Have Now (Current Implementation)

### Architecture Overview

```
Lens Feed (e.g., "General Discussion")
├── Post 1 (Article with title, summary, content) ← Stored in DB
│   ├── Comment 1 (Reply to Post 1) ← NOT stored in DB
│   ├── Comment 2 (Reply to Post 1) ← NOT stored in DB
│   └── Comment 3 (Reply to Post 1) ← NOT stored in DB
├── Post 2 (Article with title, summary, content) ← Stored in DB
│   └── Comment 1 (Reply to Post 2) ← NOT stored in DB
└── Post 3 (Article with title, summary, content) ← Stored in DB
```

### Current Workflow

#### 1. Creating a Post (Main Publication)
**File:** `lib/services/feed/create-feed-post.ts`

```typescript
// User creates a post with title, summary, content
createFeedPost(feedId, feedAddress, formData, sessionClient, walletClient)
  ↓
// Creates article metadata (title + summary + content)
createThreadArticle(articleData, sessionClient, walletClient)
  ↓
// Posts to Lens Protocol Feed
post(sessionClient, { contentUri, feed: feedAddress })
  ↓
// Saves to Supabase database (feed_posts table)
persistFeedPost(feedId, lensPostId, author, title, content)
  ↓
// Shows in feed list on homepage
```

**Result:** 
- Full article with title, summary, content
- Appears in feed list
- Has its own detail page
- Tracked in database (for stats)

#### 2. Creating a Reply (Comment)
**File:** `lib/services/feed/create-feed-reply.ts`

```typescript
// User replies to a post (just content, no title/summary)
createFeedReply(parentPostId, content, feedAddress, sessionClient, walletClient)
  ↓
// Creates article metadata (content only)
article({ content })
  ↓
// Posts to Lens Protocol as COMMENT
post(sessionClient, { 
  contentUri, 
  commentOn: { post: parentPostId },  ← KEY: This makes it a comment
  feed: feedAddress 
})
  ↓
// NOT saved to database
// Only fetched from Lens when viewing the parent post
```

**Result:**
- Simple comment (no title, no summary)
- Only visible on parent post's detail page
- NOT in feed list
- NOT tracked in database
- Looks like a "comment" not a "publication"

### How Posts Are Displayed

#### Feed List (Homepage)
**File:** `lib/services/feed/get-feed-posts.ts`

```typescript
getFeedPosts(feedId, feedAddress)
  ↓
// Fetches ONLY top-level posts from Lens Feed
fetchPostsByFeed(feedAddress)
  ↓
// Returns posts WITHOUT commentOn field
// (Comments are filtered out by Lens)
```

**Shows:** Only main posts (articles with titles)  
**Doesn't Show:** Replies/comments

#### Post Detail Page
**File:** `lib/services/feed/get-feed-replies.ts`

```typescript
getFeedReplies(postId)
  ↓
// Fetches comments for specific post
fetchCommentsByPostId(postId)
  ↓
// Returns posts WITH commentOn field pointing to parent
```

**Shows:** Parent post + all its comments

---

## What You Want (Desired Behavior)

### Desired Architecture

```
Lens Feed (e.g., "General Discussion")
├── Post 1 (Full publication) ← In feed list
├── Post 2 (Full publication) ← In feed list
├── Post 3 (Reply to Post 1, but also a full publication) ← In feed list
├── Post 4 (Full publication) ← In feed list
├── Post 5 (Reply to Post 2, but also a full publication) ← In feed list
└── Post 6 (Reply to Post 3, but also a full publication) ← In feed list
```

### Key Differences

| Current (Comments) | Desired (Publications as Replies) |
|-------------------|-----------------------------------|
| Reply has no title | Reply has title |
| Reply has no summary | Reply has summary |
| Reply only shows on parent page | Reply shows in feed list |
| Reply not in database | Reply in database |
| Looks like a comment | Looks like a full post |
| Uses `commentOn` field | Uses regular post (no `commentOn`) |
| Nested under parent | Flat list with reference |

---

## Why Current Implementation Uses Comments

### Lens Protocol Design
Lens Protocol has two types of posts:

1. **Root Posts** - Top-level publications
   ```typescript
   post(sessionClient, {
     contentUri: uri(articleUri),
     feed: evmAddress(feedAddress),
   })
   ```

2. **Comments** - Replies to posts
   ```typescript
   post(sessionClient, {
     contentUri: uri(replyUri),
     commentOn: { post: postId(parentPostId) },  ← Makes it a comment
     feed: evmAddress(feedAddress),
   })
   ```

### Current Behavior
- Comments are **filtered out** of feed lists by Lens
- Comments only appear when fetching by parent post ID
- This creates the "post with comment section" UX you're seeing

---

## How to Achieve What You Want

### Option 1: Make Replies Full Posts (No commentOn)

**Change:** Don't use `commentOn` field, make replies regular posts

```typescript
// Instead of:
post(sessionClient, {
  contentUri: uri(replyUri),
  commentOn: { post: postId(parentPostId) },  ← Remove this
  feed: evmAddress(feedAddress),
})

// Do:
post(sessionClient, {
  contentUri: uri(replyUri),
  feed: evmAddress(feedAddress),
})
```

**Pros:**
- Replies appear in feed list
- Replies are full publications
- Replies can have title, summary

**Cons:**
- No native "reply" relationship in Lens
- Need to track parent-child in your database
- Need to show relationship in UI manually

### Option 2: Fetch Comments and Show as Posts

**Change:** Fetch both root posts AND comments, display all as posts

```typescript
// Fetch root posts
const rootPosts = await fetchPostsByFeed(feedAddress);

// Fetch all comments for all posts
const allComments = await Promise.all(
  rootPosts.map(post => fetchCommentsByPostId(post.id))
);

// Merge and sort by timestamp
const allPosts = [...rootPosts, ...allComments.flat()].sort(byTimestamp);
```

**Pros:**
- Keeps Lens comment structure
- Shows all activity in feed

**Cons:**
- Comments still don't have titles/summaries
- More complex fetching logic
- Performance impact

### Option 3: Hybrid - Store Parent Reference in Metadata

**Change:** Make replies full posts, but include parent reference in metadata

```typescript
const metadata = article({
  title: replyTitle,
  content: replyContent,
  attributes: [
    { key: "replyTo", value: parentPostId },  ← Track parent
    { key: "replyToTitle", value: parentTitle },
  ]
});
```

**Pros:**
- Replies are full publications
- Can still show "in reply to" context
- Appears in feed list

**Cons:**
- Need to implement UI for showing relationships
- More complex data model

---

## Recommendation

Based on your description, **Option 3 (Hybrid)** seems best:

1. Replies are full posts (title, summary, content)
2. Store parent reference in metadata
3. Show all posts in feed list
4. Display "In reply to [Post Title]" badge on replies
5. Allow threading/nesting in UI

This gives you:
- ✅ Publications as answers (not comments)
- ✅ All posts visible in feed
- ✅ Context of what they're replying to
- ✅ Full publication features (title, summary, stats)

Would you like me to implement this approach?
