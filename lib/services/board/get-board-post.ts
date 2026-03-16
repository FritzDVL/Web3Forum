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
