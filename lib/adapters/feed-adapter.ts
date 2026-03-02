import { getThreadTitleAndSummary } from "@/lib/domain/threads/content";
import { FeedPost } from "@/lib/domain/feeds/types";
import { Address } from "@/types/common";
import { Account, Post } from "@lens-protocol/client";
import { updateFeedPostStats } from "@/lib/external/supabase/feed-posts";

interface FeedPostSupabase {
  id: string;
  feed_id: string;
  lens_post_id: string;
  author: string;
  title: string | null;
  content: string | null;
  replies_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export const adaptLensPostToFeedPost = async (
  feedId: string,
  feedAddress: Address,
  rootPost: Post,
  dbPost?: FeedPostSupabase,
): Promise<FeedPost> => {
  const { title, summary } = getThreadTitleAndSummary(rootPost);
  const lensRepliesCount = rootPost.stats.comments || 0;

  // Sync stats from Lens to database if they differ
  if (dbPost && dbPost.replies_count !== lensRepliesCount) {
    try {
      await updateFeedPostStats(rootPost.id, lensRepliesCount, dbPost.views_count);
    } catch (error) {
      console.error("Failed to sync post stats:", error);
    }
  }

  return {
    id: dbPost?.id || rootPost.id,
    feedId,
    feedAddress,
    rootPost,
    author: rootPost.author,
    repliesCount: lensRepliesCount,
    viewsCount: dbPost?.views_count || 0,
    isVisible: true,
    created_at: dbPost?.created_at || (rootPost.timestamp ? new Date(rootPost.timestamp).toISOString() : new Date().toISOString()),
    title,
    summary,
    updatedAt: dbPost?.updated_at || (rootPost.timestamp ? new Date(rootPost.timestamp).toISOString() : new Date().toISOString()),
    app: rootPost.app?.metadata?.name || "Society Protocol",
  };
};
