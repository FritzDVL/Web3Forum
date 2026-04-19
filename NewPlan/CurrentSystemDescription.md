# Current System Description — Web3Forum

> Accurate snapshot of how the app works as of April 19, 2026.

---

## Architecture Overview

The app is a forum built on Next.js 14 (App Router) with two data layers:

- **Supabase** — the fast layer. All page rendering reads from Supabase. Posts are saved here instantly.
- **Lens Protocol** — the permanent layer. Posts are published on-chain as standalone articles. This gives each post a Grove hash (immutable content link) that anyone can use to verify or archive the content.

The key idea: save to Supabase first (user sees the post immediately), then publish to Lens in the same flow (wallet popup appears, user signs, post goes on-chain). The "on-chain" badge in the thread view lights up once the Lens publish confirms.

---

## Three Areas of the Forum

### 1. Boards (Commons)

The main forum. One Lens Group + one Lens Feed for everything. Child-boards are a UI-level organization stored in the `forum_boards` Supabase table.

**Lens addresses:**
- `COMMONS_GROUP_ADDRESS` — the Lens Group (open membership)
- `COMMONS_FEED_ADDRESS` — the single Lens Feed all board posts publish to

**Child-boards:** 24 boards across 4 sections (General Discussion, Functions, Partners, Others). Each is a row in `forum_boards` with a `slug`, `name`, `section`, and stats. The `technical` section was removed — those topics live in Research.

**How posting works:**
1. User navigates to `/boards/[slug]/new-post`
2. Fills in title, summary, content (ProseKit editor), tags
3. Clicks "Create Post"
4. `saveForumThread()` runs — generates a slug, INSERTs into `forum_threads`, increments `forum_boards.thread_count`. This is instant (2 Supabase calls via server actions).
5. `publishForumThreadToLens()` runs — builds Lens article metadata with forum attributes (`forumType`, `forumCategory`, `app: "lensforum"`, `contentJson`), uploads to Grove, publishes to `COMMONS_FEED_ADDRESS`. Wallet popup appears. User signs.
6. On Lens success: Supabase row updated with `lens_post_id`, `content_uri`, `publish_status = "confirmed"`.
7. On Lens failure: `publish_status = "failed"`. Post still visible from Supabase.
8. `window.location.href` redirects to the board page. Post appears in the list.

**How reading works:**
- Homepage (`/`): `getBoardSections()` queries `forum_boards` grouped by section. Pure Supabase. Zero Lens calls.
- Board page (`/boards/[slug]`): `getBoardPosts(slug)` queries `forum_threads WHERE board_slug = slug`. Pure Supabase.
- Thread page (`/boards/[slug]/post/[postId]`): `getBoardPost(postId)` + `getBoardPostReplies(threadId)`. Pure Supabase. Renders stacked article cards (root + replies), each with a `PublishStatusBadge`.

### 2. Research

A flat stream of research topics, filterable by category and tag. Separate Lens Group + Feed.

**Lens addresses:**
- `RESEARCH_GROUP_ADDRESS`
- `RESEARCH_FEED_ADDRESS`

**Categories:** 6 fixed categories in `research_categories` table (Architecture, State Machine, Consensus, Cryptography, Account System, Security), each with a color.

**How posting works:**
- `saveResearchThread()` — saves to `research_publications` with `is_root = true`. Supabase only. No Lens publish currently wired (same pattern as boards but the Lens step isn't called from the hook yet).
- `saveResearchResponse()` — saves a response to `research_publications` with `is_root = false`, linked to the root via `root_lens_post_id`.

**How reading works:**
- Research page (`/research`): `getResearchThreads()` queries `research_publications WHERE is_root = true`. Tries to fetch Lens posts for enrichment but falls back to Supabase data if unavailable.
- Thread page (`/research/thread/[threadId]`): `getResearchThread()` fetches root + all responses. Same Lens fallback.

### 3. Communities (Local/Language Groups)

Reddit-style communities. Each community has its own Lens Group + Feed. Threads use `commentOn` for replies (the old architecture — kept intentionally for conversational discussions).

**How it works:**
- Community creation (`/communities/new`): Admin-only. Creates a Lens Group (which auto-creates a Feed), saves to `communities` table.
- Thread creation: Publishes a Lens article to the community's feed, saves to `community_threads` table.
- Replies: Uses Lens `commentOn` — replies are Lens comments on the root post. Fetched from Lens API.
- Reading: `getCommunity()` fetches from Lens (Group metadata, stats, moderators). `getCommunityThreads()` fetches from Supabase + Lens.

This area still depends on Lens for reads. It was intentionally kept as-is.

---

## Database Schema (Supabase)

### Tables

| Table | Purpose | Rows |
|-------|---------|------|
| `forum_boards` | Child-board definitions (slug, name, section, stats) | 24 |
| `forum_threads` | Thread content + metadata (title, content_markdown, author, publish_status) | ~20+ |
| `forum_replies` | Reply content + metadata (position, content_markdown, publish_status) | 0 |
| `research_categories` | Research category definitions (slug, name, color) | 6 |
| `research_publications` | Research topics + responses (title, content, is_root, post_number) | ~2 |
| `communities` | Community definitions (name, lens_group_address, feed) | 0 |
| `community_threads` | Community thread metadata (title, slug, root_post_id) | 0 |
| `community_replies` | Community reply content (position, content_markdown) | 0 |

### Key columns on `forum_threads`

- `board_slug` — links thread to a child-board
- `content_markdown` — cached content for instant rendering (no Lens fetch needed)
- `content_json` — editor JSON for re-hydration (currently null, ProseKit outputs markdown)
- `lens_post_id` — Lens publication ID (null until on-chain publish confirms)
- `content_uri` — Grove storage URI (null until on-chain publish)
- `publish_status` — `pending` | `confirmed` | `failed`
- `author_address` — wallet address
- `author_username` — Lens username (resolved async after save)

---

## Page Routes

| Route | Type | Data Source | Lens Calls |
|-------|------|-------------|------------|
| `/` | Server | Supabase | None |
| `/boards/[slug]` | Server | Supabase | None |
| `/boards/[slug]/new-post` | Server + Client | Supabase (board) | Lens (on publish) |
| `/boards/[slug]/post/[postId]` | Server | Supabase | None |
| `/boards/[slug]/post/[postId]/reply` | Server + Client | Supabase | None (save only) |
| `/research` | Server | Supabase + Lens fallback | Optional |
| `/research/new` | Server + Client | Supabase | None (save only) |
| `/research/thread/[threadId]` | Server | Supabase + Lens fallback | Optional |
| `/communities` | Server | Supabase | None |
| `/communities/[address]` | Server | Supabase + Lens | Yes (Group metadata) |
| `/communities/new` | Client | None (admin gate) | Yes (on create) |
| `/communities/[address]/new-thread` | Client | Lens | Yes |
| `/thread/[slug]` | Server | Supabase + Lens | Yes (root post) |
| `/u/[username]` | Server | Lens | Yes |
| `/notifications` | Server | Lens | Yes |
| `/rewards` | Server | Lens | Yes |

---

## Lens Metadata Attributes

Every forum post published to Lens includes these attributes for recovery:

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `app` | `"lensforum"` | Filter — only recover posts from this app |
| `forumType` | `"thread"` / `"reply"` / `"research-topic"` / `"research-response"` | Classify post type during recovery |
| `forumCategory` | board slug or research category slug | Which board/category the post belongs to |
| `forumThreadId` | root post's `lens_post_id` | Links replies to their parent thread |
| `forumReplyPosition` | `"1"`, `"2"`, etc. | Reply ordering within a thread |
| `contentJson` | JSON string | Editor content for re-hydration |
| `author` | wallet address | Post author |
| `subtitle` | summary text | Thread summary |

---

## Components

### Boards
- `BoardPostList` — server component, renders thread list with grid columns (Topic, Started by, Replies, Views, Activity)
- `BoardPostDetail` — client component, stacked article cards (root + replies), each with `PublishStatusBadge`
- `BoardPostCreateForm` — client component, ProseKit editor form
- `BoardReplyBox` — client component, saves reply to Supabase only (no Lens publish wired yet)
- `BoardNavActions` — server component, Back + New Post buttons
- `PublishStatusBadge` — shows ✓ On-chain (green) / ⏳ Publishing (amber) / ⚠️ Off-chain (red)

### Research
- `ResearchThreadList` — client component, filterable thread list with category/tag dropdowns
- `ResearchThreadCard` — renders thread row, handles null Lens post gracefully
- `ResearchThreadView` — thread detail with stacked publications

### Communities (unchanged from original)
- `Thread` — Reddit-style thread with nested comments
- `ThreadCard`, `ThreadReplyCard` — render Lens Post objects
- `CommunityThreads` — thread list for a community
- `CommunityLinks` — lightweight cards on homepage (Supabase only, no Lens)

---

## What's NOT wired yet

1. **Reply Lens publish** — `BoardReplyBox` saves to Supabase but doesn't call `publishForumReplyToLens()`. Replies are Supabase-only.
2. **Research Lens publish** — `saveResearchThread()` and `saveResearchResponse()` save to Supabase but don't publish to Lens.
3. **Retry button** — `PublishStatusBadge` shows "Off-chain" for failed posts but the retry button doesn't call `retryPublish()` yet.
4. **On-chain viewer** — No dedicated view for checking Grove hash / Lens post ID. The badge shows status but doesn't link anywhere.
5. **Recovery script** — Not built yet. Would read all posts from Commons + Research feeds and reconstruct Supabase from metadata attributes.
6. **View count tracking** — The API route exists but uses `increment_forum_views` RPC which may not work correctly for all post types.
7. **Edit flow** — Thread editing exists for community threads but not for forum board threads.

---

## File Structure (key files only)

```
app/
  page.tsx                              — Homepage (Supabase only)
  boards/[slug]/
    page.tsx                            — Board thread list
    new-post/page.tsx                   — Create thread form
    post/[postId]/page.tsx              — Thread detail (stacked)
    post/[postId]/reply/page.tsx        — Reply form
  research/
    page.tsx                            — Research stream
    new/page.tsx                        — Create research topic
    thread/[threadId]/page.tsx          — Research thread detail
  communities/
    page.tsx                            — Communities list
    new/page.tsx                        — Create community (admin only)
    [address]/page.tsx                  — Community detail

lib/
  services/forum/
    publish-thread.ts                   — saveForumThread + publishForumThreadToLens
    publish-reply.ts                    — saveForumReply + publishForumReplyToLens
    retry-publish.ts                    — retryPublish for failed posts
  services/board/
    get-boards.ts                       — Homepage sections (Supabase)
    get-board.ts                        — Single board by slug
    get-board-posts.ts                  — Threads for a board
    get-board-post.ts                   — Single thread
    get-board-post-replies.ts           — Replies for a thread
  services/research/
    create-research-thread.ts           — Save research topic
    create-research-response.ts         — Save research response
    get-research-threads.ts             — Research list (Supabase + Lens fallback)
    get-research-thread.ts              — Research detail
  external/supabase/
    forum-boards.ts                     — forum_boards CRUD ("use server")
    forum-threads.ts                    — forum_threads CRUD ("use server")
    forum-replies.ts                    — forum_replies CRUD ("use server")
    research-publications.ts            — research_publications CRUD ("use server")
    research-categories.ts              — research_categories CRUD ("use server")
    communities.ts                      — communities CRUD ("use server")
    threads.ts                          — community_threads CRUD ("use server")
  external/lens/primitives/
    articles.ts                         — createThreadArticle, createForumReplyArticle, updateThreadArticle
    groups.ts                           — createLensGroup, fetchGroup, etc.
    feeds.ts                            — fetchFeed, createFeed
    posts.ts                            — fetchPostsByFeed, fetchCommentsByPostId, etc.
  domain/forum/types.ts                 — ForumBoard, ForumThread, ForumReply, PublishStatus
  shared/constants.ts                   — All Lens addresses + app config

components/
  boards/                               — Board UI components
  research/                             — Research UI components
  communities/                          — Community UI components (unchanged)
  thread/                               — Community thread components (unchanged, uses Lens)
  shared/publish-status-badge.tsx       — On-chain status indicator
  home/                                 — Homepage section components
  layout/                               — Navbar (desktop + mobile with Research button)

supabase/
  fresh-schema.sql                      — Complete schema for clean Supabase setup
```
