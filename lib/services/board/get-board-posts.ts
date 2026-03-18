"use server";

import { adaptLensPostToBoardPost } from "@/lib/adapters/board-adapter";
import { Board, BoardPost, BoardParticipant } from "@/lib/domain/boards/types";
import { fetchPostsByFeed, fetchCommentsByPostId } from "@/lib/external/lens/primitives/posts";
import { fetchFeedPostByLensId } from "@/lib/external/supabase/feed-posts";
import { Post, postId as toPostId } from "@lens-protocol/client";

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
    const lensResult = await fetchPostsByFeed(board.feedAddress, undefined, {
      sort: "desc",
      limit: options?.limit || 10,
      cursor: options?.cursor,
    });

    const lensPosts = lensResult.posts;

    if (!lensPosts || lensPosts.length === 0) {
      return { success: true, posts: [], nextCursor: null, prevCursor: null };
    }

    // Batch fetch DB records for view counts
    const dbPosts = await Promise.all(
      lensPosts.map((post) => fetchFeedPostByLensId(post.id)),
    );

    // Filter out replies — only show root posts in the board list
    const rootPostsData = lensPosts
      .map((lensPost, idx) => ({ lensPost, dbPost: dbPosts[idx] }))
      .filter(({ dbPost }) => !dbPost?.parent_post_id);

    const posts = rootPostsData.map(({ lensPost, dbPost }) =>
      adaptLensPostToBoardPost(board, lensPost as Post, dbPost || undefined),
    );

    // Enrich posts with participants and lastActivityAt
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        try {
          const comments = await fetchCommentsByPostId(toPostId(post.lensPostId));
          const filtered = (comments || []).filter((c) => c.id !== post.lensPostId && c.commentOn !== null);

          // Deduplicate reply authors (exclude OP)
          const seen = new Set<string>([post.author.address]);
          const participants: BoardParticipant[] = [];
          for (const c of filtered) {
            const addr = c.author.address;
            if (!seen.has(addr) && participants.length < 4) {
              seen.add(addr);
              participants.push({
                address: addr,
                username: c.author.username?.localName,
                avatar: c.author.metadata?.picture || undefined,
              });
            }
          }

          const lastComment = filtered.length > 0
            ? filtered.reduce((latest, c) => (c.timestamp > latest.timestamp ? c : latest))
            : null;

          return {
            ...post,
            participants,
            lastActivityAt: lastComment?.timestamp || post.createdAt,
          };
        } catch {
          return { ...post, participants: [], lastActivityAt: post.createdAt };
        }
      }),
    );

    return {
      success: true,
      posts: enrichedPosts,
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
