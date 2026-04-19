import { ForumThread } from "@/lib/domain/forum/types";
import { fetchForumThreadsByBoard, ForumThreadRow } from "@/lib/external/supabase/forum-threads";

export interface GetBoardPostsResult {
  success: boolean;
  posts?: ForumThread[];
  error?: string;
}

function rowToThread(row: ForumThreadRow): ForumThread {
  return {
    id: row.id,
    lensPostId: row.lens_post_id,
    contentUri: row.content_uri,
    boardSlug: row.board_slug,
    feedType: row.feed_type,
    title: row.title,
    summary: row.summary || "",
    contentMarkdown: row.content_markdown,
    contentJson: row.content_json,
    authorAddress: row.author_address,
    authorUsername: row.author_username,
    replyCount: row.reply_count,
    viewsCount: row.views_count,
    isPinned: row.is_pinned,
    isLocked: row.is_locked,
    isHidden: row.is_hidden,
    publishStatus: row.publish_status,
    tags: row.tags,
    slug: row.slug,
    lastReplyAt: row.last_reply_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBoardPosts(
  boardSlug: string,
  options?: { limit?: number; offset?: number },
): Promise<GetBoardPostsResult> {
  try {
    const rows = await fetchForumThreadsByBoard(
      boardSlug,
      options?.limit || 20,
      options?.offset || 0,
    );

    return { success: true, posts: rows.map(rowToThread) };
  } catch (error) {
    console.error("Failed to fetch board posts:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch posts" };
  }
}
