# Community Rework Plan — Language Groups as Independent Board Systems

> Rework community/language groups to use the same architecture as Commons boards.
> Every community becomes a mini-forum with child-boards, stacked article threads, and Supabase-first publishing.

---

## 1. Current State (Problems)

### How communities work now

```
Community = 1 Lens Group + 1 Lens Feed
  └── Threads = Lens articles published to the feed
       └── Replies = Lens comments (commentOn) on the root post
```

**Problems:**
- **Lens-first:** Thread creation publishes to Lens BEFORE saving to Supabase. User waits for wallet signature + tx confirmation.
- **commentOn replies:** Replies are Lens comments, not standalone articles. Can't be opened independently, can't be recovered.
- **Lens-dependent reads:** `getThread()` fetches the root post from Lens Protocol. If Lens is slow or down, the thread page fails.
- **Reddit-style threading:** Nested comment tree (reply to reply to reply). Not the stacked article model we want.
- **No child-boards:** Each community is a flat list of threads. No topic organization.
- **Types depend on Lens objects:** `Thread.rootPost: Post`, `Thread.author: Account`, `Community.group: Group`, `Community.feed: Feed` — all Lens SDK types that require API calls to populate.

### Files involved (all need rework)

```
Types:
  lib/domain/communities/types.ts    — Community type with Lens Group/Feed
  lib/domain/threads/types.ts        — Thread type with Lens Post/Account
  lib/domain/replies/types.ts        — Reply type with Lens Post

Services:
  lib/services/thread/create-thread.ts     — Lens-first, uses commentOn
  lib/services/thread/get-thread.ts        — Fetches from Lens
  lib/services/thread/get-community-threads.ts — Fetches from Lens
  lib/services/reply/create-reply.ts       — Uses commentOn
  lib/services/reply/get-thread-replies.ts — Fetches comments from Lens
  lib/services/community/get-community.ts  — Fetches Group from Lens

Hooks:
  hooks/replies/use-reply-create.ts        — commentOn flow
  hooks/forms/use-thread-create-form.ts    — Lens-first create

Components:
  components/thread/thread.tsx             — Depends on Lens Thread type
  components/thread/thread-card.tsx        — Renders Lens Post
  components/thread/thread-reply-card.tsx  — Renders Lens comment
  components/thread/thread-replies-list.tsx — Fetches from Lens
  components/thread/thread-create-form.tsx — Lens-first form

Adapters (to delete):
  lib/adapters/thread-adapter.ts           — Transforms Lens Post → Thread
  lib/adapters/reply-adapter.ts            — Transforms Lens Post → Reply
```

---

## 2. Target Architecture

### The model

Each language community becomes a **mini-forum** that mirrors the Commons architecture:

```
Language Community = 1 Lens Group + 1 Lens Feed
  └── Child-boards (optional, stored in community_boards table)
       └── Threads = standalone Lens articles (NO commentOn)
            └── Replies = standalone Lens articles (NO commentOn)
                 └── All stacked in a single thread page
```

### Key principles (same as Commons)

1. **Supabase-first:** Save to DB instantly, publish to Lens in background
2. **No commentOn:** Every reply is a standalone article with metadata attributes
3. **Supabase-only reads:** Thread pages read from `community_threads` + `community_replies` tables. No Lens API calls for rendering.
4. **Content cached:** `content_markdown` and `content_json` stored in Supabase rows
5. **Stacked thread view:** Root post + replies rendered as independent article cards, each with on-chain status badge
6. **Optional child-boards:** Communities can have topic categories (child-boards) or just a flat thread list

---

## 3. Database Changes

### Existing tables to modify

**`community_threads`** — add content caching + publish status columns:

```sql
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS lens_post_id TEXT UNIQUE;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS content_uri TEXT;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS content_markdown TEXT;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS content_json JSONB;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS author_username TEXT;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS publish_status TEXT DEFAULT 'pending'
  CHECK (publish_status IN ('pending','confirmed','failed'));
ALTER TABLE community_threads ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMPTZ;
```

### New table

**`community_replies`** — already created in fresh-schema.sql, mirrors `forum_replies`:

```sql
-- Already exists from fresh-schema.sql
community_replies (
  id, thread_id, lens_post_id, content_uri, position,
  content_markdown, content_json, author_address, author_username,
  is_hidden, publish_status, created_at
)
```

### Optional: `community_boards` (child-boards per community)

```sql
CREATE TABLE IF NOT EXISTS community_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  UNIQUE(community_id, slug)
);
```

This is optional — communities can start with a flat thread list and add child-boards later. The `community_threads` table would get a `board_slug` column to filter by.

---

## 4. New Types (Supabase-native, no Lens dependencies)

```typescript
// Replace lib/domain/communities/types.ts
interface Community {
  id: string;
  name: string;
  lensGroupAddress: string;
  lensFeedAddress: string | null;
  membersCount: number;
  threadsCount: number;
  isVisible: boolean;
  createdAt: string;
  // No more Lens Group/Feed objects
}

// Replace lib/domain/threads/types.ts
interface CommunityThread {
  id: string;
  communityId: string;
  lensPostId: string | null;
  contentUri: string | null;
  title: string;
  summary: string;
  contentMarkdown: string | null;
  contentJson: any | null;
  authorAddress: string;
  authorUsername: string | null;
  repliesCount: number;
  viewsCount: number;
  isPinned: boolean;
  isLocked: boolean;
  publishStatus: 'pending' | 'confirmed' | 'failed';
  slug: string;
  lastReplyAt: string | null;
  createdAt: string;
}

// Replace lib/domain/replies/types.ts
interface CommunityReply {
  id: string;
  threadId: string;
  lensPostId: string | null;
  contentUri: string | null;
  position: number;
  contentMarkdown: string | null;
  contentJson: any | null;
  authorAddress: string;
  authorUsername: string | null;
  isHidden: boolean;
  publishStatus: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}
```

---

## 5. Service Layer Changes

### Thread creation: `saveCommunityThread()`

Same pattern as `saveForumThread()`:
1. Generate slug (client-side, no DB check)
2. INSERT into `community_threads` with content_markdown, content_json
3. Return immediately
4. Lens publish happens separately via `publishCommunityThreadToLens()`

### Reply creation: `saveCommunityReply()`

Same pattern as `saveForumReply()`:
1. Get next position
2. INSERT into `community_replies`
3. Increment reply count
4. Return immediately
5. Lens publish separately

### Thread reads: `getCommunityThread()`

Pure Supabase:
```
SELECT * FROM community_threads WHERE slug = ? AND visible = true
```
No Lens API call. Content comes from `content_markdown`.

### Reply reads: `getCommunityReplies()`

Pure Supabase:
```
SELECT * FROM community_replies WHERE thread_id = ? AND is_hidden = false ORDER BY position
```

### Community reads: `getCommunity()`

Supabase-first with optional Lens enrichment:
```
SELECT * FROM communities WHERE lens_group_address = ?
```
Lens Group metadata (description, icon, rules) fetched only when needed (settings page), not for every page load.

---

## 6. Component Changes

### Thread page → Stacked articles

Replace the current Reddit-style `Thread` component with the same stacked layout as `BoardPostDetail`:

```
[Thread Title]

┌─────────────────────────────────────┐
│ @author · 2h ago        ✓ On-chain  │
│ Root post content (markdown)        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ @replier · 1h ago  #1  ⚠️ Off-chain │
│ Reply content (standalone article)  │
└─────────────────────────────────────┘

[Reply box]
```

### Community page → Board-style thread list

Replace the current card grid with the same grid layout as `BoardPostList`:

```
Topic | Started by | Replies | Views | Activity
─────────────────────────────────────────────────
Thread title    author    5       120    2h ago
Another thread  author2   0       30     1d ago
```

### Components to reuse from boards

- `PublishStatusBadge` — already built
- `BoardPostList` layout pattern — same grid
- `BoardPostDetail` stacked card pattern — same layout

---

## 7. Files to Delete (Old System)

After rework, these become dead code:

```
lib/adapters/thread-adapter.ts
lib/adapters/reply-adapter.ts
lib/adapters/board-adapter.ts
lib/domain/boards/types.ts          (old Board type)
lib/domain/replies/types.ts         (old Reply type with Lens Post)
lib/services/board/create-board-post.ts
lib/services/reply/create-reply.ts  (old commentOn flow)
lib/services/reply/get-thread-replies.ts
lib/services/reply/get-replies-by-parent-id.ts
lib/external/supabase/feeds.ts
lib/external/supabase/feed-posts.ts
config/commons-config.ts
hooks/replies/use-reply-create.ts
hooks/replies/use-hide-reply.ts     (if moderation moves to new system)
```

---

## 8. Execution Order

### Phase A: Database migration
1. Add new columns to `community_threads` (content caching, publish_status)
2. Create `community_replies` table (already in fresh-schema.sql)
3. Optionally create `community_boards` table

### Phase B: Service layer
4. Create `saveCommunityThread()` + `publishCommunityThreadToLens()` (same pattern as forum)
5. Create `saveCommunityReply()` + `publishCommunityReplyToLens()`
6. Create Supabase-only read functions for threads and replies
7. Simplify `getCommunity()` to be Supabase-first

### Phase C: Components
8. Rewrite community thread list → grid layout (reuse BoardPostList pattern)
9. Rewrite thread page → stacked articles (reuse BoardPostDetail pattern)
10. Rewrite thread create form → use `saveCommunityThread()`
11. Rewrite reply box → use `saveCommunityReply()`
12. Add `PublishStatusBadge` to thread view

### Phase D: Cleanup
13. Delete old adapter files
14. Delete old service files
15. Delete old type files
16. Delete old hooks

---

## 9. What Stays the Same

- Community creation flow (create Lens Group + Feed) — works fine
- Community settings (moderators, rules, membership) — works fine
- Community membership (join/leave) — works fine
- Profile page — works fine
- Notifications — works fine
- The `/communities` list page — works fine, just reads from Supabase

The rework only affects **how threads and replies are created, stored, and displayed** within a community. The community management layer stays untouched.
