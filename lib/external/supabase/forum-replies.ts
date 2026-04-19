"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { PublishStatus } from "@/lib/domain/forum/types";

export async function revalidateBoardAndThreadPaths(boardSlug: string, threadId: string): Promise<void> {
  try {
    revalidatePath(`/boards/${boardSlug}`);
    revalidatePath(`/boards/${boardSlug}/post/${threadId}`);
  } catch {}
}

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface ForumReplyRow {
  id: string;
  thread_id: string;
  lens_post_id: string | null;
  content_uri: string | null;
  position: number;
  content_markdown: string | null;
  content_json: any | null;
  author_address: string;
  author_username: string | null;
  is_hidden: boolean;
  publish_status: PublishStatus;
  created_at: string;
  updated_at: string;
}

export async function persistForumReply(params: {
  threadId: string;
  position: number;
  contentMarkdown: string;
  contentJson: any;
  authorAddress: string;
  authorUsername: string | null;
}): Promise<ForumReplyRow> {
  const { data, error } = await supabase
    .from("forum_replies")
    .insert({
      thread_id: params.threadId,
      position: params.position,
      content_markdown: params.contentMarkdown,
      content_json: params.contentJson,
      author_address: params.authorAddress,
      author_username: params.authorUsername,
      publish_status: "pending" as PublishStatus,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to persist forum reply: ${error.message}`);
  return data;
}

export async function updateForumReplyLensData(
  replyId: string,
  lensPostId: string,
  contentUri: string,
): Promise<void> {
  const { error } = await supabase
    .from("forum_replies")
    .update({ lens_post_id: lensPostId, content_uri: contentUri, publish_status: "confirmed" as PublishStatus })
    .eq("id", replyId);

  if (error) throw new Error(`Failed to update forum reply lens data: ${error.message}`);
}

export async function updateForumReplyStatus(replyId: string, status: PublishStatus): Promise<void> {
  const { error } = await supabase
    .from("forum_replies")
    .update({ publish_status: status })
    .eq("id", replyId);

  if (error) throw new Error(`Failed to update forum reply status: ${error.message}`);
}

export async function fetchForumRepliesByThread(threadId: string): Promise<ForumReplyRow[]> {
  const { data, error } = await supabase
    .from("forum_replies")
    .select("*")
    .eq("thread_id", threadId)
    .eq("is_hidden", false)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching forum replies:", error);
    return [];
  }
  return data;
}

export async function getNextReplyPosition(threadId: string): Promise<number> {
  const { data, error } = await supabase.rpc("next_forum_reply_position", { t_id: threadId });

  if (error) {
    console.error("Error getting next reply position:", error);
    return 1;
  }
  return data ?? 1;
}

export async function fetchForumReplyById(replyId: string): Promise<ForumReplyRow | null> {
  const { data, error } = await supabase
    .from("forum_replies")
    .select("*")
    .eq("id", replyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching forum reply:", error);
    return null;
  }
  return data;
}

export async function incrementForumReplyCount(threadId: string): Promise<void> {
  const { error } = await supabase.rpc("increment_forum_reply_count", { t_id: threadId });
  if (error) console.error("Failed to increment reply count:", error);
}

export async function updateForumReplyUsername(replyId: string, username: string): Promise<void> {
  const { error } = await supabase
    .from("forum_replies")
    .update({ author_username: username })
    .eq("id", replyId);

  if (error) console.error("Failed to update reply username:", error);
}
