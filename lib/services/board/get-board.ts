"use server";

import { ForumBoard } from "@/lib/domain/forum/types";
import { fetchForumBoardBySlug, ForumBoardRow } from "@/lib/external/supabase/forum-boards";

export interface GetBoardResult {
  success: boolean;
  board?: ForumBoard;
  error?: string;
}

function rowToBoard(row: ForumBoardRow): ForumBoard {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    section: row.section,
    feedType: row.feed_type,
    displayOrder: row.display_order,
    isLocked: row.is_locked,
    threadCount: row.thread_count,
    replyCount: row.reply_count,
    viewsCount: row.views_count,
    lastActivityAt: row.last_activity_at,
    color: row.color,
  };
}

export async function getBoard(slug: string): Promise<GetBoardResult> {
  try {
    const row = await fetchForumBoardBySlug(slug);
    if (!row) return { success: false, error: "Board not found" };
    return { success: true, board: rowToBoard(row) };
  } catch (error) {
    console.error("Failed to fetch board:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch board" };
  }
}
