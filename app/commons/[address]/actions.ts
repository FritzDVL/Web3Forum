"use server";

import { getFeedPosts } from "@/lib/services/feed/get-feed-posts";
import { Address } from "@/types/common";

export async function loadMorePosts(
  feedId: string,
  feedAddress: Address,
  cursor: string,
  limit: number = 10
) {
  return await getFeedPosts(feedId, feedAddress, { limit, cursor });
}
