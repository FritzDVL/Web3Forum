"use server";

import { adaptLensPostToFeedPost } from "@/lib/adapters/feed-adapter";
import { FeedPost } from "@/lib/domain/feeds/types";
import { fetchFeedPosts } from "@/lib/external/supabase/feed-posts";
import { Address } from "@/types/common";

export interface GetFeedPostsResult {
  success: boolean;
  posts?: FeedPost[];
  error?: string;
}

export async function getFeedPosts(
  feedId: string,
  feedAddress: Address,
  options?: { limit?: number; offset?: number },
): Promise<GetFeedPostsResult> {
  try {
    const dbPosts = await fetchFeedPosts(feedId, options?.limit, options?.offset);

    // For now, return empty array since we don't have Lens posts yet
    // TODO: Fetch actual posts from Lens Protocol and merge with DB data
    
    return {
      success: true,
      posts: [],
    };
  } catch (error) {
    console.error("Failed to fetch feed posts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
