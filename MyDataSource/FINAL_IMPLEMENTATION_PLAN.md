# Implementation Plan: Fix Reply Formatting (Single Page Conversations)

## Goal
Fix paragraph spacing in replies while keeping single-page conversations.

## Changes Summary
1. Remove `commentOn` from feed replies
2. Track parent relationship in database
3. Use `article()` metadata for proper formatting
4. Keep everything on one page (no fragmentation)

---

## Phase 1: Database Migration

### Step 1.1: Create Migration File
```sql
-- File: supabase/migrations/20260302_add_parent_tracking_to_feed_posts.sql

-- Add parent_post_id column to track reply relationships
ALTER TABLE feed_posts
ADD COLUMN parent_post_id TEXT;

-- Add index for efficient reply fetching
CREATE INDEX idx_feed_posts_parent_post_id ON feed_posts(parent_post_id);

-- Add comment for documentation
COMMENT ON COLUMN feed_posts.parent_post_id IS 'Lens post ID of parent post. NULL for opening posts, NOT NULL for replies';
```

### Step 1.2: Apply Migration
Run in Supabase SQL Editor or via CLI

---

## Phase 2: Backend Changes

### Step 2.1: Update Reply Creation Service
```typescript
// File: lib/services/feed/create-feed-reply.ts

"use server";

import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { client } from "@/lib/external/lens/protocol-client";
import { Address } from "@/types/common";
import { immutable } from "@lens-chain/storage-client";
import { Post, SessionClient, evmAddress, uri } from "@lens-protocol/client";
import { fetchPost, post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { article } from "@lens-protocol/metadata";
import { WalletClient } from "viem";
import { revalidatePath } from "next/cache";
import { supabaseClient } from "@/lib/external/supabase/client";

export interface CreateFeedReplyResult {
  success: boolean;
  reply?: {
    id: string;
    content: string;
    author: string;
    timestamp: string;
  };
  error?: string;
}

export async function createFeedReply(
  feedId: string,
  parentPostId: string,
  content: string,
  feedAddress: Address,
  author: Address,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateFeedReplyResult> {
  try {
    // 1. Create metadata using article (supports markdown and formatting)
    const metadata = article({
      content,
    });

    // 2. Upload metadata to storage
    const acl = immutable(lensChain.id);
    const { uri: replyUri } = await storageClient.uploadAsJson(metadata, { acl });

    // 3. Post to Lens Protocol (NO commentOn - regular post)
    const result = await post(sessionClient, {
      contentUri: uri(replyUri),
      feed: evmAddress(feedAddress),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

    if (result.isErr()) {
      const errorMessage =
        result.error && typeof result.error === "object" && "message" in result.error
          ? (result.error as any).message
          : "Failed to create reply";
      return {
        success: false,
        error: errorMessage,
      };
    }

    const createdPost = result.value as Post;

    // 4. Save to database with parent reference
    const supabase = await supabaseClient();
    await supabase.from("feed_posts").insert({
      feed_id: feedId,
      lens_post_id: createdPost.id,
      author: author,
      title: null,
      content: content,
      parent_post_id: parentPostId,
    });

    // 5. Revalidate paths
    revalidatePath(`/commons/${feedAddress}/post/${parentPostId}`);
    revalidatePath(`/commons/${feedAddress}`);

    return {
      success: true,
      reply: {
        id: createdPost.id,
        content: createdPost.metadata?.content || content,
        author: createdPost.author.address,
        timestamp: createdPost.timestamp || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Reply creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create reply",
    };
  }
}
```

### Step 2.2: Update Feed Posts Fetching (Filter Out Replies)
```typescript
// File: lib/services/feed/get-feed-posts.ts

"use server";

import { adaptLensPostToFeedPost } from "@/lib/adapters/feed-adapter";
import { FeedPost } from "@/lib/domain/feeds/types";
import { fetchPostsByFeed } from "@/lib/external/lens/primitives/posts";
import { fetchFeedPosts, fetchFeedPostByLensId } from "@/lib/external/supabase/feed-posts";
import { Address } from "@/types/common";
import { Post } from "@lens-protocol/client";

export interface GetFeedPostsResult {
  success: boolean;
  posts?: FeedPost[];
  nextCursor?: string | null;
  prevCursor?: string | null;
  error?: string;
}

export async function getFeedPosts(
  feedId: string,
  feedAddress: Address,
  options?: { limit?: number; cursor?: string },
): Promise<GetFeedPostsResult> {
  try {
    // 1. Fetch posts from Lens Protocol feed
    const lensResult = await fetchPostsByFeed(feedAddress, undefined, { 
      sort: "desc", 
      limit: options?.limit || 10,
      cursor: options?.cursor 
    });
    
    const lensPosts = lensResult.posts;

    if (!lensPosts || lensPosts.length === 0) {
      return {
        success: true,
        posts: [],
        nextCursor: null,
        prevCursor: null,
      };
    }

    // 2. Fetch corresponding DB records
    const dbPostsPromises = lensPosts.map(post => fetchFeedPostByLensId(post.id));
    const dbPosts = await Promise.all(dbPostsPromises);

    // 3. Filter out replies - only show opening posts in feed list
    const openingPosts = lensPosts.filter((lensPost, idx) => {
      const dbPost = dbPosts[idx];
      return !dbPost || !dbPost.parent_post_id;
    });

    // 4. Adapt to FeedPost objects
    const feedPostsPromises = openingPosts.map(async (lensPost) => {
      const dbPost = dbPosts.find(db => db?.lens_post_id === lensPost.id);
      return await adaptLensPostToFeedPost(feedId, feedAddress, lensPost as Post, dbPost || undefined);
    });

    const feedPosts = await Promise.all(feedPostsPromises);

    return {
      success: true,
      posts: feedPosts,
      nextCursor: lensResult.pageInfo?.next ?? null,
      prevCursor: lensResult.pageInfo?.prev ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch feed posts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Step 2.3: Update Reply Fetching (From Database + Lens)
```typescript
// File: lib/services/feed/get-feed-replies.ts

"use server";

import { fetchPostsBatch } from "@/lib/external/lens/primitives/posts";
import { supabaseClient } from "@/lib/external/supabase/client";
import { Post } from "@lens-protocol/client";

export interface Reply {
  id: string;
  author: {
    address: string;
    username?: string;
    handle?: string;
  };
  content: string;
  timestamp: string;
  repliesCount: number;
}

export interface GetRepliesResult {
  success: boolean;
  replies?: Reply[];
  error?: string;
}

export async function getFeedReplies(postId: string): Promise<GetRepliesResult> {
  try {
    // 1. Get reply IDs from database
    const supabase = await supabaseClient();
    const { data: dbReplies, error: dbError } = await supabase
      .from("feed_posts")
      .select("lens_post_id, created_at")
      .eq("parent_post_id", postId)
      .order("created_at", { ascending: true });

    if (dbError) {
      console.error("Database error fetching replies:", dbError);
      return { success: false, error: dbError.message };
    }

    if (!dbReplies || dbReplies.length === 0) {
      return { success: true, replies: [] };
    }

    // 2. Fetch actual posts from Lens in batch
    const replyIds = dbReplies.map(r => r.lens_post_id);
    const lensPosts = await fetchPostsBatch(replyIds);

    // 3. Map to Reply objects
    const replies: Reply[] = lensPosts.map((post) => {
      const lensPost = post as Post;
      return {
        id: lensPost.id,
        author: {
          address: lensPost.author.address,
          username: lensPost.author.username?.localName,
          handle: lensPost.author.username?.value,
        },
        content: lensPost.metadata?.content || "",
        timestamp: lensPost.timestamp || new Date().toISOString(),
        repliesCount: lensPost.stats?.comments || 0,
      };
    });

    return {
      success: true,
      replies,
    };
  } catch (error) {
    console.error("Failed to fetch replies:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch replies",
    };
  }
}
```

### Step 2.4: Update Reply Form Hook
```typescript
// File: hooks/feeds/use-feed-reply-form.ts (NEW FILE)

"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { useSessionClient } from "@/hooks/lens/use-session-client";
import { createFeedReply } from "@/lib/services/feed/create-feed-reply";
import { Address } from "@/types/common";

interface UseFeedReplyFormProps {
  feedId: string;
  feedAddress: Address;
  parentPostId: string;
  onSuccess?: () => void;
}

export function useFeedReplyForm({ 
  feedId, 
  feedAddress, 
  parentPostId, 
  onSuccess 
}: UseFeedReplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { sessionClient } = useSessionClient();

  const handleSubmit = async (content: string) => {
    if (!sessionClient || !walletClient || !address) {
      setError("Please connect your wallet and sign in");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createFeedReply(
        feedId,
        parentPostId,
        content,
        feedAddress,
        address,
        sessionClient,
        walletClient
      );

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || "Failed to create reply");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    error,
  };
}
```

---

## Phase 3: UI Updates

### Step 3.1: Update Reply Form Component
```typescript
// File: components/commons/reply-form.tsx

"use client";

import { useState } from "react";
import { Address } from "@/types/common";
import { useFeedReplyForm } from "@/hooks/feeds/use-feed-reply-form";

interface ReplyFormProps {
  feedId: string;
  feedAddress: Address;
  postId: string;
}

export function ReplyForm({ feedId, feedAddress, postId }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const { handleSubmit, isSubmitting, error } = useFeedReplyForm({
    feedId,
    feedAddress,
    parentPostId: postId,
    onSuccess: () => {
      setContent("");
      window.location.reload(); // Refresh to show new reply
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await handleSubmit(content);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Write your reply
        </label>
        <textarea
          id="content"
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your reply... (Shift+Enter for new paragraph)"
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          required
          disabled={isSubmitting}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Supports markdown formatting. Use Shift+Enter for line breaks.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Posting..." : "Post Reply"}
      </button>
    </form>
  );
}
```

### Step 3.2: Update Post Detail Page
```typescript
// File: app/commons/[address]/post/[postId]/page.tsx

import { getFeedPost } from "@/lib/services/feed/get-feed-post";
import { getFeedReplies } from "@/lib/services/feed/get-feed-replies";
import { fetchFeedByAddress } from "@/lib/external/supabase/feeds";
import { StatusBanner } from "@/components/shared/status-banner";
import { PostDetail } from "@/components/commons/post-detail";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ address: string; postId: string }>;
}) {
  const { address, postId } = await params;

  // Fetch feed metadata
  const feed = await fetchFeedByAddress(address);

  if (!feed) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner
            type="info"
            title="Feed not found"
            message="The requested feed does not exist."
          />
        </div>
      </div>
    );
  }

  // Fetch post and replies in parallel
  const [postResult, repliesResult] = await Promise.all([
    getFeedPost(feed.id, address, postId),
    getFeedReplies(postId),
  ]);

  if (!postResult.success || !postResult.post) {
    return (
      <div className="flex min-h-screen items-start justify-center">
        <div className="w-full max-w-md px-4 pt-12">
          <StatusBanner
            type="error"
            title="Post not found"
            message={postResult.error || "The requested post does not exist."}
          />
        </div>
      </div>
    );
  }

  const replies = repliesResult.success ? repliesResult.replies || [] : [];

  return (
    <PostDetail 
      post={postResult.post} 
      feedId={feed.id}
      feedAddress={address} 
      replies={replies} 
    />
  );
}
```

### Step 3.3: Update Post Detail Component (Already Done)
The component is already updated with ReactMarkdown, so replies will automatically have proper formatting.

---

## Phase 4: Testing

### Test 1: Database Migration
```bash
# Apply migration
# Go to Supabase Dashboard → SQL Editor
# Run: supabase/migrations/20260302_add_parent_tracking_to_feed_posts.sql

# Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'feed_posts' AND column_name = 'parent_post_id';

# Should return: parent_post_id | text
```

### Test 2: Create Reply
```
1. Navigate to any feed post
2. Scroll to reply form
3. Write reply with multiple paragraphs:
   "This is paragraph 1.
   
   This is paragraph 2.
   
   This is paragraph 3."
4. Submit
5. Verify reply appears with proper spacing
```

### Test 3: Feed List
```
1. Navigate to feed list (homepage)
2. Verify only opening posts appear
3. Verify replies do NOT appear in feed list
4. Click on a post
5. Verify all replies appear on post detail page
```

### Test 4: Communities Unaffected
```
1. Navigate to any community
2. Create a thread
3. Add a reply
4. Verify everything works as before
5. Verify no errors in console
```

---

## Rollback Plan

If anything goes wrong:

```sql
-- Remove parent_post_id column
ALTER TABLE feed_posts DROP COLUMN parent_post_id;

-- Revert code changes via git
git revert HEAD
```

---

## Summary

### What Changes
- ✅ Replies use `article()` metadata (proper formatting)
- ✅ Replies tracked in database via `parent_post_id`
- ✅ Feed list filters out replies (only opening posts)
- ✅ Reply fetching uses database + Lens batch query

### What Stays the Same
- ✅ Feed list shows only opening posts
- ✅ One page per conversation
- ✅ All replies on same page
- ✅ Communities unchanged
- ✅ Existing posts/replies work

### Benefits
- ✅ Fixes paragraph spacing in replies
- ✅ Better reply tracking
- ✅ Enables future features (stats, search)
- ✅ No fragmentation
- ✅ Low risk

---

## Estimated Time
- Database migration: 5 minutes
- Backend changes: 45 minutes
- UI updates: 30 minutes
- Testing: 20 minutes
**Total: ~1.5 hours**

Ready to proceed?
