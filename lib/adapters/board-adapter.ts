import { Board, BoardPost } from "@/lib/domain/boards/types";
import { getThreadTitleAndSummary } from "@/lib/domain/threads/content";
import { Address } from "@/types/common";
import { Post } from "@lens-protocol/client";

/**
 * Converts a Supabase `feeds` row into a Board domain object.
 */
export function adaptFeedToBoard(dbFeed: {
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
}): Board {
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
  dbPost?: {
    id: string;
    views_count: number;
    parent_post_id: string | null;
    created_at: string;
    updated_at: string;
  },
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
