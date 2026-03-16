# NewBoard.md — Ideal Board Architecture (From First Principles)

**Date:** March 16, 2026
**Purpose:** Define how the Board system SHOULD be built, using the Community system's proven patterns as the blueprint. This plan assumes we delete all existing `/commons/` code and rebuild it correctly.

---

## 1. The Problem With the Current Board Code

The Community system and the Board system do the same fundamental thing — display Lens Posts from a Lens Feed, with replies, voting, and avatars. But they were built by different people at different times with different patterns. Here's every architectural divergence and why it causes bugs:

### Divergence 1: Reply Data Shape

**Community system:**
```typescript
// lib/domain/replies/types.ts
interface Reply {
  id: string;
  thread: Address;
  post: Post;  // ← Full Lens Post object. Has .author (Account), .stats, .operations
}
```

**Board system:**
```typescript
// lib/services/feed/get-feed-replies.ts (defines its OWN Reply type!)
interface Reply {
  id: string;
  author: { address: string; username?: string; handle?: string; }; // ← Flat. No avatar. No stats.
  content: string;
  timestamp: string;
  repliesCount: number;
}
```

**Consequence:** Board replies can't show avatars (no `author.metadata.picture`), can't show voting state (no `post.operations.hasUpvoted`), and can't use `AvatarProfileLink` (expects `Account` type). The Community system avoids all of this by keeping the full Lens `Post` object.

### Divergence 2: Duplicate Reply Type Definition

The Board system defines its own `Reply` interface inside `get-feed-replies.ts` instead of using the shared `lib/domain/replies/types.ts`. This means:
- Two incompatible `Reply` types in the codebase
- Components built for one can't accept the other
- The `adaptPostToReply` adapter (used by Communities) is never used by Boards

### Divergence 3: Service Layer Duplication

| Operation | Community Service | Board Service | Same Lens API Call? |
|---|---|---|---|
| Create post | `createThread` → `createThreadArticle` | `createFeedPost` → `createThreadArticle` | **Yes** |
| Fetch posts | `getCommunityThreads` → `fetchPostsByFeed` | `getFeedPosts` → `fetchPostsByFeed` | **Yes** |
| Fetch replies | `getThreadReplies` → `fetchCommentsByPostId` | `getFeedReplies` → `fetchCommentsByPostId` | **Yes** |
| Create reply | `createReply` → `post(commentOn)` | `createFeedReply` → `post(commentOn)` | **Yes** |

Every service calls the same Lens primitives but wraps them differently. The Board versions lose data in the wrapping.

### Divergence 4: Adapter Pattern

**Community system:** Has a clean adapter layer:
- `adaptGroupToCommunity` — Lens Group → Community domain object
- `adaptFeedToThread` — Lens Post + DB record → Thread domain object
- `adaptPostToReply` — Lens Post → Reply domain object (keeps full Post)

**Board system:** Has one adapter:
- `adaptLensPostToFeedPost` — Lens Post + DB record → FeedPost domain object

But for replies, the Board system has NO adapter. It does inline mapping inside `getFeedReplies`, destructuring the Post into a flat object and losing data.

### Divergence 5: Hook Pattern

**Community system:**
```
useReplyCreate → calls createReply service → invalidates query cache → returns Reply
```
- Uses `queryClient.invalidateQueries` to refresh the reply list
- Returns the domain `Reply` type (with full Post)

**Board system:**
```
useFeedReplyCreate → calls createFeedReply service → returns flat reply object
```
- Does NOT invalidate any query cache
- Returns a flat `{ id, content, author, timestamp }` object
- The reply list doesn't auto-refresh after posting

### Divergence 6: Supabase Usage

**Community system:**
- `communities` table — stores group address, name, visibility
- `community_threads` table — stores thread metadata (title, summary, slug, author, root_post_id)
- Supabase is a metadata cache. The source of truth for content is Lens.
- Stats like `repliesCount` come from `rootPost.stats.comments` (Lens), not Supabase

**Board system:**
- `feeds` table — stores feed address, title, description, category, post_count, replies_count, views_count
- `feed_posts` table — stores post metadata (title, content, author, replies_count, views_count)
- Supabase tries to be the source of truth for stats via triggers
- This creates sync issues: Supabase counts can drift from Lens counts

---

## 2. The Ideal Board Architecture (From First Principles)

If we started fresh, knowing what works in the Community system, here's how the Board system should be built. The core principle: **follow the exact same layered architecture as Communities, just with different domain names.**

### Layer 1: Domain Types (`lib/domain/boards/types.ts`)

```typescript
import { Address } from "@/types/common";
import { Account, Post } from "@lens-protocol/client";

// A Board is a Lens Feed used as a fixed topic container
export interface Board {
  id: string;                    // Supabase UUID
  name: string;                  // "DAO Governance"
  description: string;           // "Decentralized governance discussions"
  feedAddress: Address;          // Real Lens Feed address (0x...)
  category: string;              // "general", "partners", "functions", "others"
  displayOrder: number;
  isLocked: boolean;             // true for research section (facade)
  postCount: number;             // from Lens feed.stats.posts
  repliesCount: number;          // from Supabase (aggregated)
  viewsCount: number;            // from Supabase (tracked locally)
  lastPostAt: string | null;     // from Supabase
}

// A BoardPost is a root Lens Post published to a Board's Feed
export interface BoardPost {
  id: string;                    // Supabase UUID (or Lens post ID if no DB record)
  lensPostId: string;            // Lens post ID
  board: Board;                  // Parent board reference
  rootPost: Post;                // Full Lens Post object — NEVER destructure this
  author: Account;               // From rootPost.author — full Account with avatar
  title: string;                 // Extracted from article metadata
  summary: string;
  repliesCount: number;          // From rootPost.stats.comments (Lens is source of truth)
  viewsCount: number;            // From Supabase (local tracking)
  createdAt: string;
  updatedAt: string;
}

// A BoardReply is a Lens Comment on a BoardPost
// REUSE the existing Reply type from communities:
// import { Reply } from "@/lib/domain/replies/types";
// Reply = { id, thread, post: Post }
// The full Lens Post is preserved. Avatar, stats, operations — all available.

export interface CreateBoardPostFormData {
  title: string;
  summary: string;
  content: string;
  tags?: string;
  author: Address;
}
```

**Key decision:** `BoardReply` is NOT a new type. It reuses `Reply` from `lib/domain/replies/types.ts`. This is the same type Communities use. One Reply type for the whole app.

### Layer 2: Adapters (`lib/adapters/board-adapter.ts`)

```typescript
import { Board, BoardPost } from "@/lib/domain/boards/types";
import { Address } from "@/types/common";
import { Post } from "@lens-protocol/client";
import { getThreadTitleAndSummary } from "@/lib/domain/threads/content";

// Supabase feed record → Board domain object
export function adaptFeedToBoard(dbFeed: FeedSupabase): Board {
  return {
    id: dbFeed.id,
    name: dbFeed.title,
    description: dbFeed.description || "",
    feedAddress: dbFeed.lens_feed_address as Address,
    category: dbFeed.category,
    displayOrder: dbFeed.display_order,
    isLocked: dbFeed.is_locked || false,
    postCount: dbFeed.post_count || 0,
    repliesCount: dbFeed.replies_count || 0,
    viewsCount: dbFeed.views_count || 0,
    lastPostAt: dbFeed.last_post_at || null,
  };
}

// Lens Post + optional DB record → BoardPost domain object
export function adaptLensPostToBoardPost(
  board: Board,
  lensPost: Post,
  dbPost?: FeedPostSupabase,
): BoardPost {
  const { title, summary } = getThreadTitleAndSummary(lensPost);
  return {
    id: dbPost?.id || lensPost.id,
    lensPostId: lensPost.id,
    board,
    rootPost: lensPost,                    // Full Post preserved
    author: lensPost.author,               // Full Account preserved
    title,
    summary,
    repliesCount: lensPost.stats.comments || 0,  // Lens is source of truth
    viewsCount: dbPost?.views_count || 0,         // Supabase for local-only data
    createdAt: lensPost.timestamp || new Date().toISOString(),
    updatedAt: dbPost?.updated_at || lensPost.timestamp || new Date().toISOString(),
  };
}

// For replies: REUSE adaptPostToReply from lib/adapters/reply-adapter.ts
// No new adapter needed. Same function Communities use.
```

**Key decision:** `repliesCount` comes from `lensPost.stats.comments`, not from Supabase. Supabase only tracks what Lens can't: view counts.

### Layer 3: Services (`lib/services/board/`)

Following the exact same pattern as `lib/services/thread/` and `lib/services/community/`:

```
lib/services/board/
├── get-board.ts              → Fetch single board by address
├── get-boards.ts             → Fetch all boards (for homepage)
├── get-board-posts.ts        → Fetch posts in a board (paginated)
├── get-board-post.ts         → Fetch single post by ID
├── create-board-post.ts      → Create a new post in a board
└── update-board-post.ts      → Edit a post (future)
```

For replies, **reuse the existing services**:
- `lib/services/reply/create-reply.ts` — already works for any Lens Comment
- `lib/services/reply/get-thread-replies.ts` — rename or generalize to `get-post-replies.ts`

The `createReply` service already accepts a `parentId` (any Lens Post ID) and a `threadAddress` (any Lens Feed address). It doesn't care if the parent is a Community thread or a Board post. It's the same Lens `commentOn` call.

**`get-board-posts.ts` pattern (mirrors `getCommunityThreads`):**
```typescript
export async function getBoardPosts(
  board: Board,
  options?: { limit?: number; cursor?: string },
): Promise<BoardPostsResult> {
  // 1. Fetch root posts from Lens Feed (same call as getCommunityThreads)
  const lensResult = await fetchPostsByFeed(board.feedAddress, undefined, {
    sort: "desc",
    limit: options?.limit || 10,
    cursor: options?.cursor,
  });

  // 2. Batch fetch DB records for metadata (views, etc.)
  const dbPosts = await Promise.all(
    lensResult.posts.map(post => fetchFeedPostByLensId(post.id))
  );

  // 3. Adapt using the board adapter
  const posts = lensResult.posts.map((lensPost, idx) =>
    adaptLensPostToBoardPost(board, lensPost, dbPosts[idx] || undefined)
  );

  return {
    success: true,
    posts,
    nextCursor: lensResult.pageInfo?.next ?? null,
    prevCursor: lensResult.pageInfo?.prev ?? null,
  };
}
```

**`create-board-post.ts` pattern (mirrors `createThread`):**
```typescript
export async function createBoardPost(
  board: Board,
  formData: CreateBoardPostFormData,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateBoardPostResult> {
  // 1. Create article on Lens (same call as createThread)
  const articleResult = await createThreadArticle({
    title: formData.title,
    content: formData.content,
    author: formData.author,
    summary: formData.summary,
    tags: formData.tags,
    feedAddress: board.feedAddress,
    slug: `${Date.now()}-${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  }, sessionClient, walletClient);

  if (!articleResult.success || !articleResult.post) {
    return { success: false, error: articleResult.error };
  }

  // 2. Persist metadata to Supabase
  const dbPost = await persistFeedPost(
    board.id,
    articleResult.post.id,
    formData.author,
    formData.title,
    formData.content,
  );

  // 3. Revalidate paths
  revalidatePath(`/commons/${board.feedAddress}`);
  revalidatePath("/");

  return { success: true };
}
```

### Layer 4: Hooks (`hooks/boards/`)

Following the exact same pattern as `hooks/forms/use-thread-create-form.ts` and `hooks/replies/use-reply-create.ts`:

```
hooks/boards/
├── use-board-post-create-form.ts  → Form state + validation + submit
└── use-board-posts-paginated.ts   → Paginated post fetching with cursor
```

For replies, **reuse the existing hook**:
- `hooks/replies/use-reply-create.ts` — already works. It calls `createReply` which accepts any parent post ID and feed address.

**`use-board-post-create-form.ts` pattern (mirrors `useThreadCreateForm`):**
```typescript
export function useBoardPostCreateForm({ board }: { board: Board }) {
  const [formData, setFormData] = useState<CreateBoardPostFormData>({...});
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isCreating, setIsCreating] = useState(false);

  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  // Validation (same pattern as useThreadCreateForm)
  const validateTitle = (value: string) => { ... };
  const validateContent = (value: string) => { ... };

  const handleSubmit = async (e: React.FormEvent) => {
    // Validate → call createBoardPost → toast → redirect
    const result = await createBoardPost(board, formData, sessionClient.data, walletClient.data);
    if (result.success) {
      toast.success("Post created!");
      router.push(`/commons/${board.feedAddress}`);
    }
  };

  return { formData, errors, touched, isCreating, handleChange, handleBlur, handleSubmit, isFormValid };
}
```

### Layer 5: Components (`components/boards/`)

Following the exact same component structure as `components/thread/`:

```
components/boards/
├── board-page.tsx              → Main board page (list of posts)
├── board-post-list.tsx         → List of post cards
├── board-post-card.tsx         → Single post card (avatar + title + stats + voting)
├── board-post-detail.tsx       → Full post view
├── board-post-create-form.tsx  → Post creation form
├── board-post-voting.tsx       → Upvote/downvote arrows (uses useVoting)
├── board-reply-list.tsx        → List of replies (uses Reply type with full Post)
├── board-reply-card.tsx        → Single reply (avatar + content + like)
├── board-reply-box.tsx         → Inline reply form
└── board-nav-actions.tsx       → Back button + New Post button
```

**`board-post-card.tsx` pattern (mirrors `ThreadCardInfo`):**
```typescript
export function BoardPostCard({ post }: { post: BoardPost }) {
  return (
    <div>
      <AvatarProfileLink author={post.author} />  {/* Works because author is full Account */}
      <Link href={`/commons/${post.board.feedAddress}/post/${post.rootPost.id}`}>
        <h3>{post.title}</h3>
      </Link>
      <span>{post.author.username?.localName}</span>
      <span>{formatDistanceToNow(new Date(post.createdAt))}</span>
      <BoardPostVoting postId={post.rootPost.id} />  {/* Works because rootPost is full Post */}
      <span>{post.repliesCount} replies</span>
      <span>{post.viewsCount} views</span>
    </div>
  );
}
```

**`board-reply-card.tsx` pattern (mirrors `ThreadReplyCard`):**
```typescript
export function BoardReplyCard({ reply }: { reply: Reply }) {
  // reply.post is the full Lens Post — has .author (Account with avatar), .stats, .operations
  return (
    <div>
      <AvatarProfileLink author={reply.post.author} />  {/* Works! Full Account available */}
      <ContentRenderer content={getReplyContent(reply.post)} />
      <LikeButton postid={reply.post.id} />  {/* Works! Has post ID for reactions */}
    </div>
  );
}
```

**`board-post-voting.tsx` (new, combines ThreadVotesDisplay UI + useVoting interactivity):**
```typescript
export function BoardPostVoting({ postId }: { postId: string }) {
  const { scoreState, isLoading, handleUpvote, handleDownvote, hasUserUpvoted, hasUserDownvoted } =
    useVoting({ postid: postId });
  const { isLoggedIn } = useAuthStore();

  return (
    <div className="flex items-center gap-1">
      <button onClick={handleUpvote} disabled={!isLoggedIn || isLoading === "up"}>
        <ArrowUp className={hasUserUpvoted ? "text-primary" : ""} />
      </button>
      <span>{isLoading ? <Spinner /> : scoreState}</span>
      <button onClick={handleDownvote} disabled={!isLoggedIn || isLoading === "down"}>
        <ArrowDown className={hasUserDownvoted ? "text-red-600" : ""} />
      </button>
    </div>
  );
}
```

### Layer 6: Routes (`app/commons/`)

Keep the same URL structure. The routes just use the new components:

```
app/commons/[address]/page.tsx           → Uses BoardPage component
app/commons/[address]/new-post/page.tsx  → Uses BoardPostCreateForm
app/commons/[address]/post/[postId]/page.tsx → Uses BoardPostDetail
app/commons/[address]/post/[postId]/reply/page.tsx → Uses CreateReplyForm (reused from communities)
```

### Layer 7: Supabase (Minimal Changes)

Keep the existing tables. They're fine. The only change is philosophical:

**Before (current):** Supabase tries to be source of truth for post counts and reply counts.
**After (ideal):** Supabase is a metadata cache. Lens is source of truth for content and stats. Supabase only tracks what Lens can't:
- `feeds.views_count` — local view tracking
- `feeds.last_post_at` — for homepage "Last Post" column
- `feed_posts.views_count` — per-post view tracking
- `feed_posts` existence — confirms a post was created through our app (vs external)

The `post_count` and `replies_count` on the `feeds` table can stay for the homepage display (they're updated by triggers), but individual post `repliesCount` should come from `lensPost.stats.comments`.

---

## 3. What Gets Deleted

All existing Board-specific code that diverges from the Community pattern:

```
DELETE: lib/services/feed/get-feed-replies.ts     → Has its own Reply type. Replace with reuse of get-thread-replies.ts
DELETE: lib/services/feed/create-feed-reply-client.ts → Duplicate of create-reply.ts
DELETE: lib/domain/feeds/types.ts                  → Replace with lib/domain/boards/types.ts
DELETE: lib/adapters/feed-adapter.ts               → Replace with lib/adapters/board-adapter.ts
DELETE: hooks/feeds/use-feed-post-create-form.ts   → Replace with hooks/boards/use-board-post-create-form.ts
DELETE: hooks/feeds/use-feed-reply-create.ts       → Reuse hooks/replies/use-reply-create.ts
DELETE: components/commons/feed-posts-list.tsx      → Replace with components/boards/board-post-list.tsx
DELETE: components/commons/post-detail.tsx          → Replace with components/boards/board-post-detail.tsx
DELETE: components/commons/reply-list.tsx           → Replace with components/boards/board-reply-list.tsx
DELETE: components/commons/reply-form.tsx           → Reuse community reply pattern
DELETE: components/commons/create-reply-form.tsx    → Reuse community reply pattern
DELETE: components/commons/create-post-form.tsx     → Replace with components/boards/board-post-create-form.tsx
```

**Keep:**
```
KEEP: lib/services/feed/get-feeds.ts              → Homepage feed sections (rename to get-boards.ts)
KEEP: lib/services/feed/get-feed-posts.ts         → Refactor into get-board-posts.ts
KEEP: lib/services/feed/get-feed-post.ts          → Refactor into get-board-post.ts
KEEP: lib/services/feed/create-feed-post.ts       → Refactor into create-board-post.ts
KEEP: lib/external/supabase/feeds.ts              → Supabase queries (unchanged)
KEEP: lib/external/supabase/feed-posts.ts         → Supabase queries (unchanged)
KEEP: components/commons/feed-nav-actions.tsx      → Refactor into board-nav-actions.tsx
KEEP: components/commons/paginated-feed-posts-list.tsx → Refactor into board-post-list.tsx
```

---

## 4. What Gets Reused From Communities (Shared Code)

These files are used by BOTH Boards and Communities. No duplication:

| File | Used By |
|---|---|
| `lib/external/lens/primitives/articles.ts` | Both (createThreadArticle) |
| `lib/external/lens/primitives/posts.ts` | Both (fetchPostsByFeed, fetchCommentsByPostId) |
| `lib/domain/replies/types.ts` | Both (Reply type) |
| `lib/domain/threads/content.ts` | Both (getThreadTitleAndSummary, stripThreadArticleFormatting) |
| `lib/adapters/reply-adapter.ts` | Both (adaptPostToReply) |
| `lib/services/reply/create-reply.ts` | Both (createReply) |
| `hooks/replies/use-reply-create.ts` | Both (useReplyCreate) |
| `hooks/common/use-voting.ts` | Both (useVoting) |
| `components/ui/like-button.tsx` | Both (LikeButton) |
| `components/notifications/avatar-profile-link.tsx` | Both (AvatarProfileLink) |
| `components/shared/content-renderer.tsx` | Both (ContentRenderer) |
| `stores/auth-store.ts` | Both (useAuthStore) |

---

## 5. Implementation Plan (Ordered Steps)

### Phase 1: Create Domain Layer (30 min)
1. Create `lib/domain/boards/types.ts` with `Board`, `BoardPost`, `CreateBoardPostFormData`
2. No `BoardReply` type — reuse `Reply` from `lib/domain/replies/types.ts`

### Phase 2: Create Adapter Layer (30 min)
1. Create `lib/adapters/board-adapter.ts` with `adaptFeedToBoard` and `adaptLensPostToBoardPost`
2. Both adapters preserve full Lens objects (Post, Account)

### Phase 3: Create/Refactor Service Layer (2-3 hours)
1. Create `lib/services/board/get-board.ts` — fetch single board from Supabase + adapt
2. Create `lib/services/board/get-boards.ts` — fetch all boards for homepage (refactor from `get-feeds.ts`)
3. Create `lib/services/board/get-board-posts.ts` — fetch posts from Lens + merge with Supabase (refactor from `get-feed-posts.ts`)
4. Create `lib/services/board/get-board-post.ts` — fetch single post (refactor from `get-feed-post.ts`)
5. Create `lib/services/board/create-board-post.ts` — create post on Lens + persist to Supabase (refactor from `create-feed-post.ts`)
6. Verify `lib/services/reply/create-reply.ts` works for board posts (it should — same Lens API)
7. Generalize `lib/services/reply/get-thread-replies.ts` to work for any post ID (rename if needed, or just use it as-is since it takes a Thread but only uses `thread.rootPost.id`)

### Phase 4: Create/Refactor Hook Layer (1-2 hours)
1. Create `hooks/boards/use-board-post-create-form.ts` — form state + validation + submit (pattern from `useThreadCreateForm`)
2. Create `hooks/boards/use-board-posts-paginated.ts` — paginated fetching (pattern from `useThreadsPaginated`)
3. Verify `hooks/replies/use-reply-create.ts` works for board replies (it should)

### Phase 5: Create Component Layer (3-4 hours)
1. Create `components/boards/board-post-card.tsx` — post card with avatar, title, stats, voting
2. Create `components/boards/board-post-voting.tsx` — interactive up/down arrows using `useVoting`
3. Create `components/boards/board-post-list.tsx` — list of post cards with pagination
4. Create `components/boards/board-post-detail.tsx` — full post view with content + reply section
5. Create `components/boards/board-reply-card.tsx` — reply card using `Reply` type (full Post → avatar works)
6. Create `components/boards/board-reply-list.tsx` — list of reply cards
7. Create `components/boards/board-reply-box.tsx` — inline reply form using `useReplyCreate`
8. Create `components/boards/board-post-create-form.tsx` — post creation form using `useBoardPostCreateForm`
9. Create `components/boards/board-nav-actions.tsx` — back button + new post button

### Phase 6: Update Routes (1 hour)
1. Update `app/commons/[address]/page.tsx` to use new Board components
2. Update `app/commons/[address]/new-post/page.tsx` to use new form
3. Update `app/commons/[address]/post/[postId]/page.tsx` to use new detail view
4. Update `app/commons/[address]/post/[postId]/reply/page.tsx` to use `useReplyCreate` (shared)

### Phase 7: Delete Old Code (30 min)
1. Delete all files listed in Section 3 "What Gets Deleted"
2. Verify no imports break
3. Run build to confirm

### Phase 8: Test (1-2 hours)
1. Create a post in a board → verify it appears on Lens (Hey, Soclly)
2. Reply to a post → verify reply appears with avatar
3. Upvote/downvote → verify score updates
4. Check homepage → verify post counts display
5. Check notifications → verify board activity shows up

**Total: ~10-12 hours of focused work (1.5-2 days)**

---

## 6. Why This Eliminates the Bugs

| Bug | Root Cause | How This Architecture Prevents It |
|---|---|---|
| No avatars on replies | Feed Reply type loses Account data | Reply type keeps full Lens Post → Account always available |
| Post count wrong | Supabase counter drifts from Lens | `repliesCount` reads from `lensPost.stats.comments` |
| No voting on posts | LikeButton (heart) instead of arrows | New `BoardPostVoting` component with arrows + `useVoting` |
| Reply list doesn't refresh | `useFeedReplyCreate` doesn't invalidate cache | Reuses `useReplyCreate` which invalidates query cache |
| Notifications missing | Separate Reply type can't link to board posts | Same Reply type → same notification handling |
| Duplicate code | Two parallel systems | One shared primitives layer, one shared Reply type |

---

## 7. Architecture Comparison

```
BEFORE (Current — Two Divergent Systems):

Communities:                          Boards:
  Domain: Thread, Reply(Post)           Domain: FeedPost, Reply(flat)  ← DIFFERENT
  Adapter: adaptFeedToThread            Adapter: adaptLensPostToFeedPost ← DIFFERENT
  Service: createThread                 Service: createFeedPost ← DUPLICATE
  Service: getThreadReplies             Service: getFeedReplies ← DUPLICATE + LOSSY
  Hook: useReplyCreate                  Hook: useFeedReplyCreate ← DUPLICATE
  Component: ThreadReplyCard            Component: ReplyList ← DIFFERENT + NO AVATAR


AFTER (Ideal — Shared Foundation):

Communities:                          Boards:
  Domain: Thread, Reply(Post)           Domain: BoardPost, Reply(Post)  ← SAME Reply type
  Adapter: adaptFeedToThread            Adapter: adaptLensPostToBoardPost ← DIFFERENT but same pattern
  Service: createThread                 Service: createBoardPost ← DIFFERENT but same Lens call
  Service: getThreadReplies ←──────────── SHARED (same service)
  Hook: useReplyCreate ←──────────────── SHARED (same hook)
  Component: ThreadReplyCard            Component: BoardReplyCard ← DIFFERENT UI, same data shape
```

The key insight: **the reply system is identical**. A Lens Comment doesn't care if its parent is a Community thread or a Board post. By sharing the Reply type, the reply adapter, the reply service, and the reply hook, we eliminate half the duplication and all the data-loss bugs.
