"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { PublishStatus } from "@/lib/domain/forum/types";

export async function revalidateBoardPath(boardSlug: string): Promise<void> {
  try {
    revalidatePath(`/boards/${boardSlug}`);
  } catch {}
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface ForumThreadRow {
  id: string;
  lens_post_id: string | null;
  content_uri: string | null;
  board_slug: string | null;
  feed_type: string;
  title: string;
  summary: string | null;
  content_markdown: string | null;
  content_json: any | null;
  author_address: string;
  author_username: string | null;
  reply_count: number;
  views_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_hidden: boolean;
  publish_status: PublishStatus;
  tags: string[] | null;
  slug: string | null;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function persistForumThread(params: {
  boardSlug: string;
  feedType: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  contentJson: any;
  authorAddress: string;
  authorUsername: string | null;
  tags: string[] | null;
  slug: string;
}): Promise<ForumThreadRow> {
  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      board_slug: params.boardSlug,
      feed_type: params.feedType,
      title: params.title,
      summary: params.summary,
      content_markdown: params.contentMarkdown,
      content_json: params.contentJson,
      author_address: params.authorAddress,
      author_username: params.authorUsername,
      tags: params.tags,
      slug: params.slug,
      publish_status: "pending" as PublishStatus,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to persist forum thread: ${error.message}`);
  return data;
}

export async function updateForumThreadLensData(
  threadId: string,
  lensPostId: string,
  contentUri: string,
): Promise<void> {
  const { error } = await supabase
    .from("forum_threads")
    .update({ lens_post_id: lensPostId, content_uri: contentUri, publish_status: "confirmed" as PublishStatus })
    .eq("id", threadId);

  if (error) throw new Error(`Failed to update forum thread lens data: ${error.message}`);
}

export async function updateForumThreadStatus(threadId: string, status: PublishStatus): Promise<void> {
  const { error } = await supabase
    .from("forum_threads")
    .update({ publish_status: status })
    .eq("id", threadId);

  if (error) throw new Error(`Failed to update forum thread status: ${error.message}`);
}

export async function fetchForumThreadsByBoard(
  boardSlug: string,
  limit = 20,
  offset = 0,
): Promise<ForumThreadRow[]> {
  const { data, error } = await supabase
    .from("forum_threads")
    .select("*")
    .eq("board_slug", boardSlug)
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("last_reply_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching forum threads:", error);
    return [];
  }
  return data;
}

export async function fetchForumThreadBySlug(slug: string): Promise<ForumThreadRow | null> {
  const { data, error } = await supabase
    .from("forum_threads")
    .select("*")
    .eq("slug", slug)
    .eq("is_hidden", false)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching forum thread:", error);
    return null;
  }
  return data;
}

export async function fetchForumThreadById(id: string): Promise<ForumThreadRow | null> {
  const { data, error } = await supabase
    .from("forum_threads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching forum thread:", error);
    return null;
  }
  return data;
}

export async function updateForumThreadUsername(threadId: string, username: string): Promise<void> {
  const { error } = await supabase
    .from("forum_threads")
    .update({ author_username: username })
    .eq("id", threadId);

  if (error) console.error("Failed to update thread username:", error);
}
