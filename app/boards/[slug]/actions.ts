"use server";

import { getBoardPosts } from "@/lib/services/board/get-board-posts";

export async function loadMoreBoardPosts(boardSlug: string, offset: number, limit: number = 20) {
  return await getBoardPosts(boardSlug, { limit, offset });
}
