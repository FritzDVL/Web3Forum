"use server";

import { adaptPostToReply } from "@/lib/adapters/reply-adapter";
import { Reply } from "@/lib/domain/replies/types";
import { fetchCommentsByPostId } from "@/lib/external/lens/primitives/posts";
import { SessionClient, postId as toPostId } from "@lens-protocol/client";

export interface GetBoardPostRepliesResult {
  success: boolean;
  replies?: Reply[];
  error?: string;
}

export async function getBoardPostReplies(
  rootPostId: string,
  sessionClient?: SessionClient,
): Promise<GetBoardPostRepliesResult> {
  try {
    const posts = await fetchCommentsByPostId(toPostId(rootPostId), sessionClient);

    if (!posts || posts.length === 0) {
      return { success: true, replies: [] };
    }

    // Filter out the root post itself and non-comments, then adapt
    const replies: Reply[] = posts
      .filter((p) => p.id !== rootPostId && p.commentOn !== null)
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
