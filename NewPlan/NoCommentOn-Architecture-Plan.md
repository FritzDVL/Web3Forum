# No commentOn Architecture — Migration Plan

> Detailed plan for migrating from Lens `commentOn` replies to standalone publications.
> Every reply becomes its own Lens article. Thread structure lives in Supabase metadata attributes.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Group & Feed Simplification](#3-group--feed-simplification)
4. [Database Schema Changes](#4-database-schema-changes)
5. [Lens Metadata Design](#5-lens-metadata-design)
6. [Publish Flow — New Pipeline](#6-publish-flow--new-pipeline)
7. [Edit Flow](#7-edit-flow)
8. [Failure Scenarios & Handling](#8-failure-scenarios--handling)
9. [Read Layer Changes](#9-read-layer-changes)
10. [On-Chain Viewer](#10-on-chain-viewer)
11. [Existing Pages Inventory](#11-existing-pages-inventory)
12. [Migration Steps (Execution Order)](#12-migration-steps-execution-order)
13. [Recovery Script (Future)](#13-recovery-script-future)

---

## 1. Current State Analysis

### What exists today

**Boards (Commons area):**
- Each child-board is a separate Lens Feed with its own address (28 feeds across 5 categories)
- Posts are Lens articles published to the specific feed
- Replies use `commentOn` — they are Lens comments on the root post
- Supabase `feeds` table stores each board, `feed_posts` stores root posts
- Replies are fetched directly from Lens via `fetchCommentsByPostId`

**Research area:**
- Single Lens Feed (`RESEARCH_FEED_ADDRESS`) + single Group (`RESEARCH_GROUP_ADDRESS`)
- Root topics are standalone articles
- Responses use `commentOn` on the root post
- Supabase `research_publications` table tracks both roots and responses
- `research_categories` table for the 6 categories

**Communities (Local groups):**
- Each community has its own Lens Group + Feed
- Threads are articles published to the community's feed
- Replies use `commentOn`
- Supabase `communities` + `community_threads` tables

### What breaks with commentOn

1. Replies are not standalone — they can't be opened independently or verified on-chain
2. Thread structure depends on Lens's comment tree — if Lens changes how comments work, the forum breaks
3. Recovery is impossible — you can't reconstruct thread ordering from comments alone without Lens's API
4. Editing a reply means editing a Lens comment, which has different constraints than editing an article
5. Cross-app visibility — replies show as comments on Hey.xyz, mixing forum context with social context

---

## 2. Target Architecture

### The Rule

**Every publication (thread root, reply, research topic, research response) is a standalone Lens article.** No `commentOn` anywhere. Thread/reply relationships are encoded in Lens metadata attributes and tracked in Supabase.

### Two-Layer Model

```
PERMANENT LAYER (Lens Protocol):
  Every post = standalone article
  Metadata attributes encode: forumCategory, forumThreadId, forumReplyPosition
  Grove storage = full content permanently stored
  Can rebuild entire forum from metadata alone

SPEED LAYER (Supabase):
  Immediate read/write for UI
  Caches content, tracks thread structure, counts, views
  Source of truth for display ordering
  Rebuildable from Lens if lost
```

### Post Flow (Simplified)

```
User submits content
  → Save to Supabase immediately (post appears in UI)
  → Build Lens article metadata with forum attributes
  → Upload to Grove → get contentUri
  → Publish to Lens Feed (standalone article, NO commentOn)
  → Wallet signs transaction
  → On success: update Supabase row with lens_post_id + content_uri
  → On failure: mark as "pending" — user can retry
```

---

## 3. Group & Feed Simplification

### Current: 28+ separate feeds

Each child-board has its own Lens Feed address. This was overly complex.

### Target: 2 core feeds + N language group feeds

```
COMMONS GROUP (1 Lens Group, open membership)
└── COMMONS FEED (1 Lens Feed)
    ├── General Discussion child-boards (4)
    ├── Partner Communities child-boards (4)
    ├── Functions child-boards (11)
    ├── Others child-boards (5)
    └── Technical child-boards (4)
    All posts go to the SAME feed.
    Child-board distinction = metadata attribute "forumCategory" only.

RESEARCH GROUP (1 Lens Group, open membership)
└── RESEARCH FEED (1 Lens Feed)
    Posts separated by category + tags via metadata.
    Already close to this model.

LANGUAGE GROUPS (N Lens Groups, 1 feed each)
└── Each language community = 1 Group + 1 Feed
    Same architecture as Commons but scoped to a language.
    Child-boards within each language group = metadata categories.
    Created dynamically (same flow as current community creation).
```

### What changes in constants.ts

```typescript
// Replace 28 feed addresses with:
export const COMMONS_GROUP_ADDRESS = "0x...";   // existing or new
export const COMMONS_FEED_ADDRESS = "0x...";    // single feed for all boards
export const RESEARCH_GROUP_ADDRESS = "0x...";  // already exists
export const RESEARCH_FEED_ADDRESS = "0x...";   // already exists
```

### What happens to the `feeds` Supabase table

It becomes a **categories/child-boards reference table** instead of a feed-address lookup. The `lens_feed_address` column becomes irrelevant for Commons (all posts go to one feed). We repurpose the table:

```sql
-- Rename: feeds → forum_boards (or keep as feeds, just change semantics)
-- Remove: lens_feed_address dependency for routing
-- Add: section column for grouping on homepage
-- The table becomes a UI-organization tool, not a Lens routing tool
```

---

## 4. Database Schema Changes

### New/Modified Tables

**`forum_boards`** (replaces `feeds` table — or add alongside it)

```sql
CREATE TABLE forum_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,              -- "beginners-help", "dao-governance"
  name TEXT NOT NULL,
  description TEXT,
  section TEXT NOT NULL,                  -- "general", "partners", "functions", "technical", "others"
  feed_type TEXT NOT NULL DEFAULT 'commons', -- "commons" or "research" or language group id
  display_order INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  thread_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  color TEXT,                             -- for grid cards (functions section)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`forum_threads`** (replaces `feed_posts` + `community_threads` for boards)

```sql
CREATE TABLE forum_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lens_post_id TEXT UNIQUE,               -- NULL until Lens confirms
  content_uri TEXT,                        -- Grove URI, NULL until uploaded
  board_slug TEXT REFERENCES forum_boards(slug),
  feed_type TEXT NOT NULL,                 -- "commons", "research", or language group id
  title TEXT NOT NULL,
  summary TEXT,
  content_markdown TEXT,                   -- raw markdown for rendering
  content_json JSONB,                      -- ProseKit JSON for fast re-hydration
  author_address TEXT NOT NULL,
  author_username TEXT,
  reply_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  publish_status TEXT DEFAULT 'pending',   -- "pending", "confirmed", "failed"
  tags TEXT[],
  slug TEXT UNIQUE,                        -- URL slug
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`forum_replies`** (new — replaces fetching comments from Lens)

```sql
CREATE TABLE forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  lens_post_id TEXT UNIQUE,               -- NULL until Lens confirms
  content_uri TEXT,
  position INTEGER NOT NULL,              -- reply #1, #2, #3...
  content_markdown TEXT,
  content_json JSONB,
  author_address TEXT NOT NULL,
  author_username TEXT,
  is_hidden BOOLEAN DEFAULT FALSE,
  publish_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`research_publications`** — keep existing table but add:

```sql
ALTER TABLE research_publications ADD COLUMN content_markdown TEXT;
ALTER TABLE research_publications ADD COLUMN content_json JSONB;
ALTER TABLE research_publications ADD COLUMN content_uri TEXT;
ALTER TABLE research_publications ADD COLUMN publish_status TEXT DEFAULT 'confirmed';
```

### What happens to existing tables

| Table | Action |
|-------|--------|
| `feeds` | Deprecated. Replace with `forum_boards`. Migrate data. |
| `feed_posts` | Deprecated. Replace with `forum_threads`. Migrate data. |
| `communities` | **Keep.** Used for language groups / local communities. |
| `community_threads` | **Keep for now.** Language groups use same pattern. Eventually unify with `forum_threads` using `feed_type`. |
| `research_publications` | **Keep + extend.** Add content caching columns. |
| `research_categories` | **Keep as-is.** Already works well. |

---

## 5. Lens Metadata Design

### Thread Root (Boards)

```typescript
article({
  title: "Thread Title",
  content: "Thread Title — https://lensforum.xyz/thread/slug",  // display mode
  tags: ["beginners-help"],  // board slug as first tag
  attributes: [
    { key: "app", type: "STRING", value: "lensforum" },
    { key: "forumCategory", type: "STRING", value: "beginners-help" },
    { key: "forumType", type: "STRING", value: "thread" },
    { key: "contentJson", type: "STRING", value: JSON.stringify(proseKitJson) },
    { key: "author", type: "STRING", value: authorAddress },
    { key: "subtitle", type: "STRING", value: summary },
  ],
});
```

### Reply (Boards)

```typescript
article({
  title: "Re: Thread Title",
  content: "Re: Thread Title — https://lensforum.xyz/thread/slug",
  tags: ["beginners-help"],
  attributes: [
    { key: "app", type: "STRING", value: "lensforum" },
    { key: "forumThreadId", type: "STRING", value: rootLensPostId },
    { key: "forumType", type: "STRING", value: "reply" },
    { key: "forumReplyPosition", type: "NUMBER", value: "3" },
    { key: "contentJson", type: "STRING", value: JSON.stringify(proseKitJson) },
    { key: "author", type: "STRING", value: authorAddress },
  ],
});
```

### Research Topic / Response

Same pattern. Research topics get `forumType: "research-topic"` + `researchCategory` attribute. Research responses get `forumType: "research-response"` + `researchThreadId`.

### Why this matters for recovery

A recovery script can read ALL posts from a feed, then:
- `forumType === "thread"` + `forumCategory` → insert into `forum_threads`
- `forumType === "reply"` + `forumThreadId` + `forumReplyPosition` → insert into `forum_replies` in correct order
- `forumType === "research-topic"` → insert into `research_publications` as root
- `forumType === "research-response"` → insert into `research_publications` as response

---

## 6. Publish Flow — New Pipeline

### Thread Creation (Boards)

```
1. User fills title + content in composer (ProseKit)
2. Extract: markdown string + ProseKit JSON from editor
3. INSERT into forum_threads:
   - title, summary, content_markdown, content_json, author_address, board_slug
   - publish_status = "pending"
   - lens_post_id = NULL
   → Thread appears in UI immediately from Supabase
4. Build Lens article metadata (see §5)
5. Upload metadata to Grove → contentUri
6. Publish to COMMONS_FEED (standalone article, NO commentOn)
7. Wallet signs transaction
8. Wait for tx confirmation → fetch created post → get lens_post_id
9. UPDATE forum_threads SET lens_post_id = ?, content_uri = ?, publish_status = "confirmed"
10. Revalidate paths
```

### Reply Creation (Boards)

```
1. User writes reply content
2. Get next position: SELECT MAX(position) + 1 FROM forum_replies WHERE thread_id = ?
3. INSERT into forum_replies:
   - thread_id, position, content_markdown, content_json, author_address
   - publish_status = "pending"
4. UPDATE forum_threads SET reply_count = reply_count + 1, last_reply_at = NOW()
   → Reply appears in UI immediately
5. Build Lens article metadata with forumThreadId = root's lens_post_id
   (If root is still "pending", queue the reply — see §8)
6. Upload to Grove → publish to COMMONS_FEED
7. On success: UPDATE forum_replies SET lens_post_id = ?, content_uri = ?, publish_status = "confirmed"
```

### Research Topic / Response

Same pattern, targeting RESEARCH_FEED instead of COMMONS_FEED.

---

## 7. Edit Flow

### The Problem

User edits a typo. We need to:
1. Update Supabase immediately (UI reflects change)
2. Create a new Lens publication OR edit the existing one

### Approach: Use Lens `editPost`

Lens Protocol supports `editPost` — it updates the metadata URI of an existing post. The post ID stays the same, but the content changes. This is the cleanest path:

```
1. User edits content in editor
2. UPDATE Supabase row (content_markdown, content_json, updated_at)
   → UI reflects change immediately
3. Build new article metadata with updated content
4. Upload new metadata to Grove → new contentUri
5. Call editPost(sessionClient, { post: postId, contentUri: newUri })
6. Wallet signs
7. On success: UPDATE content_uri in Supabase
```

**The old Grove URI still exists** (Grove is immutable). The Lens post now points to the new URI. Anyone checking the on-chain record sees the latest version. The old version is still accessible via its Grove hash if someone saved it — this is a feature, not a bug (edit history is preserved on-chain).

### What if the original publish hasn't confirmed yet?

If `publish_status = "pending"`, the edit only touches Supabase. When the original publish eventually confirms, it will use whatever content is current in Supabase at that point. If the original publish failed, the retry will pick up the edited content.

### What if editPost fails?

Supabase already has the updated content — the UI is correct. The Lens version is stale but still valid (old content). Show a subtle "sync pending" indicator. User can retry the on-chain sync later. This is acceptable because Supabase is the primary read layer.

---

## 8. Failure Scenarios & Handling

### Shared UI Component: `<PublishStatusBadge />`

Every thread and reply card renders a small status indicator based on `publish_status`:

```
confirmed  →  ✓ On-chain  (green, subtle, links to on-chain viewer)
pending    →  ⏳ Publishing...  (amber, auto-animating)
failed     →  ⚠️ Failed · Retry  (red, clickable → triggers retry)
```

This is a single component reused on `ThreadCard`, `ReplyCard`, `ResearchPost`, etc. It's small — a badge next to the timestamp, not a banner.

---

### Scenario 1: Grove upload fails

**When:** Network issue, Grove service down, timeout.
**Impact:** Can't get contentUri → can't publish to Lens.

**Solution:**
1. Supabase row already saved with content → post visible in UI immediately
2. Set `publish_status = 'failed'` in Supabase
3. `<PublishStatusBadge />` shows: `⚠️ Failed · Retry`
4. Clicking Retry calls `retryPublish(postId)` which:
   - Reads `content_markdown` + `content_json` from Supabase (already stored)
   - Attempts Grove upload again
   - If Grove succeeds → continues to Lens publish
   - If Grove fails again → stays `failed`, user can retry later
5. No data loss. Content is safe in Supabase regardless.

**Rarity:** Very rare. Grove has high uptime. Most likely cause is user's own network.

---

### Scenario 2: User rejects wallet signature

**When:** User clicks "Reject" in wallet popup (MetaMask, Rabby, etc).
**Impact:** No Lens publication created. Grove upload may or may not have happened.

**Solution:**
1. Supabase row exists → post visible in UI
2. Set `publish_status = 'failed'`
3. `<PublishStatusBadge />` shows: `⚠️ Failed · Retry`
4. Retry triggers the full flow: Grove upload (skipped if `content_uri` already set) → Lens publish → wallet signature
5. User gets another wallet popup to sign

**This is the most common failure.** The UX must be forgiving — the post is already visible, the user just needs to sign when ready.

---

### Scenario 3: On-chain transaction reverts

**When:** Gas estimation fails, nonce conflict, Lens contract revert, network congestion.
**Impact:** Transaction submitted but failed on-chain.

**Solution:**
1. Catch the error from `sessionClient.waitForTransaction`
2. Set `publish_status = 'failed'`
3. Log the specific error (gas, nonce, revert reason) to console for debugging
4. `<PublishStatusBadge />` shows: `⚠️ Failed · Retry`
5. Retry re-attempts the Lens publish (Grove upload already done, `content_uri` exists)

**Note:** Lens on GHO chain has low gas costs and reliable block times. This is uncommon but possible during network congestion.

---

### Scenario 4: App loses connection after signing

**When:** User closes browser tab after wallet signature, network drops mid-confirmation, app crashes.
**Impact:** Lens post likely exists on-chain but Supabase doesn't have the `lens_post_id`.

**Solution:**
1. `publish_status` stays `'pending'` with `lens_post_id = NULL`
2. `<PublishStatusBadge />` shows: `⏳ Publishing...`
3. **On next page load** (or when user visits the post): run a lightweight reconciliation check:
   ```
   If publish_status = 'pending' AND lens_post_id IS NULL AND created_at > 5 minutes ago:
     → Query Lens feed for recent posts by this author
     → Match by forumCategory + author_address + approximate timestamp (±10 min)
     → If match found: UPDATE lens_post_id, content_uri, publish_status = 'confirmed'
     → If no match: SET publish_status = 'failed' (user can retry)
   ```
4. This reconciliation runs client-side when the post author views their own pending post. Not a cron — just a lazy check.
5. Fallback: the recovery script (§13) catches any orphans.

**Edge case frequency:** Rare. Only happens if browser closes in the ~5 second window between signing and confirmation.

---

### Scenario 5: Reply on a thread whose root is still pending

**When:** Root thread's Lens publish hasn't confirmed yet, but someone (likely the same user) posts a reply.
**Impact:** Reply's `forumThreadId` metadata attribute needs the root's `lens_post_id`, which is NULL.

**Solution:**
1. Save reply to Supabase immediately — it references `thread_id` (UUID), not `lens_post_id`
2. Reply is visible in UI from Supabase. No problem for reads.
3. For the Lens publish of the reply:
   - Check if parent thread has `lens_post_id`
   - **If yes:** publish reply with `forumThreadId = thread.lens_post_id`
   - **If no:** set reply `publish_status = 'pending'`, skip Lens publish for now
4. When the root thread eventually confirms (gets its `lens_post_id`):
   - Query: `SELECT * FROM forum_replies WHERE thread_id = ? AND publish_status = 'pending' AND lens_post_id IS NULL`
   - For each queued reply: trigger Lens publish with the now-available `forumThreadId`
5. If root thread never confirms (stays `failed`):
   - Replies remain Supabase-only. Still visible in the forum.
   - If root is retried and succeeds later, queued replies get published then.

**In practice:** This mostly affects the thread author replying to their own thread immediately. The 5-second confirmation window means other users rarely encounter this.

---

### Scenario 6: User wants to delete a post

**When:** User regrets posting, wants content removed.
**Impact:** Lens posts are permanent — can't truly delete from the blockchain.

**Solution:**
1. Set `is_hidden = true` in Supabase → post disappears from forum UI
2. Lens post still exists on-chain but the forum doesn't render it
3. Admin moderation uses the same `is_hidden` flag
4. For the author: show a "Hide post" option (not "Delete") to set expectations correctly
5. Hidden posts are excluded from all queries: `WHERE is_hidden = false`

**No delete button.** The UI says "Hide" to be honest about what's happening. The on-chain record is permanent by design.

---

### Scenario 7: Edit fails to sync to Lens

**When:** User edits a post, Supabase updates fine, but `editPost` on Lens fails (wallet reject, network issue).
**Impact:** Supabase has new content, Lens has old content.

**Solution:**
1. Supabase is the primary read layer → UI shows the updated content immediately
2. The Lens version is stale but still valid (old content, old Grove URI)
3. Show a subtle indicator: `⏳ Edit pending sync` next to the post
4. User can retry the on-chain sync from the post's menu
5. If they never retry: the forum works fine from Supabase. The on-chain version just has the pre-edit content.
6. This is acceptable because Supabase is the display layer. Lens is the backup.

---

### Summary: The Retry Flow

All failure scenarios converge on the same mechanism:

```
publish_status = 'failed' or 'pending' (stale)
  → <PublishStatusBadge /> shows retry option
  → User clicks Retry
  → retryPublish(postId, type) is called
  → Reads content from Supabase
  → Uploads to Grove (if content_uri missing)
  → Publishes to Lens (standalone article)
  → Wallet signature requested
  → On success: UPDATE publish_status = 'confirmed', lens_post_id, content_uri
  → On failure: stays 'failed', user can try again
```

One function, one UI component, handles everything. No complex queuing system needed.

---

## 9. Read Layer Changes

### Current: Lens-heavy reads

- Thread list: Supabase for metadata → Lens for content
- Replies: `fetchCommentsByPostId` from Lens directly
- Research responses: `fetchCommentsByPostId` from Lens

### Target: Supabase-only reads

- Thread list: `SELECT * FROM forum_threads WHERE board_slug = ? ORDER BY ...`
- Thread detail: `SELECT * FROM forum_threads WHERE slug = ?`
- Replies: `SELECT * FROM forum_replies WHERE thread_id = ? ORDER BY position`
- Research: same pattern from `research_publications`

**No Lens reads for normal page loads.** Lens is only read during:
1. Recovery script execution
2. On-chain verification (user clicks "view on-chain")
3. Initial page load fallback if Supabase row has no `content_markdown` (legacy data)

### Files that change

| File | Change |
|------|--------|
| `lib/services/board/get-board-posts.ts` | Query `forum_threads` by `board_slug` instead of `feed_posts` by `feed_id` |
| `lib/services/board/get-board-post.ts` | Query `forum_threads` by slug or id |
| `lib/services/board/get-board-post-replies.ts` | Query `forum_replies` instead of Lens comments |
| `lib/services/reply/create-reply.ts` | Remove `commentOn`, use standalone publish |
| `lib/services/reply/get-thread-replies.ts` | Query `forum_replies` instead of Lens |
| `lib/services/research/create-research-response.ts` | Remove `commentOn`, use standalone publish |
| `lib/external/lens/primitives/articles.ts` | Add forum metadata attributes |
| `components/thread/thread-reply-card.tsx` | Render from Supabase data, add on-chain link |
| `components/boards/board-reply-card.tsx` | Same |

---

## 10. On-Chain Viewer

Each post gets an "on-chain" button/badge that:

1. Links to the Grove content URI (if `content_uri` exists)
2. Shows the Lens publication ID (if `lens_post_id` exists)
3. Shows publish status: ✓ Confirmed | ⏳ Pending | ⚠️ Failed [Retry]

Could be a small modal or a dedicated route like `/post/[lensPostId]/onchain` that shows:
- Grove hash + link to raw JSON
- Lens publication ID + link to Lens explorer
- Timestamp of on-chain confirmation
- Metadata attributes (forumCategory, forumThreadId, etc.)

This is a low-priority feature — implement after the core pipeline works.

---

## 11. Existing Pages Inventory

### Pages that STAY (with modifications)

| Route | Purpose | Changes needed |
|-------|---------|----------------|
| `/` | Homepage — board sections + research + communities | Update data fetching to use `forum_boards` table |
| `/boards/[address]` | Board thread list | Change to `/boards/[slug]`, query `forum_threads` by `board_slug` |
| `/boards/[address]/post/[postId]` | Post detail + replies | Change to `/boards/[slug]/post/[postId]`, read from Supabase |
| `/boards/[address]/post/[postId]/reply` | Reply form | Remove `commentOn`, use standalone publish |
| `/boards/[address]/new-post` | New post form | Target `COMMONS_FEED`, add `forumCategory` attribute |
| `/thread/[slug]` | Thread detail (community threads) | Read from Supabase, replies from `forum_replies` |
| `/thread/[slug]/edit` | Edit thread | Update both Supabase + Lens (`editPost`) |
| `/research` | Research stream | Keep as-is, minor data layer changes |
| `/research/new` | New research topic | Remove `commentOn` for responses |
| `/research/thread/[threadId]` | Research thread detail | Read responses from Supabase |
| `/communities` | Communities list | **Keep as-is.** For language groups. |
| `/communities/[address]` | Community detail | **Keep.** Language groups use this. |
| `/communities/[address]/new-thread` | New thread in community | Adapt to standalone publish |
| `/communities/[address]/edit` | Community settings | **Keep as-is.** |
| `/communities/new` | Create community | **Keep.** Used for language groups. |
| `/u/[username]` | User profile | **Keep as-is.** |
| `/notifications` | Notifications | **Keep as-is.** |
| `/rewards` | Rewards page | **Keep.** May remove later. |
| `/terms` | Terms page | **Keep as-is.** |
| `/reply/[replyId]` | Reply permalink | Update to read from `forum_replies` |

### API Routes

| Route | Changes |
|-------|---------|
| `/api/posts/[postId]/view` | Update to increment views in `forum_threads` |
| `/api/research/[threadId]/view` | Keep as-is |

### Pages that may be REMOVED later

- `/rewards` — depends on whether Lens Reputation integration stays
- Some community management pages if language groups don't need full settings

---

## 12. Migration Steps (Execution Order)

### Phase 1: Database Foundation

1. Create `forum_boards` table with all 28 child-boards as rows (slug-based)
2. Create `forum_threads` table
3. Create `forum_replies` table
4. Add content caching columns to `research_publications`
5. Seed `forum_boards` with current board data (convert from `feeds` table)
6. Update `constants.ts` with `COMMONS_GROUP_ADDRESS` + `COMMONS_FEED_ADDRESS`

### Phase 2: Publish Pipeline (Core Change)

7. Create new `lib/services/forum/publish-thread.ts` — Supabase-first + Lens standalone
8. Create new `lib/services/forum/publish-reply.ts` — Supabase-first + standalone (NO commentOn)
9. Update `lib/external/lens/primitives/articles.ts` — add forum metadata attributes
10. Update research response creation — remove `commentOn`
11. Add `publish_status` UI indicators (pending/confirmed/failed badge)
12. Add retry mechanism for failed publishes

### Phase 3: Read Layer

13. Create `lib/services/forum/get-threads.ts` — read from `forum_threads`
14. Create `lib/services/forum/get-replies.ts` — read from `forum_replies`
15. Update board page components to use new data layer
16. Update thread detail to render replies from Supabase
17. Update research thread detail to render responses from Supabase

### Phase 4: Route & UI Updates

18. Update board routes from `[address]` to `[slug]`
19. Update homepage data fetching to use `forum_boards`
20. Update thread creation forms to target single COMMONS_FEED
21. Update reply forms to use standalone publish
22. Add on-chain viewer component

### Phase 5: Edit Flow

23. Implement edit-thread with Supabase-first + Lens `editPost`
24. Add edit capability for replies (new — currently only threads can be edited)

### Phase 6: Cleanup & Polish

25. Deprecate old `feeds` / `feed_posts` tables (don't delete yet)
26. Remove `commentOn` imports and usage across codebase
27. Update TypeScript types (`Board`, `BoardPost`, `Reply`)
28. Test full flow: create thread → reply → edit → view on-chain

### Phase 7: Recovery Script (Last)

29. Build `scripts/recover-forum.ts` — reads all posts from Commons + Research feeds, reconstructs Supabase from metadata attributes
30. Test recovery by wiping forum tables and running script

---

## 13. Recovery Script (Future)

### How it works

```
1. Connect to Lens (public client, no auth needed)
2. Connect to Supabase (service role key)
3. Paginate through ALL posts in COMMONS_FEED
4. For each post, read metadata attributes:
   - forumType === "thread" → UPSERT into forum_threads
   - forumType === "reply" → UPSERT into forum_replies
5. Paginate through ALL posts in RESEARCH_FEED
6. Same classification for research topics/responses
7. Recount all statistics (reply_count, thread_count, views reset to 0)
```

### What's recoverable from Lens

- Thread content, title, summary (from metadata attributes)
- Reply content + position + parent thread (from attributes)
- Author addresses
- Timestamps
- Categories and tags
- Grove content URIs

### What's NOT recoverable

- View counts (Supabase-only)
- Pin/lock/hidden status (Supabase-only moderation)
- Slugs (can regenerate from titles but URLs change)
- `publish_status` (everything recovered from Lens is by definition "confirmed")

### Crossposting prevention

The recovery script filters by `app === "lensforum"` attribute. Posts made from other Lens apps won't have this attribute and get skipped. This is also why we add the `app` attribute to every publication — it's the filter key.

---

## Open Decisions

1. **Commons Group + Feed:** Do these already exist, or do we need to create them? The current setup has `BASE_FEED_ADDRESS` which might serve as the single commons feed.
2. **Language groups:** When you're ready to add them, they follow the same pattern as communities — 1 group + 1 feed each. The `forum_boards` table can have rows with `feed_type = "language-es"` etc.
3. **Board route format:** `/boards/[slug]` (e.g., `/boards/beginners-help`) vs keeping `/boards/[address]`. Slug is cleaner for SEO and readability.
4. **Research responses:** Should they also get edit capability, or just root topics?
