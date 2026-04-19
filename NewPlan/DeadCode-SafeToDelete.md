# Dead Code — Files Safe to Delete

> These 6 files are remnants of the old architecture where each child-board had its own Lens Feed address. They are no longer imported by any active code. Delete them at the end of the project.

---

## 1. `lib/external/supabase/feeds.ts`

**What it did:** Queried the old `feeds` Supabase table — each row was a child-board with its own `lens_feed_address`. Functions: `fetchFeedByAddress`, `fetchAllFeeds`, `fetchFeedsByCategory`.

**Why it's dead:** Replaced by `lib/external/supabase/forum-boards.ts`. Child-boards are now rows in `forum_boards` with slugs. All boards share one Commons Feed.

---

## 2. `lib/external/supabase/feed-posts.ts`

**What it did:** CRUD for the old `feed_posts` table — stored root posts per feed. Functions: `persistFeedPost`, `fetchFeedPosts`, `fetchFeedPostByLensId`, `incrementFeedPostRepliesCount`, `updateFeedPostStats`.

**Why it's dead:** Replaced by `lib/external/supabase/forum-threads.ts`. Threads are now in `forum_threads` with content caching, publish_status, and slug-based routing.

---

## 3. `lib/adapters/board-adapter.ts`

**What it did:** Transformed old Supabase `feeds` rows into `Board` objects, and Lens `Post` objects into `BoardPost` objects. Functions: `adaptFeedToBoard`, `adaptLensPostToBoardPost`.

**Why it's dead:** The new board read layer (`get-board.ts`, `get-board-posts.ts`) transforms `ForumBoardRow` and `ForumThreadRow` directly. No adapter needed.

---

## 4. `lib/domain/boards/types.ts`

**What it did:** Defined the old `Board` type (with `feedAddress: Address`) and `BoardPost` type (with `rootPost: Post`, `author: Account` — Lens SDK objects). Also `CreateBoardPostFormData`.

**Why it's dead:** Replaced by `lib/domain/forum/types.ts` which defines `ForumBoard`, `ForumThread`, `ForumReply` — all Supabase-native types with no Lens SDK dependencies.

---

## 5. `lib/services/board/create-board-post.ts`

**What it did:** Old Lens-first board post creation. Published to Lens first, then saved to `feed_posts` table. Took a `Board` object with `feedAddress` and used `createThreadArticle` targeting that specific feed.

**Why it's dead:** Replaced by `lib/services/forum/publish-thread.ts` which uses `saveForumThread` (Supabase-first) + `publishForumThreadToLens` (deferred). All posts go to one `COMMONS_FEED_ADDRESS`.

---

## 6. `config/commons-config.ts`

**What it did:** Hardcoded array of 28+ Lens Feed addresses organized into sections (`COMMONS_SECTIONS`). Each child-board had its own `address` field pointing to a unique Lens Feed. This was the original source of truth for the homepage layout.

**Why it's dead:** Replaced by the `forum_boards` Supabase table. Board definitions are now database rows with slugs, not hardcoded addresses. The homepage reads from `getBoardSections()` which queries `forum_boards`.
