# Option C (Final): Board-Centric Forum + Communities

**Date:** March 16, 2026
**Status:** Design Document — Awaiting Approval

---

## Scope

This document covers **two systems only**:

1. **Boards** — 24+ Lens Feeds as fixed topic containers (the `/commons/` section)
2. **Communities** — Lens Groups for language subgroups (the `/communities/` section)

The **Research section** (7 technical feeds) will be developed in a separate repository. For now, those 7 feeds remain in the UI as a facade with their current locked appearance. No implementation work on them in this repo.

---

## 1. Current State of the Boards System

### What's Working

The boards system is more functional than previously assessed:

- **28+ real Lens Feeds** deployed on-chain, addresses stored in Supabase `feeds` table
- **Posts propagate to Lens** — visible on Hey, Soclly, and other Lens apps
- **Post creation** works via `createThreadArticle` → publishes to the correct Lens Feed
- **Reply creation** works via `createFeedReply` → creates Lens Comments on posts
- **Feed pages** render at `/commons/[address]` with post lists
- **Post detail pages** render at `/commons/[address]/post/[postId]`
- **Reply pages** render at `/commons/[address]/post/[postId]/reply`
- **Supabase tracking** — `feeds` table (metadata, stats), `feed_posts` table (post cache), triggers for auto-updating counts
- **View tracking** — API endpoint at `/api/posts/[postId]/view`
- **Pagination** — cursor-based via Lens API
- **Markdown rendering** — ReactMarkdown in post detail and replies
- **Like button** — `LikeButton` component using `useVoting` hook (already on board posts!)

### What's Missing or Broken

| Issue | Root Cause | Fix Complexity |
|---|---|---|
| Post count on homepage shows wrong numbers | `feed.repliesCount` from Supabase may not sync with Lens | Small — verify trigger chain |
| No upvote/downvote buttons (only heart/like) | Board posts use `LikeButton` (heart) instead of `ThreadVotesDisplay` (arrows) | Small — swap component |
| Reply list uses generic avatar (gradient circle) | `ReplyList` doesn't use `AvatarProfileLink` component | Small — swap component |
| No notifications for board activity | Notifications page may not include feed post activity | Medium — verify Lens notification types |
| Migration SQL files have placeholder addresses | Real addresses only in live Supabase, not in code | Small — update SQL files |
| `PostDetail` doesn't show author avatar | Missing `AvatarProfileLink` in post header | Small — add component |

---

## 2. Existing Code Map for Boards

### Routes
```
app/commons/[address]/page.tsx              → Board page (list of posts)
app/commons/[address]/new-post/page.tsx     → Create new post form
app/commons/[address]/post/[postId]/page.tsx → Post detail + replies
app/commons/[address]/post/[postId]/reply/page.tsx → Reply form
```

### Components
```
components/commons/
├── feed-nav-actions.tsx          → Back button + "New Post" button
├── paginated-feed-posts-list.tsx → Wrapper with "Load More" pagination
├── feed-posts-list.tsx           → Post cards list (has avatar + like button)
├── post-detail.tsx               → Full post view + reply section
├── reply-list.tsx                → List of replies (missing real avatars)
├── reply-form.tsx                → Quick reply form (unused?)
├── create-reply-form.tsx         → Full reply creation form
└── create-post-form.tsx          → Post creation form
```

### Services
```
lib/services/feed/
├── create-feed-post.ts     → Creates post on Lens + saves to Supabase
├── create-feed-reply-client.ts → Creates reply on Lens + saves to Supabase
├── get-feed-posts.ts       → Fetches posts from Lens + merges with Supabase
├── get-feed-post.ts        → Fetches single post
└── get-feeds.ts            → Fetches feed sections for homepage
```

### Adapters
```
lib/adapters/
├── feed-adapter.ts         → Lens Post → FeedPost (for boards)
├── thread-adapter.ts       → Lens Post → Thread (for communities)
└── community-adapter.ts    → Lens Group → Community
```

### Hooks (Shared — already work for boards)
```
hooks/common/use-voting.ts  → Upvote/downvote logic (used by LikeButton)
```

### Components (Shared — can be used in boards)
```
components/ui/like-button.tsx                    → Heart-style like (already used)
components/home/thread-votes-display.tsx          → Arrow-style up/down votes
components/notifications/avatar-profile-link.tsx  → Avatar with link to profile
```

---

## 3. Implementation Plan: Fix the Boards

### Task 1: Add Upvote/Downvote to Board Posts (replace heart with arrows)

**Current:** `FeedPostsList` uses `<LikeButton>` which shows a heart icon.
**Target:** Use arrow-style upvote/downvote like `ThreadVotesDisplay` but interactive.

**Files to modify:**
- `components/commons/feed-posts-list.tsx` — replace `LikeButton` with a new `PostVoting` component
- The new component should combine the arrow UI from `ThreadVotesDisplay` with the click handlers from `useVoting`

**What to build:**
```
components/commons/post-voting.tsx (new)
- Uses useVoting hook (already exists)
- Renders ArrowUp + score + ArrowDown
- Handles upvote/downvote clicks
- Shows loading state
- Disabled when not logged in
```

**Also update:**
- `components/commons/post-detail.tsx` — add `PostVoting` next to the reply button
- `components/commons/reply-list.tsx` — keep `LikeButton` for replies (hearts are fine for short comments)

### Task 2: Add Real Avatars to Replies

**Current:** `ReplyList` renders a gradient circle with the first letter of the username.
**Target:** Use `AvatarProfileLink` component (already exists, used in `FeedPostsList`).

**Files to modify:**
- `components/commons/reply-list.tsx`

**Problem:** The reply data structure uses `reply.author.username` (string) and `reply.author.address` (string), but `AvatarProfileLink` expects a Lens `Account` object with `metadata.picture`.

**Fix:** The reply data needs to include the full Lens Account object, or we need to fetch it. Check how `createFeedReply` returns reply data and whether the Lens Post object includes the full author Account.

**Investigation needed:**
- Check `createFeedReply` return type — does `createdPost.author` have the full Account?
- Check `getFeedPostReplies` (or equivalent) — does it return full Account objects?
- If not, we need to batch-fetch accounts for reply authors

### Task 3: Fix Post Count on Homepage

**Current:** The homepage `ForumCategory` component shows `feed.repliesCount` from the `get-feeds.ts` service, which reads from Supabase `feeds.replies_count`.

**The chain:**
1. User creates a reply → `createFeedReply` saves to `feed_posts` table
2. Supabase trigger `update_feed_stats_on_post_create` fires → increments `feeds.post_count`
3. Supabase trigger `update_feed_reply_count` fires when `feed_posts.replies_count` changes → increments `feeds.replies_count`
4. Homepage reads `feeds.replies_count` via `get-feeds.ts`

**Potential issues:**
- The `feed_posts` insert in `createFeedReply` may not have the correct `feed_id` (it uses the feed's UUID, not the address)
- The `replies_count` on `feed_posts` is updated by `adaptLensPostToFeedPost` which syncs from Lens stats — but only when the post is fetched, not when a reply is created
- The `post_count` column tracks root posts, `replies_count` tracks total replies across all posts in the feed

**Fix approach:**
1. Verify the trigger chain works by checking Supabase data directly
2. If triggers work: the count is correct but may be stale (only updates on next fetch)
3. If triggers don't work: fix the `feed_id` reference in reply creation
4. Consider also showing `feed.post_count` (number of topics) alongside `replies_count`

### Task 4: Add Author Avatar to Post Detail

**Current:** `PostDetail` shows author name and handle but no avatar image.
**Target:** Add `AvatarProfileLink` to the post header.

**Files to modify:**
- `components/commons/post-detail.tsx` — add avatar in the post header section

**Simple change:** The `post.author` is already a full Lens `Account` object (from `FeedPost.author`), so `AvatarProfileLink` can be used directly.

### Task 5: Verify Notifications Work for Board Posts

**Current:** Notifications page exists but may not show activity from board posts.

**Investigation:**
- Board posts are real Lens posts, so Lens should generate notifications for:
  - Comments on your post (reply notifications)
  - Reactions on your post (like/upvote notifications)
  - Mentions in posts/replies
- Check if the notifications page filters by app address — if it only shows notifications from the Communities system, board notifications would be excluded

**Files to check:**
- `hooks/notifications/use-notifications.ts` — does it filter by app?
- `components/notifications/notifications-list.tsx` — does it handle all notification types?
- Notification items need to link to `/commons/[address]/post/[postId]` for board posts (not `/thread/[slug]`)

### Task 6: Update Migration Files (Documentation)

**Current:** Seed SQL files have `feed-1`, `feed-2` placeholder addresses.
**Target:** Update with real Lens Feed addresses from Supabase.

**How:**
1. Export current feed data from Supabase: `SELECT lens_feed_address, title, category, display_order, is_locked, featured FROM feeds ORDER BY display_order`
2. Update `20260227_seed_feeds_data.sql` with real `0x` addresses
3. Update `20260302_fix_technical_feeds.sql` with real addresses
4. This ensures anyone cloning the repo can reproduce the database

---

## 4. Implementation Order

```
Task 4: Add avatar to PostDetail          → 15 min (one component addition)
Task 1: Add upvote/downvote to posts      → 2-3 hours (new component + wiring)
Task 2: Add real avatars to replies        → 1-2 hours (depends on data shape)
Task 3: Fix post count on homepage         → 1-2 hours (investigation + fix)
Task 5: Verify notifications              → 2-3 hours (investigation + potential fixes)
Task 6: Update migration files            → 30 min (data export + SQL update)
```

**Total: ~1.5 to 2 days of focused work**

After these 6 tasks, the Boards system will have feature parity with the Communities system for the core interactions: posting, replying, voting, avatars, notifications, and accurate stats.

---

## 5. Communities System — Remaining Work

The Communities system (`/communities/`) is mostly working. Remaining items from Feedback.md:

| Bug | Status | Notes |
|---|---|---|
| Join community button | ✅ Fixed | We fixed this in the previous session |
| Post count in community cards | Not fixed | `adaptGroupToCommunity` doesn't set `postCount` — needs to read `group.feed.stats.posts` |
| Switch account | Debug logging added | Needs testing and fix |
| Notifications | Debug logging added | May be fixed by Task 5 above (shared notification system) |

The community post count fix is the same pattern as the board post count — read from Lens stats instead of (or in addition to) Supabase.

---

## 6. What NOT to Touch

- **Research section (7 technical feeds)** — leave the locked UI facade as-is. No implementation work. Will be built in separate repo.
- **Lens primitives layer** (`lib/external/lens/primitives/`) — this is solid, don't modify
- **Community thread system** (`lib/services/thread/`) — working, don't merge with boards
- **Authentication system** — working, don't modify
- **Homepage layout** — working, just fix the data it displays

---

## 7. Architecture After Implementation

```
┌──────────────────────────────────────────────────────────┐
│                      HOMEPAGE                             │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────────────┐ │
│  │ Board List   │  │ Research │  │ Community Grid      │ │
│  │ (4 categories│  │ (locked  │  │ (language groups)   │ │
│  │  24 feeds)   │  │  facade) │  │                     │ │
│  └──────┬───────┘  └──────────┘  └──────────┬──────────┘ │
└─────────┼────────────────────────────────────┼────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────┐              ┌──────────────────────┐
│ /commons/[addr]  │              │ /communities/[addr]  │
│                  │              │                      │
│ Board Page       │              │ Community Page       │
│ - Post list      │              │ - Thread list        │
│ - Voting (↑↓)    │              │ - Voting (↑↓)        │
│ - Avatars        │              │ - Avatars            │
│ - Post count     │              │ - Member count       │
│ - Pagination     │              │ - Join/Leave         │
│                  │              │ - Moderation         │
│ Post Detail      │              │                      │
│ - Full content   │              │ Thread Detail        │
│ - Reply list     │              │ - Full content       │
│ - Voting         │              │ - Reply tree         │
│ - Avatars        │              │ - Voting             │
└──────────────────┘              └──────────────────────┘
          │                                    │
          ▼                                    ▼
┌──────────────────────────────────────────────────────────┐
│              SHARED LENS PRIMITIVES LAYER                 │
│  articles.ts │ posts.ts │ groups.ts │ feeds.ts            │
├──────────────────────────────────────────────────────────┤
│              SHARED HOOKS                                 │
│  use-voting.ts │ use-notifications.ts │ auth-store.ts     │
├──────────────────────────────────────────────────────────┤
│              SHARED COMPONENTS                            │
│  AvatarProfileLink │ LikeButton │ ContentRenderer        │
├──────────────────────────────────────────────────────────┤
│              SUPABASE                                     │
│  feeds │ feed_posts │ communities │ community_threads     │
└──────────────────────────────────────────────────────────┘
```

---

## 8. Decisions Made

1. **Research section** → Separate repo. Facade stays in this app's UI.
2. **Boards use Lens Feeds directly** → No Groups needed for open boards. The Lens Feed IS the board.
3. **Communities stay as-is** → Lens Groups for language subgroups. Separate system, separate routes.
4. **Board comments are flat** → One level of replies under each post. No deep nesting.
5. **Voting style** → Arrow up/down for board posts (forum-style). Hearts for replies (lightweight).
6. **Post count source** → Supabase triggers (already in place). Verify they work, fix if not.

---

## 9. Next Steps

1. Review and approve this plan
2. Commit current changes
3. Start with Task 4 (avatar on PostDetail — quickest win)
4. Then Task 1 (voting — highest impact)
5. Work through Tasks 2-6 in order
6. Test end-to-end
7. Then tackle remaining Community bugs
