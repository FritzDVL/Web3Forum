"use server";

import { fetchPostWithClient } from "@/lib/external/lens/primitives/posts";
import { fetchFeedPostByLensId } from "@/lib/external/supabase/feed-posts";
import { adaptLensPostToFeedPost } from "@/lib/adapters/feed-adapter";
import { FeedPost } from "@/lib/domain/feeds/types";
import { Address } from "@/types/common";
import { client } from "@/lib/external/lens/protocol-client";
import { Post } from "@lens-protocol/client";

export interface GetFeedPostResult {
  success: boolean;
  post?: FeedPost;
  error?: string;
}

export async function getFeedPost(
  feedId: string,
  feedAddress: Address,
  postId: string
): Promise<GetFeedPostResult> {
  try {
    // Fetch post from Lens Protocol
    const lensPost = await fetchPostWithClient(postId, client);
    
    if (!lensPost || lensPost.__typename !== "Post") {
      return {
        success: false,
        error: "Post not found",
      };
    }

    // Fetch DB record for caching
    const dbPost = await fetchFeedPostByLensId(postId);

    // Adapt to FeedPost
    const feedPost = await adaptLensPostToFeedPost(
      feedId,
      feedAddress,
      lensPost as Post,
      dbPost || undefined
    );

    return {
      success: true,
      post: feedPost,
    };
  } catch (error) {
    console.error("Failed to fetch feed post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch post",
    };
  }
}
