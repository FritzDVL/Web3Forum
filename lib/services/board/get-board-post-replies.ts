import { ForumReply } from "@/lib/domain/forum/types";
import { fetchForumRepliesByThread, ForumReplyRow } from "@/lib/external/supabase/forum-replies";

export interface GetBoardPostRepliesResult {
  success: boolean;
  replies?: ForumReply[];
  error?: string;
}

function rowToReply(row: ForumReplyRow): ForumReply {
  return {
    id: row.id,
    threadId: row.thread_id,
    lensPostId: row.lens_post_id,
    contentUri: row.content_uri,
    position: row.position,
    contentMarkdown: row.content_markdown,
    contentJson: row.content_json,
    authorAddress: row.author_address,
    authorUsername: row.author_username,
    isHidden: row.is_hidden,
    publishStatus: row.publish_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBoardPostReplies(threadId: string): Promise<GetBoardPostRepliesResult> {
  try {
    const rows = await fetchForumRepliesByThread(threadId);
    return { success: true, replies: rows.map(rowToReply) };
  } catch (error) {
    console.error("Failed to fetch board post replies:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch replies" };
  }
}
