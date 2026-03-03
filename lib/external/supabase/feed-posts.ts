"use server";

import { supabaseClient } from "@/lib/external/supabase/client";
import { Address } from "@/types/common";

interface FeedPostSupabase {
  id: string;
  feed_id: string;
  lens_post_id: string;
  author: string;
  title: string | null;
  content: string | null;
  replies_count: number;
  views_count: number;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function persistFeedPost(
  feedId: string,
  lensPostId: string,
  author: Address,
  title: string,
  content: string,
): Promise<FeedPostSupabase> {
  const supabase = await supabaseClient();

  const { data: newPost, error } = await supabase
    .from("feed_posts")
    .insert({
      feed_id: feedId,
      lens_post_id: lensPostId,
      author,
      title,
      content,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create feed post: ${error.message}`);
  }

  return newPost;
}

export async function fetchFeedPosts(
  feedId: string,
  limit?: number,
  offset?: number,
): Promise<FeedPostSupabase[]> {
  const supabase = await supabaseClient();

  let query = supabase
    .from("feed_posts")
    .select("*")
    .eq("feed_id", feedId)
    .order("created_at", { ascending: false });

  if (typeof limit === "number" && typeof offset === "number") {
    query = query.range(offset, offset + limit - 1);
  } else if (typeof limit === "number") {
    query = query.range(0, limit - 1);
  }

  const { data: posts, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch feed posts: ${error.message}`);
  }

  return posts || [];
}

export async function fetchFeedPostByLensId(lensPostId: string): Promise<FeedPostSupabase | null> {
  const supabase = await supabaseClient();

  const { data: post, error } = await supabase
    .from("feed_posts")
    .select("*")
    .eq("lens_post_id", lensPostId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch feed post: ${error.message}`);
  }

  return post;
}

export async function incrementFeedPostRepliesCount(postId: string): Promise<void> {
  const supabase = await supabaseClient();

  const { error } = await supabase.rpc("increment_feed_post_replies_count", { post_uuid: postId });
  
  if (error) {
    throw new Error(`Failed to increment replies count: ${error.message}`);
  }
}

export async function updateFeedPostStats(
  lensPostId: string,
  repliesCount: number,
  viewsCount?: number,
): Promise<void> {
  const supabase = await supabaseClient();

  const updates: any = { replies_count: repliesCount };
  if (viewsCount !== undefined) {
    updates.views_count = viewsCount;
  }

  const { error } = await supabase
    .from("feed_posts")
    .update(updates)
    .eq("lens_post_id", lensPostId);

  if (error) {
    throw new Error(`Failed to update post stats: ${error.message}`);
  }
}
