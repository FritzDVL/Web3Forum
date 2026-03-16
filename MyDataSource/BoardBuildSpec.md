# Board System Build Spec — Step-by-Step Implementation Guide

**Date:** March 16, 2026
**Branch:** `feature/board-system-rebuild` (create before starting)
**Prerequisite:** Read `MyDataSource/NewBoard.md` for architectural context

This document is a spec-driven build guide. Each phase lists every file to create, with exact code, exact imports, and exact types. Follow it top to bottom. Commit after each phase.

---

## PHASE 1: Domain Layer

**Goal:** Define the Board data types. One new file. No `BoardReply` — reuse `Reply` from communities.

**Commit message:** `feat(boards): add domain types for Board and BoardPost`

### File 1.1: `lib/domain/boards/types.ts` (CREATE)

```typescript
import { Address } from "@/types/common";
import { Account, Post } from "@lens-protocol/client";

/**
 * A Board is a Lens Feed used as a fixed topic container.
 * Mapped from the `feeds` Supabase table.
 */
export interface Board {
  id: string;
  name: string;
  description: string;
  feedAddress: Address;
  category: string;
  displayOrder: number;
  isLocked: boolean;
  postCount: number;
  repliesCount: number;
  viewsCount: number;
  lastPostAt: string | null;
}

/**
 * A BoardPost is a root-level Lens Post published to a Board's Feed.
 * The full Lens Post and Account are preserved — never destructured.
 */
export interface BoardPost {
  id: string;
  lensPostId: string;
  board: Board;
  rootPost: Post;
  author: Account;
  title: string;
  summary: string;
  repliesCount: number;
  viewsCount: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  app?: string;
}

/**
 * Form data for creating a new board post.
 */
export interface CreateBoardPostFormData {
  title: string;
  summary: string;
  content: string;
  tags?: string;
  author: Address;
}
```

**Why no `BoardReply`?** Board replies are Lens Comments — identical to Community replies. Reuse:
- Type: `Reply` from `lib/domain/replies/types.ts` → `{ id, thread, post: Post }`
- The `post: Post` field preserves the full Lens Post, which means `reply.post.author` gives us the full `Account` (avatar, metadata, stats, operations). This is the key architectural fix.

---

## PHASE 2: Adapter Layer

**Goal:** Two adapter functions that convert raw data into domain types. Never lose Lens data.

**Commit message:** `feat(boards): add adapter layer for Board and BoardPost`

### File 2.1: `lib/adapters/board-adapter.ts` (CREATE)

```typescript
import { Board, BoardPost } from "@/lib/domain/boards/types";
import { getThreadTitleAndSummary } from "@/lib/domain/threads/content";
import { Address } from "@/types/common";
import { Post } from "@lens-protocol/client";

/**
 * Raw Supabase feed record shape.
 * Matches the `feeds` table columns exactly.
 */
interface FeedSupabase {
  id: string;
  lens_feed_address: string;
  title: string;
  description: string | null;
  category: string;
  display_order: number;
  is_locked: boolean | null;
  featured: boolean | null;
  post_count: number | null;
  replies_count: number | null;
  views_count: number | null;
  last_post_at: string | null;
}

/**
 * Raw Supabase feed_posts record shape.
 * Matches the `feed_posts` table columns exactly.
 */
interface FeedPostSupabase {
  id: string;
  feed_id: string;
  lens_post_id: string;
  author: string;
  title: string | null;
  content: string | null;
  replies_count: number;
  views_count: number;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Converts a Supabase `feeds` row into a Board domain object.
 */
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

/**
 * Converts a Lens Post + optional Supabase record into a BoardPost domain object.
 *
 * CRITICAL: rootPost and author are preserved as full Lens objects.
 * - rootPost.stats.comments is the source of truth for reply count (not Supabase).
 * - Supabase only provides views_count (local tracking Lens can't do).
 */
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
    rootPost: lensPost,
    author: lensPost.author,
    title,
    summary,
    repliesCount: lensPost.stats.comments || 0,
    viewsCount: dbPost?.views_count || 0,
    isVisible: true,
    createdAt: dbPost?.created_at || lensPost.timestamp || new Date().toISOString(),
    updatedAt: dbPost?.updated_at || lensPost.timestamp || new Date().toISOString(),
    app: lensPost.app?.metadata?.name || "Society Protocol",
  };
}
```

**Key difference from old `feed-adapter.ts`:**
- Old adapter was `async` because it called `updateFeedPostStats` (syncing Supabase). New adapter is pure — no side effects, no async. Stats syncing is not the adapter's job.
- Old adapter took `feedId` and `feedAddress` as separate strings. New adapter takes a `Board` object — cleaner, typed.
- Reply adapter: **not needed**. Reuse `adaptPostToReply` from `lib/adapters/reply-adapter.ts` (already exists, already works).

---

## PHASE 3: Service Layer

**Goal:** 5 new service files + verify 2 existing services work for boards. This is the biggest phase.

**Commit message:** `feat(boards): add service layer for board operations`

### File 3.1: `lib/services/board/get-board.ts` (CREATE)

Fetches a single board by its Lens Feed address. Used by route pages.

```typescript
"use server";

import { adaptFeedToBoard } from "@/lib/adapters/board-adapter";
import { Board } from "@/lib/domain/boards/types";
import { fetchFeedByAddress } from "@/lib/external/supabase/feeds";

export interface GetBoardResult {
  success: boolean;
  board?: Board;
  error?: string;
}

export async function getBoard(feedAddress: string): Promise<GetBoardResult> {
  try {
    const dbFeed = await fetchFeedByAddress(feedAddress);

    if (!dbFeed) {
      return { success: false, error: "Board not found" };
    }

    return { success: true, board: adaptFeedToBoard(dbFeed) };
  } catch (error) {
    console.error("Failed to fetch board:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch board",
    };
  }
}
```

**What it replaces:** The inline `fetchFeedByAddress` calls scattered across route pages. Now there's one service that returns a typed `Board`.

### File 3.2: `lib/services/board/get-boards.ts` (CREATE)

Fetches all boards grouped by category for the homepage. Replaces `get-feeds.ts`.

```typescript
"use server";

import { adaptFeedToBoard } from "@/lib/adapters/board-adapter";
import { Board } from "@/lib/domain/boards/types";
import { fetchAllFeeds } from "@/lib/external/supabase/feeds";

export interface BoardSection {
  sectionTitle: string;
  category: string;
  boards: Board[];
  borderColor: string;
  layout: "list" | "grid";
  isLocked: boolean;
}

const CATEGORY_CONFIG: Record<string, { title: string; layout: "list" | "grid"; borderColor: string }> = {
  general: { title: "GENERAL DISCUSSION", layout: "list", borderColor: "blue" },
  partners: { title: "PARTNER COMMUNITIES", layout: "list", borderColor: "green" },
  functions: { title: "FUNCTIONS (VALUE SYSTEM)", layout: "grid", borderColor: "blue" },
  technical: { title: "SOCIETY PROTOCOL TECHNICAL SECTION", layout: "list", borderColor: "blue" },
  others: { title: "OTHERS", layout: "list", borderColor: "blue" },
};

export async function getBoardSections(): Promise<BoardSection[]> {
  const allFeeds = await fetchAllFeeds();
  const categories = ["general", "partners", "functions", "technical", "others"];

  const sections: BoardSection[] = categories.map((category) => {
    const categoryFeeds = allFeeds.filter((feed) => feed.category === category);
    const config = CATEGORY_CONFIG[category];

    return {
      sectionTitle: config.title,
      category,
      boards: categoryFeeds.map(adaptFeedToBoard),
      borderColor: config.borderColor,
      layout: config.layout,
      isLocked: category === "technical",
    };
  });

  return sections.filter((section) => section.boards.length > 0);
}
```

**What it replaces:** `lib/services/feed/get-feeds.ts` (`getFeedSections`).
**Key improvement:** Uses `adaptFeedToBoard` instead of inline mapping. Returns `Board[]` instead of anonymous objects.

**Homepage integration note:** `app/page.tsx` currently imports `getFeedSections`. After Phase 6, it will import `getBoardSections`. The homepage components (`ForumCategory`, `FunctionGrid`) will need their props updated from `feeds` to `boards`. The shape is similar but typed — `Board` has `feedAddress` instead of `address`, `name` instead of `title`. We'll handle this in Phase 6.

### File 3.3: `lib/services/board/get-board-posts.ts` (CREATE)

Fetches paginated posts for a board. Replaces `get-feed-posts.ts`.

```typescript
"use server";

import { adaptLensPostToBoardPost } from "@/lib/adapters/board-adapter";
import { Board, BoardPost } from "@/lib/domain/boards/types";
import { fetchPostsByFeed } from "@/lib/external/lens/primitives/posts";
import { fetchFeedPostByLensId } from "@/lib/external/supabase/feed-posts";
import { Post } from "@lens-protocol/client";

export interface GetBoardPostsResult {
  success: boolean;
  posts?: BoardPost[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  error?: string;
}

export async function getBoardPosts(
  board: Board,
  options?: { limit?: number; cursor?: string },
): Promise<GetBoardPostsResult> {
  try {
    // 1. Fetch posts from Lens Protocol feed
    const lensResult = await fetchPostsByFeed(board.feedAddress, undefined, {
      sort: "desc",
      limit: options?.limit || 10,
      cursor: options?.cursor,
    });

    const lensPosts = lensResult.posts;

    if (!lensPosts || lensPosts.length === 0) {
      return { success: true, posts: [], nextCursor: null, prevCursor: null };
    }

    // 2. Batch fetch DB records for view counts
    const dbPosts = await Promise.all(
      lensPosts.map((post) => fetchFeedPostByLensId(post.id)),
    );

    // 3. Filter out replies — only show root posts in the board list
    const rootPostsData = lensPosts
      .map((lensPost, idx) => ({ lensPost, dbPost: dbPosts[idx] }))
      .filter(({ dbPost }) => !dbPost?.parent_post_id);

    // 4. Adapt to BoardPost objects
    const posts = rootPostsData.map(({ lensPost, dbPost }) =>
      adaptLensPostToBoardPost(board, lensPost as Post, dbPost || undefined),
    );

    return {
      success: true,
      posts,
      nextCursor: lensResult.pageInfo?.next ?? null,
      prevCursor: lensResult.pageInfo?.prev ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch board posts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch board posts",
    };
  }
}
```

**What it replaces:** `lib/services/feed/get-feed-posts.ts`.
**Key improvement:** Takes a `Board` object instead of separate `feedId`/`feedAddress` strings. Returns `BoardPost[]` with full Lens `Post` and `Account` preserved.

### File 3.4: `lib/services/board/get-board-post.ts` (CREATE)

Fetches a single post by Lens post ID. Used by the post detail page.

```typescript
"use server";

import { adaptLensPostToBoardPost } from "@/lib/adapters/board-adapter";
import { Board, BoardPost } from "@/lib/domain/boards/types";
import { fetchPostWithClient } from "@/lib/external/lens/primitives/posts";
import { fetchFeedPostByLensId } from "@/lib/external/supabase/feed-posts";
import { client } from "@/lib/external/lens/protocol-client";
import { Post } from "@lens-protocol/client";

export interface GetBoardPostResult {
  success: boolean;
  post?: BoardPost;
  error?: string;
}

export async function getBoardPost(
  board: Board,
  postId: string,
): Promise<GetBoardPostResult> {
  try {
    const lensPost = await fetchPostWithClient(postId, client);

    if (!lensPost || lensPost.__typename !== "Post") {
      return { success: false, error: "Post not found" };
    }

    const dbPost = await fetchFeedPostByLensId(postId);

    return {
      success: true,
      post: adaptLensPostToBoardPost(board, lensPost as Post, dbPost || undefined),
    };
  } catch (error) {
    console.error("Failed to fetch board post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch post",
    };
  }
}
```

**What it replaces:** `lib/services/feed/get-feed-post.ts`.

### File 3.5: `lib/services/board/create-board-post.ts` (CREATE)

Creates a new post in a board. Publishes to Lens, then persists metadata to Supabase.

```typescript
"use server";

import { Board } from "@/lib/domain/boards/types";
import { createThreadArticle } from "@/lib/external/lens/primitives/articles";
import { fetchAccountFromLens } from "@/lib/external/lens/primitives/accounts";
import { persistFeedPost } from "@/lib/external/supabase/feed-posts";
import { Address } from "@/types/common";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";
import { revalidatePath } from "next/cache";

export interface CreateBoardPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function createBoardPost(
  board: Board,
  formData: {
    title: string;
    content: string;
    summary: string;
    tags?: string;
    author: Address;
  },
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateBoardPostResult> {
  try {
    // 1. Create article on Lens (same primitive as Communities)
    const articleResult = await createThreadArticle(
      {
        title: formData.title,
        content: formData.content,
        author: formData.author,
        summary: formData.summary,
        tags: formData.tags,
        feedAddress: board.feedAddress,
        slug: `${Date.now()}-${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      },
      sessionClient,
      walletClient,
    );

    if (!articleResult.success || !articleResult.post) {
      return { success: false, error: articleResult.error || "Failed to create post" };
    }

    // 2. Persist metadata to Supabase
    const authorAccount = await fetchAccountFromLens(formData.author);
    const authorDb = authorAccount?.username?.localName || formData.author;

    await persistFeedPost(
      board.id,
      articleResult.post.id,
      authorDb,
      formData.title,
      formData.content,
    );

    // 3. Revalidate paths
    revalidatePath(`/commons/${board.feedAddress}`);
    revalidatePath("/");

    return { success: true, postId: articleResult.post.id };
  } catch (error) {
    console.error("Failed to create board post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    };
  }
}
```

**What it replaces:** `lib/services/feed/create-feed-post.ts` + `app/commons/[address]/new-post/actions.ts` (saveFeedPost).
**Key improvement:** Single service handles both Lens creation and DB persistence. No split between client-side Lens call and server action DB save.

### Existing Services — Verification Notes

**`lib/services/reply/create-reply.ts` — WORKS AS-IS for boards.**
- It accepts `parentId` (any Lens Post ID), `content`, `threadAddress` (any Lens Feed address), and `threadId`.
- For board posts, pass: `parentId` = board post's Lens ID, `threadAddress` = board's feed address, `threadId` = board post's Lens ID (not a Supabase UUID, so the UUID check on line ~60 will skip the `incrementThreadRepliesCount` call — correct behavior since board reply counts come from Lens stats).
- No changes needed.

**`lib/services/reply/get-thread-replies.ts` — NEEDS MINOR GENERALIZATION.**
- Currently takes a `Thread` object and uses `thread.rootPost.id` to fetch comments.
- For boards, we need to pass a `BoardPost` instead.
- **Solution:** Create a thin wrapper or change the function signature to accept `{ rootPostId: string }` instead of `Thread`. But to minimize changes to the working Community system, create a new wrapper:

### File 3.6: `lib/services/board/get-board-post-replies.ts` (CREATE)

```typescript
"use server";

import { adaptPostToReply } from "@/lib/adapters/reply-adapter";
import { Reply } from "@/lib/domain/replies/types";
import { BoardPost } from "@/lib/domain/boards/types";
import { fetchCommentsByPostId } from "@/lib/external/lens/primitives/posts";
import { SessionClient } from "@lens-protocol/client";

export interface GetBoardPostRepliesResult {
  success: boolean;
  replies?: Reply[];
  error?: string;
}

export async function getBoardPostReplies(
  boardPost: BoardPost,
  sessionClient?: SessionClient,
): Promise<GetBoardPostRepliesResult> {
  try {
    const posts = await fetchCommentsByPostId(boardPost.rootPost.id, sessionClient);

    if (!posts || posts.length === 0) {
      return { success: true, replies: [] };
    }

    // Filter out the root post itself and non-comments, then adapt
    const replies: Reply[] = posts
      .filter((p) => p.id !== boardPost.rootPost.id && p.commentOn !== null)
      .map(adaptPostToReply);

    return { success: true, replies };
  } catch (error) {
    console.error("Failed to fetch board post replies:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch replies",
    };
  }
}
```

**What it replaces:** `lib/services/feed/get-feed-replies.ts` — the file that defined its own flat `Reply` type and lost all the Lens data.
**Key fix:** Uses `adaptPostToReply` (from communities) which preserves the full `Post` object. This is THE fix for the avatar bug.

---

## PHASE 4: Hook Layer

**Goal:** 1 new hook for post creation. Reply hook is reused from communities.

**Commit message:** `feat(boards): add hooks for board post creation`

### File 4.1: `hooks/boards/use-board-post-create-form.ts` (CREATE)

Pattern copied from `hooks/feeds/use-feed-post-create-form.ts` but simplified: calls the new `createBoardPost` service directly instead of splitting between client-side Lens call and server action.

```typescript
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTagsInput } from "@/hooks/forms/use-tags-input";
import { Board, CreateBoardPostFormData } from "@/lib/domain/boards/types";
import { createBoardPost } from "@/lib/services/board/create-board-post";
import { useAuthStore } from "@/stores/auth-store";
import { Address } from "@/types/common";
import { useSessionClient } from "@lens-protocol/react";
import { toast } from "sonner";
import { useWalletClient } from "wagmi";

interface FormErrors {
  title?: string;
  content?: string;
}

interface TouchedFields {
  title: boolean;
  content: boolean;
}

export function useBoardPostCreateForm({ board }: { board: Board }) {
  const [formData, setFormData] = useState<CreateBoardPostFormData>({
    title: "",
    summary: "",
    content: "",
    tags: "",
    author: "" as Address,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({ title: false, content: false });

  const { tags, setTags, tagInput, setTagInput, addTag, removeTag, handleTagInputKeyDown } = useTagsInput();
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) return "Title is required";
    return undefined;
  };

  const validateContent = (value: string): string | undefined => {
    if (!value.trim()) return "Content is required";
    return undefined;
  };

  const validateField = (field: keyof FormErrors, value: string) => {
    const error = field === "title" ? validateTitle(value) : validateContent(value);
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const isFormValid = (): boolean => {
    return !validateTitle(formData.title) && !validateContent(formData.content);
  };

  const handleChange = (field: keyof CreateBoardPostFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field as keyof TouchedFields] && errors[field as keyof FormErrors]) {
      validateField(field as keyof FormErrors, value);
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ title: true, content: true });
    const titleError = validateTitle(formData.title);
    const contentError = validateContent(formData.content);
    setErrors({ title: titleError, content: contentError });

    if (titleError || contentError) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    if (!account?.address) {
      toast.error("Authentication Error", { description: "Please log in again." });
      return;
    }
    if (!sessionClient.data || sessionClient.loading) {
      toast.error("Authentication Required", { description: "Please sign in to create a post." });
      return;
    }
    if (!walletClient.data) {
      toast.error("Wallet Connection Required", { description: "Please connect your wallet." });
      return;
    }

    const loadingToast = toast.loading("Creating post...");

    try {
      setIsCreating(true);

      const result = await createBoardPost(
        board,
        {
          title: formData.title,
          content: formData.content,
          summary: formData.summary,
          tags: tags.length > 0 ? tags.join(",") : undefined,
          author: account.address,
        },
        sessionClient.data,
        walletClient.data,
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to create post");
      }

      toast.success("Post created!", { id: loadingToast });
      setFormData({ title: "", summary: "", content: "", tags: "", author: account.address });
      setTags([]);
      setTagInput("");
      setErrors({});
      setTouched({ title: false, content: false });
      router.push(`/commons/${board.feedAddress}`);
    } catch (error) {
      toast.error("Failed to create post", {
        description: error instanceof Error ? error.message : "An error occurred",
        id: loadingToast,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    formData,
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    handleChange,
    handleBlur,
    handleSubmit,
    isCreating,
    errors,
    touched,
    isFormValid: isFormValid(),
  };
}
```

**What it replaces:** `hooks/feeds/use-feed-post-create-form.ts`.
**Key improvement:** Calls `createBoardPost` service directly (single call) instead of the old pattern that did `createThreadArticle` on client → then `saveFeedPost` server action separately. One service, one call, one error path.

### Existing Hooks — Verification Notes

**`hooks/replies/use-reply-create.ts` — WORKS AS-IS for boards.**
- It calls `createReply(to, content, feedAddress, threadId)`.
- For board posts: `to` = parent post ID, `feedAddress` = board's feed address, `threadId` = board post's Lens ID.
- It invalidates `queryKey: ["thread-replies", threadId]`. For boards, we'll use the same query key pattern with the board post ID. This means the reply list auto-refreshes after posting. ✅
- No changes needed.

---

## PHASE 5: Component Layer

**Goal:** 9 new components. This is the UI layer. Every component receives typed domain objects as props.

**Commit message:** `feat(boards): add board UI components`

### File 5.1: `components/boards/board-nav-actions.tsx` (CREATE)

Back button + New Post button. Replaces `components/commons/feed-nav-actions.tsx`.

```typescript
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface BoardNavActionsProps {
  feedAddress: string;
  isLocked?: boolean;
}

export function BoardNavActions({ feedAddress, isLocked = false }: BoardNavActionsProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <Link href="/">
        <Button variant="outline" size="sm">
          ← Back to Home
        </Button>
      </Link>
      <Link href={`/commons/${feedAddress}/new-post`}>
        <Button
          size="sm"
          className="gap-2"
          disabled={isLocked}
          title={isLocked ? "Requires Society Protocol Pass" : "Create new post"}
        >
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </Link>
    </div>
  );
}
```

### File 5.2: `components/boards/board-post-voting.tsx` (CREATE)

Up/down vote arrows for board posts. Reuses the existing `ReplyVoting` component since it already does exactly what we need (arrows + useVoting). But if we want a horizontal layout for post cards vs vertical for replies, create a thin wrapper:

```typescript
"use client";

import { ReplyVoting } from "@/components/reply/reply-voting";
import { PostId, postId } from "@lens-protocol/client";

interface BoardPostVotingProps {
  lensPostId: string;
}

export function BoardPostVoting({ lensPostId }: BoardPostVotingProps) {
  return <ReplyVoting postid={postId(lensPostId) as PostId} />;
}
```

**Why reuse `ReplyVoting`?** It already uses `useVoting` with arrows, loading states, and auth checks. No need to duplicate. The name `ReplyVoting` is misleading (it works for any post), but renaming is out of scope.

### File 5.3: `components/boards/board-post-card.tsx` (CREATE)

A single post card in the board list. Shows avatar, title, author, time, stats, voting.

```typescript
"use client";

import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { BoardPostVoting } from "./board-post-voting";
import { BoardPost } from "@/lib/domain/boards/types";
import { LikeButton } from "@/components/ui/like-button";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye } from "lucide-react";
import Link from "next/link";
import { PostId } from "@lens-protocol/client";

interface BoardPostCardProps {
  post: BoardPost;
}

export function BoardPostCard({ post }: BoardPostCardProps) {
  const authorName = post.author.username?.localName || post.author.address.slice(0, 8);
  const authorHandle = post.author.username?.value || `@${post.author.address.slice(0, 6)}`;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <div className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Voting column */}
      <div className="flex flex-col items-center pt-1">
        <BoardPostVoting lensPostId={post.rootPost.id} />
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <AvatarProfileLink author={post.author} />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
              <Link href={`/commons/${post.board.feedAddress}/post/${post.rootPost.id}`}>
                {post.title}
              </Link>
            </h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Link
                href={`/u/${authorName}`}
                className="font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300"
              >
                {authorName}
              </Link>
              <span>{authorHandle}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {post.summary && (
          <p className="mt-2 line-clamp-2 text-gray-600 dark:text-gray-400">{post.summary}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{post.repliesCount} replies</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.viewsCount} views</span>
            </div>
          </div>
          <LikeButton postid={post.rootPost.id as PostId} />
        </div>
      </div>
    </div>
  );
}
```

**Key difference from old `paginated-feed-posts-list.tsx`:**
- Has `AvatarProfileLink` — works because `post.author` is a full `Account`
- Has `BoardPostVoting` — up/down arrows instead of just a heart
- Cleaner layout with voting column on the left (Bitcointalk/Reddit style)

### File 5.4: `components/boards/board-post-list.tsx` (CREATE)

Paginated list of post cards. Replaces `paginated-feed-posts-list.tsx`.

```typescript
"use client";

import { useState } from "react";
import { BoardPost } from "@/lib/domain/boards/types";
import { BoardPostCard } from "./board-post-card";

interface BoardPostListProps {
  boardId: string;
  feedAddress: string;
  initialPosts: BoardPost[];
  initialNextCursor: string | null;
}

export function BoardPostList({
  boardId,
  feedAddress,
  initialPosts,
  initialNextCursor,
}: BoardPostListProps) {
  const [posts, setPosts] = useState<BoardPost[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    try {
      const { loadMoreBoardPosts } = await import("@/app/commons/[address]/actions");
      const result = await loadMoreBoardPosts(boardId, feedAddress, nextCursor);
      if (result.success && result.posts) {
        setPosts([...posts, ...result.posts]);
        setNextCursor(result.nextCursor || null);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          No posts yet. Be the first to create a post!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <BoardPostCard key={post.id} post={post} />
      ))}

      {nextCursor && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
```

**Note:** This imports `loadMoreBoardPosts` from the route actions file. We'll create that in Phase 6.

### File 5.5: `components/boards/board-reply-card.tsx` (CREATE)

A single reply card. Uses the shared `Reply` type (with full `Post`). This is where the avatar bug gets fixed.

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { ReplyVoting } from "@/components/reply/reply-voting";
import { Reply } from "@/lib/domain/replies/types";
import { getReplyContent } from "@/lib/domain/replies/content";
import { useReplyCreate } from "@/hooks/replies/use-reply-create";
import { getRepliesByParentId } from "@/lib/services/reply/get-replies-by-parent-id";
import { getTimeAgo } from "@/lib/shared/utils";
import { postId, useSessionClient } from "@lens-protocol/react";
import { MessageCircle } from "lucide-react";

interface BoardReplyCardProps {
  reply: Reply;
  boardFeedAddress: string;
  rootPostId: string;
}

export function BoardReplyCard({ reply, boardFeedAddress, rootPostId }: BoardReplyCardProps) {
  const { content, image, video } = getReplyContent(reply.post);

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(reply.post.stats.comments);

  useEffect(() => {
    setLocalReplyCount(reply.post.stats.comments);
  }, [reply.post.stats.comments]);

  const { createReply } = useReplyCreate();
  const sessionClient = useSessionClient();

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await createReply(reply.id, replyContent, boardFeedAddress, rootPostId);
    setReplyContent("");
    setShowReplyBox(false);
    setLocalReplyCount((c) => c + 1);
  };

  const handleLoadReplies = async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const result = await getRepliesByParentId(reply.post.id, sessionClient.data ?? undefined);
      if (result.success) {
        setReplies(result.replies ?? []);
      }
      setShowReplies(true);
    } catch (error) {
      console.error("Failed to load replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const canReply = reply.post.operations?.canComment.__typename === "PostOperationValidationPassed";

  return (
    <div className="space-y-2" id={reply.id}>
      <div className="rounded-lg bg-white p-3 shadow-sm dark:border-gray-700/60 dark:bg-gray-800 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Voting */}
          <div className="flex flex-col items-center">
            <ReplyVoting postid={postId(reply.id)} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Author row */}
            <div className="mb-3 flex items-center justify-between">
              <Link
                href={`/u/${reply.post.author.username?.value}`}
                className="flex items-center gap-2 hover:text-gray-900"
              >
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                  <AvatarImage src={reply.post.author.metadata?.picture} />
                  <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                    {reply.post.author.metadata?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {reply.post.author.metadata?.name || reply.post.author.username?.localName}
                </span>
              </Link>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {getTimeAgo(new Date(reply.post.timestamp))}
              </span>
            </div>

            {/* Content */}
            <ContentRenderer content={{ content, image, video }} className="rich-text-content mb-2" />

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {localReplyCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadReplies}
                    disabled={loadingReplies}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="mr-1 h-3 w-3" />
                    {loadingReplies ? "Loading..." : `${localReplyCount} ${localReplyCount === 1 ? "reply" : "replies"}`}
                  </Button>
                )}
              </div>
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyBox(true)}
                  className="h-auto p-1 text-xs"
                >
                  <MessageCircle className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}
            </div>

            {/* Inline reply box */}
            {showReplyBox && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full rounded-md border p-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                    Post
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowReplyBox(false); setReplyContent(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {showReplies && replies.length > 0 && (
              <div className="ml-6 mt-2 space-y-2">
                {replies.map((nestedReply) => (
                  <BoardReplyCard
                    key={nestedReply.id}
                    reply={nestedReply}
                    boardFeedAddress={boardFeedAddress}
                    rootPostId={rootPostId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Key difference from old `reply-list.tsx`:**
- `reply.post.author.metadata?.picture` → AVATAR WORKS because `Reply.post` is the full Lens `Post`
- `reply.post.stats.comments` → nested reply count works
- `reply.post.operations?.canComment` → permission check works
- Uses `useReplyCreate` (shared) → cache invalidation works
- Supports nested replies (recursive `BoardReplyCard`)

### File 5.6: `components/boards/board-reply-list.tsx` (CREATE)

List of reply cards. Simple wrapper.

```typescript
"use client";

import { Reply } from "@/lib/domain/replies/types";
import { BoardReplyCard } from "./board-reply-card";

interface BoardReplyListProps {
  replies: Reply[];
  boardFeedAddress: string;
  rootPostId: string;
}

export function BoardReplyList({ replies, boardFeedAddress, rootPostId }: BoardReplyListProps) {
  if (replies.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No replies yet. Be the first to reply!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <BoardReplyCard
          key={reply.id}
          reply={reply}
          boardFeedAddress={boardFeedAddress}
          rootPostId={rootPostId}
        />
      ))}
    </div>
  );
}
```

### File 5.7: `components/boards/board-reply-box.tsx` (CREATE)

Inline reply form shown at the bottom of the post detail page. Uses the shared `useReplyCreate` hook.

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextEditor } from "@/components/editor/text-editor";
import { useReplyCreate } from "@/hooks/replies/use-reply-create";
import { useAuthStore } from "@/stores/auth-store";
import { Address } from "@/types/common";
import { MessageCircle } from "lucide-react";

interface BoardReplyBoxProps {
  postId: string;
  feedAddress: Address;
}

export function BoardReplyBox({ postId, feedAddress }: BoardReplyBoxProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const { isLoggedIn, account } = useAuthStore();
  const { createReply } = useReplyCreate();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const reply = await createReply(postId, content, feedAddress, postId);
      if (reply) {
        setContent("");
        setEditorKey((prev) => prev + 1);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">Please sign in to reply.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 items-start space-x-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={account?.metadata?.picture} />
        <AvatarFallback className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {account?.username?.localName?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-3">
        <TextEditor key={editorKey} onChange={setContent} />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            className="gradient-button h-8 text-sm"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? "Replying..." : (
              <>
                <MessageCircle className="mr-2 h-3 w-3" />
                Reply
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**What it replaces:** `components/commons/reply-form.tsx`.
**Key improvement:** Uses `useReplyCreate` (shared hook with cache invalidation) instead of directly calling `createFeedReply` service.

### File 5.8: `components/boards/board-post-detail.tsx` (CREATE)

Full post view with content, stats, and reply section. Replaces `components/commons/post-detail.tsx`.

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye, ArrowLeft, MessageCircle } from "lucide-react";
import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { BoardPostVoting } from "./board-post-voting";
import { BoardReplyList } from "./board-reply-list";
import { BoardReplyBox } from "./board-reply-box";
import { LikeButton } from "@/components/ui/like-button";
import { Button } from "@/components/ui/button";
import { BoardPost } from "@/lib/domain/boards/types";
import { Reply } from "@/lib/domain/replies/types";
import { stripThreadArticleFormatting } from "@/lib/domain/threads/content";
import { Address } from "@/types/common";
import { PostId } from "@lens-protocol/client";

interface BoardPostDetailProps {
  post: BoardPost;
  replies: Reply[];
}

export function BoardPostDetail({ post, replies }: BoardPostDetailProps) {
  const [viewsCount, setViewsCount] = useState(post.viewsCount);
  const authorName = post.author.username?.localName || post.author.address.slice(0, 8);
  const authorHandle = post.author.username?.value || `@${post.author.address.slice(0, 6)}`;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const rawContent = post.rootPost.metadata?.content || post.summary || "No content available";
  const content = stripThreadArticleFormatting(rawContent);

  // Track view on mount
  useEffect(() => {
    async function trackView() {
      try {
        const response = await fetch(`/api/posts/${post.rootPost.id}/view`, { method: "POST" });
        if (response.ok) setViewsCount((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    }
    trackView();
  }, [post.rootPost.id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <Link
        href={`/commons/${post.board.feedAddress}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to board
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Post Header */}
        <div className="border-b border-slate-200 p-6 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <BoardPostVoting lensPostId={post.rootPost.id} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">{post.title}</h1>
              <div className="mt-4 flex items-center gap-3">
                <AvatarProfileLink author={post.author} />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{authorName}</span>
                  <span className="ml-2 text-sm text-gray-500">{authorHandle}</span>
                </div>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{timeAgo}</span>
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.repliesCount} replies</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{viewsCount} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="p-6">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0 whitespace-pre-wrap">{children}</p>,
                br: () => <br />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Reply Section */}
        <div className="p-6">
          <hr className="mb-6 border-slate-200 dark:border-gray-700" />

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
              {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
            </h2>
            <LikeButton postid={post.rootPost.id as PostId} />
          </div>

          {/* Inline reply box */}
          <div className="mb-6">
            <BoardReplyBox postId={post.rootPost.id} feedAddress={post.board.feedAddress as Address} />
          </div>

          {/* Reply List */}
          <BoardReplyList
            replies={replies}
            boardFeedAddress={post.board.feedAddress}
            rootPostId={post.rootPost.id}
          />
        </div>
      </div>
    </div>
  );
}
```

**Key differences from old `post-detail.tsx`:**
- Has `AvatarProfileLink` with full `Account` — avatar works ✅
- Has `BoardPostVoting` — up/down arrows ✅
- Has `BoardReplyBox` inline — reply without navigating to separate page ✅
- Reply list uses `Reply` type with full `Post` — reply avatars work ✅
- No longer needs `feedId` or `feedAddress` as separate props — gets them from `post.board`

### File 5.9: `components/boards/board-post-create-form.tsx` (CREATE)

Post creation form. Replaces `components/commons/create-post-form.tsx`.

```typescript
"use client";

import { TextEditor } from "@/components/editor/text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagsInput } from "@/components/ui/tags-input";
import { useBoardPostCreateForm } from "@/hooks/boards/use-board-post-create-form";
import { Board } from "@/lib/domain/boards/types";
import { Send } from "lucide-react";

interface BoardPostCreateFormProps {
  board: Board;
}

export function BoardPostCreateForm({ board }: BoardPostCreateFormProps) {
  const {
    formData,
    tags,
    tagInput,
    setTagInput,
    addTag,
    removeTag,
    handleTagInputKeyDown,
    handleChange,
    handleBlur,
    handleSubmit,
    isCreating,
    errors,
    touched,
    isFormValid,
  } = useBoardPostCreateForm({ board });

  return (
    <Card className="rounded-3xl border border-brand-200/60 bg-white backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800">
      <CardHeader className="pb-4">
        <h1 className="text-2xl font-medium text-foreground">Create New Post</h1>
        <p className="text-muted-foreground">Posting to: {board.name}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              onBlur={() => handleBlur("title")}
              placeholder="What's your post about?"
              className={touched.title && errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {touched.title && errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary" className="text-sm font-medium text-foreground">Summary</Label>
            <Input
              id="summary"
              value={formData.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              placeholder="Brief description (max 100 chars)"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Content <span className="text-red-500">*</span>
            </Label>
            <div
              className={`rounded-2xl border backdrop-blur-sm dark:bg-gray-800 ${
                touched.content && errors.content
                  ? "border-red-500 bg-red-50/50"
                  : "border-brand-200/40 bg-white/50"
              }`}
              onBlur={() => handleBlur("content")}
            >
              <TextEditor onChange={(value) => handleChange("content", value)} />
            </div>
            {touched.content && errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Tags (optional) {tags.length > 0 && <span className="text-slate-500">({tags.length}/5)</span>}
            </Label>
            <TagsInput
              tags={tags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              addTag={addTag}
              removeTag={removeTag}
              handleTagInputKeyDown={handleTagInputKeyDown}
              maxTags={5}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isCreating || !isFormValid} className="gap-2">
              <Send className="h-4 w-4" />
              {isCreating ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**What it replaces:** `components/commons/create-post-form.tsx`.
**Key improvement:** Takes a `Board` object instead of separate `feedId`/`feedAddress`/`feedTitle` strings. Uses `useBoardPostCreateForm` which calls the unified `createBoardPost` service.

---

## PHASE 6: Update Routes

**Goal:** Update the 4 route pages + 1 actions file + homepage to use the new Board system.

**Commit message:** `feat(boards): update routes to use new board components`

### File 6.1: `app/commons/[address]/actions.ts` (REPLACE)

```typescript
"use server";

import { getBoard } from "@/lib/services/board/get-board";
import { getBoardPosts } from "@/lib/services/board/get-board-posts";
import { Address } from "@/types/common";

export async function loadMoreBoardPosts(
  boardId: string,
  feedAddress: Address,
  cursor: string,
  limit: number = 10,
) {
  const boardResult = await getBoard(feedAddress);
  if (!boardResult.success || !boardResult.board) {
    return { success: false, error: "Board not found" };
  }
  return await getBoardPosts(boardResult.board, { limit, cursor });
}
```

### File 6.2: `app/commons/[address]/page.tsx` (REPLACE)

```typescript
import { getBoard } from "@/lib/services/board/get-board";
import { getBoardPosts } from "@/lib/services/board/get-board-posts";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardNavActions } from "@/components/boards/board-nav-actions";
import { BoardPostList } from "@/components/boards/board-post-list";
import { Lock } from "lucide-react";

export default async function BoardPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  const boardResult = await getBoard(address);

  if (!boardResult.success || !boardResult.board) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="info" title="Board not found" message="The requested board does not exist." />
        </div>
      </div>
    );
  }

  const board = boardResult.board;
  const postsResult = await getBoardPosts(board, { limit: 10 });
  const posts = postsResult.success ? (postsResult.posts || []) : [];
  const nextCursor = postsResult.success ? (postsResult.nextCursor ?? null) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <BoardNavActions feedAddress={address} isLocked={board.isLocked} />

      {/* Board Header */}
      <div className="mb-8 rounded-lg border border-slate-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-4">
          {board.isLocked && <Lock className="h-6 w-6 flex-shrink-0 text-yellow-500" />}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">{board.name}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{board.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                {board.category}
              </span>
              <span>{posts.length}+ posts</span>
            </div>
          </div>
        </div>
        {board.isLocked && (
          <div className="mt-6 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              🔒 This board requires a Society Protocol Pass to post. Read access is public.
            </p>
          </div>
        )}
      </div>

      <BoardPostList
        boardId={board.id}
        feedAddress={address}
        initialPosts={posts}
        initialNextCursor={nextCursor}
      />
    </div>
  );
}
```

### File 6.3: `app/commons/[address]/new-post/page.tsx` (REPLACE)

```typescript
import { getBoard } from "@/lib/services/board/get-board";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardPostCreateForm } from "@/components/boards/board-post-create-form";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function NewPostPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;

  const boardResult = await getBoard(address);

  if (!boardResult.success || !boardResult.board) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="info" title="Board not found" message="The requested board does not exist." />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href={`/commons/${address}`}>
            <Button variant="outline" size="sm">← Back to {boardResult.board.name}</Button>
          </Link>
        </div>
        <BoardPostCreateForm board={boardResult.board} />
      </div>
    </ProtectedRoute>
  );
}
```

### File 6.4: `app/commons/[address]/post/[postId]/page.tsx` (REPLACE)

```typescript
import { getBoard } from "@/lib/services/board/get-board";
import { getBoardPost } from "@/lib/services/board/get-board-post";
import { getBoardPostReplies } from "@/lib/services/board/get-board-post-replies";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardPostDetail } from "@/components/boards/board-post-detail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ address: string; postId: string }>;
}) {
  const { address, postId } = await params;

  const boardResult = await getBoard(address);

  if (!boardResult.success || !boardResult.board) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="info" title="Board not found" message="The requested board does not exist." />
        </div>
      </div>
    );
  }

  const [postResult, repliesResult] = await Promise.all([
    getBoardPost(boardResult.board, postId),
    getBoardPostReplies({ rootPost: { id: postId } } as any),
  ]);

  if (!postResult.success || !postResult.post) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="error" title="Post not found" message={postResult.error || "The requested post does not exist."} />
        </div>
      </div>
    );
  }

  const replies = repliesResult.success ? (repliesResult.replies || []) : [];

  return <BoardPostDetail post={postResult.post} replies={replies} />;
}
```

**Note on `getBoardPostReplies` call:** We pass a minimal object `{ rootPost: { id: postId } }` cast as `any` because `getBoardPostReplies` only uses `boardPost.rootPost.id`. This avoids needing to wait for the full `getBoardPost` result before starting the replies fetch (parallel execution). If this feels too hacky, you can instead change `getBoardPostReplies` to accept just a `postId: string` parameter — that's actually cleaner. Here's the alternative signature:

**Alternative for `get-board-post-replies.ts` (cleaner):**
Change the function signature to:
```typescript
export async function getBoardPostReplies(
  rootPostId: string,
  sessionClient?: SessionClient,
): Promise<GetBoardPostRepliesResult> {
```
And use `rootPostId` directly instead of `boardPost.rootPost.id`. Then the route call becomes:
```typescript
getBoardPostReplies(postId)
```

### File 6.5: `app/commons/[address]/post/[postId]/reply/page.tsx` (REPLACE)

This page is for the dedicated reply form (navigating to a separate page to write a reply). With the new inline `BoardReplyBox` on the post detail page, this route is less critical but we keep it for direct links.

```typescript
import { getBoard } from "@/lib/services/board/get-board";
import { getBoardPost } from "@/lib/services/board/get-board-post";
import { StatusBanner } from "@/components/shared/status-banner";
import { BoardReplyBox } from "@/components/boards/board-reply-box";
import { ProtectedRoute } from "@/components/pages/protected-route";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Address } from "@/types/common";

export default async function NewReplyPage({
  params,
}: {
  params: Promise<{ address: string; postId: string }>;
}) {
  const { address, postId } = await params;

  const boardResult = await getBoard(address);

  if (!boardResult.success || !boardResult.board) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="info" title="Board not found" message="The requested board does not exist." />
        </div>
      </div>
    );
  }

  const postResult = await getBoardPost(boardResult.board, postId);

  if (!postResult.success || !postResult.post) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner type="error" title="Post not found" message={postResult.error || "The requested post does not exist."} />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href={`/commons/${address}/post/${postId}`}>
            <Button variant="outline" size="sm">← Back to post</Button>
          </Link>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 text-sm text-gray-500">
            Replying to <span className="font-medium text-slate-900 dark:text-gray-100">{postResult.post.title}</span>
          </div>
          <BoardReplyBox postId={postId} feedAddress={address as Address} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

### File 6.6: `app/commons/[address]/new-post/actions.ts` (DELETE)

This file contained `saveFeedPost` which was the server action for persisting to Supabase after client-side Lens creation. The new `createBoardPost` service handles both in one call. Delete this file.

### File 6.7: `app/page.tsx` (UPDATE)

Update the homepage to use `getBoardSections` instead of `getFeedSections`.

**Change:**
```typescript
// OLD
import { getFeedSections } from "@/lib/services/feed/get-feeds";
// ...
const [feedSections, ...] = await Promise.all([getFeedSections(), ...]);
// ...
{feedSections.map((section) => (

// NEW
import { getBoardSections } from "@/lib/services/board/get-boards";
// ...
const [boardSections, ...] = await Promise.all([getBoardSections(), ...]);
// ...
{boardSections.map((section) => (
```

**Homepage component props update:** The `ForumCategory` and `FunctionGrid` components currently receive `feeds` prop with shape `{ address, title, ... }`. After this change, they receive `boards` prop with shape `Board` (`{ feedAddress, name, ... }`).

You have two options:
1. **Quick:** Update `getBoardSections` to return the same shape as `getFeedSections` (map `Board` back to the old `{ address, title }` format). This avoids touching homepage components.
2. **Clean:** Update `ForumCategory` and `FunctionGrid` to accept `Board[]` instead.

**Recommended: Option 1 (quick).** Add a compatibility mapping in `getBoardSections`:

In `get-boards.ts`, add after the `boards` mapping:
```typescript
// Compatibility: homepage components expect { address, title, ... } shape
feeds: categoryFeeds.map((feed) => ({
  id: feed.id,
  address: feed.lens_feed_address,
  title: feed.title,
  description: feed.description || "",
  isLocked: feed.is_locked || false,
  featured: feed.featured || false,
  postCount: feed.post_count || 0,
  repliesCount: feed.replies_count || 0,
  viewsCount: feed.views_count || 0,
  lastPostAt: feed.last_post_at || null,
})),
```

Actually, the simplest approach: keep the `BoardSection` type returning `boards: Board[]` but ALSO include a `feeds` field with the old shape for backward compatibility. Or just update the homepage components. Your call — both work.

---

## PHASE 7: Delete Old Code

**Goal:** Remove all replaced files. Verify build passes.

**Commit message:** `refactor(boards): remove old feed/commons code replaced by board system`

### Files to DELETE:

```
# Old components (replaced by components/boards/)
components/commons/create-post-form.tsx
components/commons/create-reply-form.tsx
components/commons/feed-nav-actions.tsx
components/commons/feed-posts-list.tsx
components/commons/paginated-feed-posts-list.tsx
components/commons/post-detail.tsx
components/commons/reply-form.tsx
components/commons/reply-list.tsx

# Old services (replaced by lib/services/board/)
lib/services/feed/create-feed-post.ts
lib/services/feed/create-feed-reply-client.ts
lib/services/feed/get-feed-post.ts
lib/services/feed/get-feed-posts.ts
lib/services/feed/get-feed-replies.ts
lib/services/feed/get-feeds.ts
lib/services/feed/save-feed-reply.ts

# Old domain types (replaced by lib/domain/boards/types.ts)
lib/domain/feeds/types.ts

# Old adapter (replaced by lib/adapters/board-adapter.ts)
lib/adapters/feed-adapter.ts

# Old hooks (replaced by hooks/boards/)
hooks/feeds/use-feed-post-create-form.ts
hooks/feeds/use-feed-reply-create.ts

# Old route action (replaced by new actions.ts)
app/commons/[address]/new-post/actions.ts
```

### Files to KEEP (shared infrastructure):

```
# Supabase data access (used by new board services)
lib/external/supabase/feeds.ts          — fetchFeedByAddress, fetchAllFeeds
lib/external/supabase/feed-posts.ts     — persistFeedPost, fetchFeedPostByLensId, etc.

# Revalidation helpers (used by new components)
app/actions/revalidate-path.ts          — revalidateFeedPostPath, revalidateFeedPath

# Lens primitives (shared by both systems)
lib/external/lens/primitives/posts.ts
lib/external/lens/primitives/articles.ts

# Reply system (shared by both systems)
lib/domain/replies/types.ts
lib/adapters/reply-adapter.ts
lib/services/reply/create-reply.ts
lib/services/reply/get-thread-replies.ts
hooks/replies/use-reply-create.ts
```

### Verification Steps:

1. After deleting, run: `npx tsc --noEmit` — check for import errors
2. Search for any remaining imports of deleted files:
   ```bash
   grep -r "services/feed/" --include="*.ts" --include="*.tsx" app/ components/ hooks/ lib/
   grep -r "domain/feeds/" --include="*.ts" --include="*.tsx" app/ components/ hooks/ lib/
   grep -r "adapters/feed-adapter" --include="*.ts" --include="*.tsx" app/ components/ hooks/ lib/
   grep -r "hooks/feeds/" --include="*.ts" --include="*.tsx" app/ components/ hooks/ lib/
   grep -r "components/commons/" --include="*.ts" --include="*.tsx" app/ components/ hooks/ lib/
   ```
3. If any imports found, update them to point to new board equivalents
4. Run: `npm run build` — full build check

### Empty Directories to Remove:

```bash
rm -rf components/commons/
rm -rf lib/services/feed/
rm -rf lib/domain/feeds/
rm -rf hooks/feeds/
```

---

## PHASE 8: Test

**Goal:** Verify everything works end-to-end.

**Commit message:** `test(boards): verify board system works end-to-end`

### Test 1: Homepage Loads
1. Navigate to `/`
2. Verify all board sections display (General Discussion, Partner Communities, etc.)
3. Verify post counts and reply counts show
4. Verify clicking a board navigates to `/commons/[address]`

### Test 2: Board Page Loads
1. Navigate to `/commons/[any-board-address]`
2. Verify board header shows (name, description, category)
3. Verify post list loads with avatars, titles, stats
4. Verify voting arrows appear on each post card
5. Verify "Load More" button works (if >10 posts)

### Test 3: Post Detail Page
1. Click any post title
2. Verify post content renders (markdown)
3. Verify author avatar shows (AvatarProfileLink)
4. Verify voting arrows work on the post
5. Verify view count increments
6. Verify reply list shows with avatars (THE KEY TEST)
7. Verify each reply has voting arrows
8. Verify "Reply" button appears on each reply

### Test 4: Create Post
1. Navigate to `/commons/[address]/new-post`
2. Fill in title, content, optional summary and tags
3. Submit
4. Verify redirect to board page
5. Verify new post appears in the list
6. Verify post appears on Hey.xyz / Soclly (Lens propagation)

### Test 5: Create Reply (Inline)
1. On a post detail page, use the inline reply box
2. Type content and click Reply
3. Verify reply appears in the list WITHOUT page refresh (cache invalidation)
4. Verify reply has your avatar
5. Verify reply appears on Hey.xyz (Lens propagation)

### Test 6: Create Reply (Dedicated Page)
1. Navigate to `/commons/[address]/post/[postId]/reply`
2. Write reply and submit
3. Verify redirect back to post detail
4. Verify reply appears

### Test 7: Voting
1. Upvote a post → verify arrow turns blue, score increments
2. Upvote a reply → same
3. Verify you can't vote when not logged in (buttons disabled)

### Test 8: Locked Board
1. Navigate to a board in the "technical" category
2. Verify lock icon shows
3. Verify "New Post" button is disabled
4. Verify posts are still readable

### Test 9: Cross-System Verification
1. Verify Communities still work (navigate to `/communities/`)
2. Verify community threads still load with avatars
3. Verify community replies still work
4. This confirms we didn't break the shared reply system

---

## QUICK REFERENCE: File Map

### New Files Created (16 total):
```
lib/domain/boards/types.ts                          Phase 1
lib/adapters/board-adapter.ts                        Phase 2
lib/services/board/get-board.ts                      Phase 3
lib/services/board/get-boards.ts                     Phase 3
lib/services/board/get-board-posts.ts                Phase 3
lib/services/board/get-board-post.ts                 Phase 3
lib/services/board/create-board-post.ts              Phase 3
lib/services/board/get-board-post-replies.ts         Phase 3
hooks/boards/use-board-post-create-form.ts           Phase 4
components/boards/board-nav-actions.tsx               Phase 5
components/boards/board-post-voting.tsx               Phase 5
components/boards/board-post-card.tsx                 Phase 5
components/boards/board-post-list.tsx                 Phase 5
components/boards/board-reply-card.tsx                Phase 5
components/boards/board-reply-list.tsx                Phase 5
components/boards/board-reply-box.tsx                 Phase 5
components/boards/board-post-detail.tsx               Phase 5
components/boards/board-post-create-form.tsx          Phase 5
```

### Files Updated (6 total):
```
app/commons/[address]/actions.ts                     Phase 6
app/commons/[address]/page.tsx                       Phase 6
app/commons/[address]/new-post/page.tsx              Phase 6
app/commons/[address]/post/[postId]/page.tsx         Phase 6
app/commons/[address]/post/[postId]/reply/page.tsx   Phase 6
app/page.tsx                                         Phase 6
```

### Files Deleted (17 total):
```
components/commons/create-post-form.tsx              Phase 7
components/commons/create-reply-form.tsx              Phase 7
components/commons/feed-nav-actions.tsx               Phase 7
components/commons/feed-posts-list.tsx                Phase 7
components/commons/paginated-feed-posts-list.tsx      Phase 7
components/commons/post-detail.tsx                   Phase 7
components/commons/reply-form.tsx                    Phase 7
components/commons/reply-list.tsx                    Phase 7
lib/services/feed/create-feed-post.ts                Phase 7
lib/services/feed/create-feed-reply-client.ts        Phase 7
lib/services/feed/get-feed-post.ts                   Phase 7
lib/services/feed/get-feed-posts.ts                  Phase 7
lib/services/feed/get-feed-replies.ts                Phase 7
lib/services/feed/get-feeds.ts                       Phase 7
lib/services/feed/save-feed-reply.ts                 Phase 7
lib/domain/feeds/types.ts                            Phase 7
lib/adapters/feed-adapter.ts                         Phase 7
hooks/feeds/use-feed-post-create-form.ts             Phase 7
hooks/feeds/use-feed-reply-create.ts                 Phase 7
app/commons/[address]/new-post/actions.ts            Phase 7
```

### Directories to Remove:
```
components/commons/                                  Phase 7
lib/services/feed/                                   Phase 7
lib/domain/feeds/                                    Phase 7
hooks/feeds/                                         Phase 7
```
