"use server";

import { fetchPostsBatch } from "@/lib/external/lens/primitives/posts";
import { supabaseClient } from "@/lib/external/supabase/client";
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
    // 1. Get reply IDs from database
    const supabase = await supabaseClient();
    const { data: dbReplies, error: dbError } = await supabase
      .from("feed_posts")
      .select("lens_post_id, created_at")
      .eq("parent_post_id", postId)
      .order("created_at", { ascending: true });

    if (dbError) {
      console.error("Database error fetching replies:", dbError);
      return { success: false, error: dbError.message };
    }

    if (!dbReplies || dbReplies.length === 0) {
      return { success: true, replies: [] };
    }

    // 2. Fetch actual posts from Lens in batch
    const replyIds = dbReplies.map(r => r.lens_post_id);
    const lensPosts = await fetchPostsBatch(replyIds);

    // 3. Map to Reply objects
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
