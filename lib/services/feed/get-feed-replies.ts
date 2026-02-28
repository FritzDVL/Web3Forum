"use server";

import { fetchCommentsByPostId } from "@/lib/external/lens/primitives/posts";
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
    const lensComments = await fetchCommentsByPostId(postId);

    const replies: Reply[] = lensComments.map((comment) => {
      const post = comment as Post;
      return {
        id: post.id,
        author: {
          address: post.author.address,
          username: post.author.username?.localName,
          handle: post.author.username?.value,
        },
        content: post.metadata?.content || "",
        timestamp: post.timestamp || new Date().toISOString(),
        repliesCount: post.stats?.comments || 0,
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
