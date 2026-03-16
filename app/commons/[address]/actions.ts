"use server";

import { getBoard } from "@/lib/services/board/get-board";
import { getBoardPosts } from "@/lib/services/board/get-board-posts";
import { Address } from "@/types/common";

export async function loadMoreBoardPosts(
  boardId: string,
  feedAddress: Address,
  cursor: string,
  limit: number = 10,
) {
  const boardResult = await getBoard(feedAddress);
  if (!boardResult.success || !boardResult.board) {
    return { success: false, error: "Board not found" };
  }
  return await getBoardPosts(boardResult.board, { limit, cursor });
}
