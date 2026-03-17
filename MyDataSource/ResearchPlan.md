# Research System Implementation Plan (v5)

**Date:** March 17, 2026
**Status:** Planning — All decisions confirmed, ready for build spec

---

## 1. Core Concept

The Research section is a single unified space — like Discourse or ethresear.ch. From the outside (homepage), 7 category entries show publication counts. Clicking any of them sends the user to the Research page, which always shows the most recent threads first. Inside, the user can sort/filter by Recency, Categories, or Tags.

Every piece of content is a full publication with the same rich editor. The root publication is simply post #1 in a thread. All posts are at the same level — same visual treatment, same formatting, same weight. No hierarchy, no nesting. Flat threads.

---

## 2. Confirmed Decisions

| Question | Answer |
|----------|--------|
| **Q1: Research Group** | Does not exist yet. User will create it. User is owner/admin. |
| **Q2: Research Feed** | Does not exist yet. User will delete the 7 existing technical feeds and create 1 new Research Feed. |
| **Q3: Access model** | Token-gated with ERC-1155. Initially approval-only to prevent bots until token is ready. |
| **Q4: Non-member posting** | No. Only vetted members can write anything (root topics + responses). Exclusive. |
| **Q5: Existing 7 feeds** | Discarded. No longer needed. |
| **Categories/tags storage** | Supabase only. Not saved as separate Lens containers. Categories and tags are metadata in the `article()` content and Supabase rows. |
| **Lens model** | 1 Group + 1 Feed. Cleanest approach. |
| **Thread model** | Flat. All posts same level. Root is just #1. |
| **Board flat threads** | User wants to retrofit Boards to flat model too, but AFTER Research is done. |

---

## 3. The Discourse/ethresear.ch Model

### Creating a new topic

1. User clicks "New Topic" on the Research page
2. Fills in: title, category (one of 7), tags (optional), content (full rich editor)
3. This creates a thread — the content becomes post #1
4. The thread appears in the listing, filtered by its category

### Inside a thread

All posts are flat and visually identical:

```
Thread: "On the Impossibility of Stateless Consensus"
Category: Consensus · Tags: #bft #proof · 👁 120 views

┌──────────────────────────────────────────────────────────┐
│ #1 · @researcher · March 15, 2026                ▲ 23   │
│                                                          │
│ We present a formal proof that any consensus             │
│ mechanism requiring fewer than...                        │
│                                                          │
│ [Full rich content — same level as all others]           │
│                                                          │
│                                                  Reply   │
├──────────────────────────────────────────────────────────┤
│ #2 · @reviewer1 · March 16, 2026                 ▲ 8    │
│                                                          │
│ > @researcher wrote:                                     │
│ > "any consensus mechanism requiring fewer than..."      │
│                                                          │
│ I disagree with this premise. Consider the case where... │
│                                                          │
│                                                  Reply   │
├──────────────────────────────────────────────────────────┤
│ #3 · @reviewer2 · March 16, 2026                 ▲ 5    │
│                                                          │
│ Building on what @reviewer1 said...                      │
│                                                          │
│                                                  Reply   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Full TextEditor — write your response here]             │
│                                                          │
│                                     [Post Response]      │
└──────────────────────────────────────────────────────────┘
```

- Every post has a "Reply" button at the bottom right
- Clicking "Reply" on any post → opens/scrolls to the composer at the bottom, pre-filled with a blockquote of that post's content and author attribution
- The composer is always at the bottom — full TextEditor, same capabilities as the root post editor
- Post #1 looks identical to #2, #3, etc.

---

## 4. Lens Primitive Mapping

### Why 1 Group + 1 Feed is optimal

| Alternative | Problem |
|-------------|---------|
| 7 Feeds (one per category) | Cross-category browsing requires 7 API calls. Categories become rigid Lens containers instead of flexible metadata. |
| No Feed, just Group posts | Feeds provide better query/filter APIs from Lens. Without a Feed, fetching posts is harder. |
| Multiple Groups | Unnecessary complexity. One Group gates access to one Feed. |

**Chosen: 1 Group + 1 Feed.** Categories and tags are Supabase metadata only.

### How it maps

```
Lens Group: "Society Protocol Research"
  ├── Gates write access (ERC-1155 token / approval-only)
  └── Lens Feed: "Research Feed"
        ├── Post A (root, article metadata: title + content + tags)
        │     ├── Post B (commentOn: A, article metadata: content only)
        │     ├── Post C (commentOn: A, article metadata: content only)
        │     └── Post D (commentOn: A, article metadata: content only)
        └── Post E (root, article metadata: title + content + tags)
              └── Post F (commentOn: E, article metadata: content only)
```

- Root posts = `post()` with `feed` + `article()` metadata (has title, tags)
- Responses = `post()` with `commentOn: root` + `article()` metadata (content only)
- ALL responses point to the ROOT (flat, not nested)
- `article()` metadata supports full markdown — same as root posts

### Existing Lens primitives (no new ones needed)

| Operation | Lens API | Exists? |
|-----------|----------|---------|
| Create root | `post()` with `feed` + `article()` | ✅ `createThreadArticle` |
| Create response | `post()` with `commentOn` + `article()` | ✅ `createReply` (already uses `article()`) |
| Fetch roots | `fetchPosts({ filter: { feeds, postTypes: [Root] } })` | ✅ `fetchPostsByFeed` |
| Fetch responses | `fetchPostReferences(post, { referenceTypes: [CommentOn] })` | ✅ `fetchCommentsByPostId` |
| Check membership | `group.operations.isMember` | ✅ `fetchGroupFromLens` |

---

## 5. UX: Outside (Homepage)

The 7 category entries on the homepage show publication counts:

```
SOCIETY PROTOCOL TECHNICAL SECTION
┌──────────────────────────┬────────┬───────┐
│ General Architecture     │ 12 pub │ 340 👁│  → /research
│ State Machine            │  8 pub │ 210 👁│  → /research
│ Architectural Objects    │  5 pub │ 120 👁│  → /research
│ Consensus                │ 15 pub │ 890 👁│  → /research
│ Cryptography             │ 11 pub │ 560 👁│  → /research
│ Account System           │  3 pub │  80 👁│  → /research
│ Security                 │  7 pub │ 290 👁│  → /research
└──────────────────────────┴────────┴───────┘
```

- All 7 link to `/research` (the same page)
- Publication counts come from Supabase `research_categories.publication_count`
- Counts track root publications only (new topics), not responses
- The Research page always opens showing the most recent threads first

---

## 6. UX: Inside (Research Page)

```
/research

┌─────────────────────────────────────────────────────────────┐
│  SOCIETY PROTOCOL RESEARCH                                   │
│  [Join Group]  or  [New Topic]                               │
│                                                              │
│  Sort by: [Recent ▾]  [Categories ▾]  [Tags ▾]              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📄 On the Impossibility of Stateless Consensus      │    │
│  │    by @researcher · 2 days ago · Consensus           │    │
│  │    Tags: #bft #proof                                 │    │
│  │    💬 4 posts · 👁 120 views · ▲ 23                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📄 Formal Verification of the Account Model         │    │
│  │    by @author2 · 5 days ago · Account System         │    │
│  │    Tags: #formal #model                              │    │
│  │    💬 12 posts · 👁 340 views · ▲ 45                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [Load More]                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Sorting/filtering options

- **Recent** (default): All threads sorted by most recent activity (last post date)
- **Categories**: Filter by one of the 7 categories (or "All")
- **Tags**: Filter by tag

These are Supabase queries. Lens stores the content; Supabase handles filtering/sorting.

---

## 7. Data Model

### Supabase

```sql
-- Categories (the 7 homepage entries + filtering)
CREATE TABLE research_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  publication_count INTEGER DEFAULT 0,  -- root topics only
  views_count INTEGER DEFAULT 0
);

-- All publications (root + responses)
CREATE TABLE research_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_post_id TEXT NOT NULL UNIQUE,
  root_lens_post_id TEXT,              -- NULL for root, root's ID for responses
  category_slug TEXT NOT NULL REFERENCES research_categories(slug),
  author_address TEXT NOT NULL,
  title TEXT,                          -- root only
  tags TEXT[],                         -- root only
  post_number INTEGER NOT NULL,        -- #1, #2, #3 within thread
  views_count INTEGER DEFAULT 0,       -- thread views (root only)
  total_posts INTEGER DEFAULT 1,       -- thread post count (root only)
  last_activity_at TIMESTAMPTZ DEFAULT now(),  -- for "recent" sorting (root only)
  is_root BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO research_categories (slug, name, description, display_order) VALUES
  ('architecture', 'General Architecture', 'System design and architecture', 1),
  ('state-machine', 'State Machine', 'State machine design and transitions', 2),
  ('objects', 'Architectural Objects', 'Core objects and data structures', 3),
  ('consensus', 'Consensus', 'Consensus mechanisms and protocols', 4),
  ('cryptography', 'Cryptography', 'Cryptographic primitives and protocols', 5),
  ('account-system', 'Account System', 'Account model and identity', 6),
  ('security', 'Security', 'Security analysis and threat models', 7);
```

When a response is created:
1. Insert into `research_publications` with `is_root = false`, `root_lens_post_id` set, `post_number` = next number
2. Increment `total_posts` on the root publication row
3. Update `last_activity_at` on the root publication row (for "recent" sorting)

When a root topic is created:
1. Insert into `research_publications` with `is_root = true`, `post_number = 1`
2. Increment `publication_count` on the matching `research_categories` row

---

## 8. Application Architecture

### Domain Types (`lib/domain/research/types.ts`)

```typescript
interface ResearchCategory {
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  publicationCount: number;
  viewsCount: number;
}

interface ResearchThread {
  rootPublication: ResearchPublication;
  category: ResearchCategory;
  title: string;
  tags: string[];
  totalPosts: number;
  viewsCount: number;
  lastActivityAt: string;
}

interface ResearchPublication {
  id: string;
  lensPostId: string;
  rootLensPostId: string | null;
  post: Post;                          // Full Lens Post — never destructured
  postNumber: number;
  isRoot: boolean;
  createdAt: string;
}
```

### Services (`lib/services/research/`)

```
get-research-categories.ts        — all 7 categories with counts
get-research-threads.ts           — thread listing (sorted by recency, filterable by category/tag)
get-research-thread.ts            — single thread: root + all responses (flat, ordered by post_number)
create-research-thread.ts         — create root topic (Lens post + Supabase)
create-research-response.ts       — create response (Lens commentOn + Supabase)
```

### Components (`components/research/`)

```
research-sort-filter.tsx          — sort/filter controls (Recent, Categories, Tags)
research-thread-card.tsx          — thread card for listing
research-thread-list.tsx          — list with pagination
research-post.tsx                 — single post in thread (all posts use this — #1, #2, #3...)
research-post-list.tsx            — flat list of posts
research-reply-editor.tsx         — full TextEditor at bottom + quote insertion
research-nav-actions.tsx          — back + "New Topic"
research-access-gate.tsx          — membership check / "Join Group"
```

### Routes (`app/research/`)

```
app/research/
├── page.tsx                      — listing (recent threads, sort/filter)
├── new/
│   └── page.tsx                  — create topic (title, category, tags, content)
└── thread/
    └── [threadId]/
        └── page.tsx              — thread page (flat posts + reply editor at bottom)
```

---

## 9. Homepage Integration

The 7 technical feeds in the `feeds` table are replaced by `research_categories`. The homepage component for the technical section reads from `research_categories` instead of `feeds`. Each entry links to `/research`.

The `feeds` table keeps only the board feeds (24 entries). Clean separation.

---

## 10. Editor Improvements (Tracked in ComposerImprovements.md)

Required for Research launch:
1. Add `remarkGfm` to `ContentRenderer` — table/GFM rendering
2. Quote-reply feature — "Reply" button on each post inserts blockquote with attribution into composer
3. Uncomment table support in slash menu

See `MyDataSource/ComposerImprovements.md` for full details.

---

## 11. Future: Board Flat Threads

User wants to retrofit the Board system to use the same flat thread model after Research is complete. Currently Boards use nested comment replies. The Research implementation will establish the flat thread pattern that Boards can adopt later.

---

## 12. What Makes Research Different from Boards

| Aspect | Boards (current) | Research |
|--------|-------------------|----------|
| Container | 24 separate Feeds | 1 Feed + 1 Group |
| Categories | Each feed IS a category | Supabase metadata |
| Thread model | Nested comment replies | Flat — all posts same level |
| Root post | Visually distinct | Same level as all others (#1) |
| Responses | Short comments, nested | Full publications, flat, same editor |
| Access | Open | Token-gated / approval-only |
| Sorting | By feed | By recency, category, or tag |
| Homepage | 24 board links → `/boards/[address]` | 7 category entries → `/research` |
| Route | `/boards/[address]/post/[id]` | `/research/thread/[id]` |
| Editor | Full TextEditor | Same + quote-reply |

---

## 13. Estimated Effort

| Phase | Description | Time |
|-------|-------------|------|
| 1 | Lens Group + Feed creation (user does this) | 30 min |
| 2 | Supabase migration (categories + publications) | 30 min |
| 3 | Domain types + adapters | 30 min |
| 4 | Services (5 files) | 2-3 hours |
| 5 | Hooks | 1 hour |
| 6 | Components (8 files) | 3-4 hours |
| 7 | Routes (3 pages) | 1-2 hours |
| 8 | Homepage integration | 1 hour |
| 9 | Editor improvements (remarkGfm + quote-reply) | 1-2 hours |
| 10 | Testing | 1-2 hours |

**Total: ~12-16 hours**

---

## 14. Next Steps

1. ✅ All questions answered — plan is confirmed
2. User creates the Lens Group (owner/admin) and provides the address
3. User creates 1 Lens Feed for Research and provides the address
4. User can delete the 7 old technical feed addresses
5. Create `ResearchBuildSpec.md` — exact code for each phase (same format as `BoardBuildSpec.md`)
6. Implement phase by phase
