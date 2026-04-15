# Fountain-Based Forum Architecture — Complete Design

## Core Concept

Every piece of content in the forum (root posts AND replies) is a full Lens
Publication with rich text, stored on Grove. The forum thread structure is
maintained entirely in Supabase. The UI stitches publications together into
a traditional forum view.

```
ONCHAIN (Lens Protocol):
  Publication A (root post — full article)
  Publication B (reply #1 — full article, commentOn: A)
  Publication C (reply #2 — full article, commentOn: A)
  Publication D (reply #3 — full article, commentOn: A)

  All are independent, first-class publications.
  All visible on Hey.xyz, fountain.ink, etc. as standalone articles.

SUPABASE (thread tracking):
  Thread { id, root_publication_id: A, category: "beginners", feed: "commons" }
  Reply  { id, thread_id, publication_id: B, position: 1 }
  Reply  { id, thread_id, publication_id: C, position: 2 }
  Reply  { id, thread_id, publication_id: D, position: 3 }

YOUR UI:
  /boards/commons?category=beginners
    → Thread: "How do I get started?"
      ├─ [Full article A — root post with rich formatting]
      ├─ [Full article B — reply #1, same rich editor]
      ├─ [Full article C — reply #2]
      └─ [Full article D — reply #3]
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│  FORKED FOUNTAIN.INK APP                                  │
│                                                            │
│  ┌─ Plate.js Editor (from fountain)                        │
│  │  Full rich text, images, embeds, code blocks             │
│  │  Used for BOTH root posts AND replies                    │
│  │                                                          │
│  ├─ Auth Server (from fountain/auth)                       │
│  │  Authorization Endpoint + App Verification               │
│  │                                                          │
│  ├─ Forum Layer (NEW — the addition)                       │
│  │  ├─ Board/Category browsing UI                          │
│  │  ├─ Thread view (stacks publications vertically)        │
│  │  ├─ Reply flow (creates full publication,                │
│  │  │   links via commentOn, tracks in Supabase)           │
│  │  ├─ Voting/reactions                                    │
│  │  └─ Moderation tools                                    │
│  │                                                          │
│  ├─ Supabase (thread tracking + metadata)                  │
│  │  ├─ threads (root_pub_id, category, feed, title, etc.)  │
│  │  ├─ thread_replies (pub_id, thread_id, position, etc.)  │
│  │  ├─ categories (slug, name, section, display_order)     │
│  │  └─ communities (lens_group_address, etc.)              │
│  │                                                          │
│  ├─ Lens Protocol                                          │
│  │  ├─ 1 App (existing: 0x637E...)                         │
│  │  ├─ 2 Groups (Commons + Research)                       │
│  │  ├─ 2 Feeds (group-gated)                               │
│  │  └─ Auth Endpoint + App Signer registered               │
│  │                                                          │
│  └─ Grove Storage                                          │
│     Every publication's content stored as full article JSON  │
└──────────────────────────────────────────────────────────┘
```

---

## Lens Publication Strategy

### Root Posts
```ts
// Creating a new thread root post
const result = await post(sessionClient, {
  contentUri: uri(groveUri),        // full article content on Grove
  feed: evmAddress(COMMONS_FEED),   // or RESEARCH_FEED
});
// Then track in Supabase:
// INSERT INTO threads (root_publication_id, category, title, author, ...)
```

### Replies (also full publications)
```ts
// Creating a reply — it's a full article that comments on the root
const result = await post(sessionClient, {
  contentUri: uri(groveUri),        // full article content on Grove
  commentOn: { post: postId(rootPublicationId) },
  feed: evmAddress(COMMONS_FEED),   // same feed as root
});
// Then track in Supabase:
// INSERT INTO thread_replies (thread_id, publication_id, position, author, ...)
```

Key: using `commentOn` maintains the Lens-native parent-child relationship,
so other apps can still see the thread structure. But the content of each
"comment" is a full article, not a short text reply.

### Why commentOn Still Matters

Even though Supabase tracks the thread, using `commentOn` means:
- Hey.xyz shows replies nested under the root post
- Lens stats (comments count) work correctly
- The relationship is onchain, not just in your DB
- Other apps can reconstruct the thread without your Supabase

---

## Supabase Schema (Simplified)

### threads
```sql
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_publication_id TEXT UNIQUE NOT NULL,  -- Lens post ID
  feed TEXT NOT NULL,                         -- 'commons' or 'research'
  category TEXT NOT NULL,                     -- 'beginners', 'dao-governance', etc.
  title TEXT NOT NULL,
  author TEXT NOT NULL,                       -- Lens account address
  reply_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### thread_replies
```sql
CREATE TABLE thread_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  publication_id TEXT UNIQUE NOT NULL,        -- Lens post ID
  author TEXT NOT NULL,
  position INTEGER NOT NULL,                  -- display order
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### categories
```sql
CREATE TABLE categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  section TEXT NOT NULL,     -- 'general', 'functions', 'partners', 'others'
  display_order INTEGER,
  feed TEXT NOT NULL          -- 'commons' or 'research'
);
```

This replaces the current: feeds, feed_posts, communities, community_threads,
research_publications, research_categories tables.

---

## What Comes From Fountain.ink vs What's New

### FROM FOUNTAIN.INK (fork as-is or adapt):
- Plate.js editor setup + extensions
- Grove storage upload/download
- Lens authentication flow
- Auth server (authorize + verify endpoints)
- Article metadata creation
- Content rendering
- Supabase integration patterns
- Next.js app structure

### NEW (forum layer to build):
- Board/category listing pages
- Thread list view (with reply counts, last activity, etc.)
- Thread detail view (stacked publications)
- Reply creation flow (full editor → publish as commentOn)
- Category management
- Voting/reactions
- Moderation (hide replies, ban members)
- Community/Group management
- Supabase thread tracking tables

### FROM CURRENT WEB3FORUM (port over):
- Community creation/management hooks
- Group membership (join, leave, approve)
- Moderator tools
- Voting system
- Notification system
- Profile pages

---

## Problems This Solves

| Problem in Current Codebase | How Fountain Approach Fixes It |
|---|---|
| 26+ unmanaged feeds | 2 feeds, categories in Supabase |
| Comments have limited formatting | Every reply is a full article |
| ProseKit editor bugs | Plate.js (mature, collaborative) |
| No auth endpoint | Fountain's auth server, ready to use |
| No app verification | Built into fountain's auth |
| Two parallel data pipelines | One unified pipeline |
| Placeholder feed addresses | No placeholders needed |
| Research vs Boards confusion | Same system, different category |
| Feed-per-topic complexity | Category-per-topic simplicity |
| Builder auth confusion | Clear script-based setup |

---

## Migration Path

### Phase 1: Fork & Setup
1. Fork fountain-ink/app
2. Fork fountain-ink/auth
3. Configure for your Lens App (0x637E...)
4. Deploy auth server
5. Register auth endpoint + signer via Builder script

### Phase 2: Forum Layer
1. Create Supabase schema (threads, thread_replies, categories)
2. Build board listing page
3. Build thread list page (filtered by category)
4. Build thread detail page (stacked publications)
5. Build reply flow (Plate.js editor → full publication → commentOn)

### Phase 3: Port Features
1. Port community/group management from current codebase
2. Port voting system
3. Port moderation tools
4. Port notification system
5. Port profile pages

### Phase 4: Groups & Gating
1. Create 2 Groups (Commons + Research) with MembershipApprovalGroupRule
2. Create 2 Feeds with GroupGatedFeedRule
3. Update auth endpoint to check group membership
4. Seed categories table

### Phase 5: Polish
1. Responsive design
2. Search
3. User preferences
4. Performance optimization
