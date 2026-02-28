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

    // 2. Fetch corresponding DB records (for caching)
    const dbPostsPromises = lensPosts.map(post => fetchFeedPostByLensId(post.id));
    const dbPosts = await Promise.all(dbPostsPromises);

    // 3. Adapt to FeedPost objects
    const feedPostsPromises = lensPosts.map(async (lensPost, idx) => {
      const dbPost = dbPosts[idx];
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
