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
    // Fetch comments directly from Lens Protocol
    const lensPosts = await fetchCommentsByPostId(postId);

    if (!lensPosts || lensPosts.length === 0) {
      return { success: true, replies: [] };
    }

    // Map to Reply objects
    const replies: Reply[] = lensPosts.map((post) => {
      const lensPost = post as Post;
      return {
        id: lensPost.id,
        author: {
          address: lensPost.author.address,
          username: lensPost.author.username?.localName,
          handle: lensPost.author.username?.value,
        },
        content: lensPost.metadata?.content || "",
        timestamp: lensPost.timestamp || new Date().toISOString(),
        repliesCount: lensPost.stats?.comments || 0,
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
