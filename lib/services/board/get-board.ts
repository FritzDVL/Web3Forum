"use server";

import { adaptFeedToBoard } from "@/lib/adapters/board-adapter";
import { Board } from "@/lib/domain/boards/types";
import { fetchFeedByAddress } from "@/lib/external/supabase/feeds";

export interface GetBoardResult {
  success: boolean;
  board?: Board;
  error?: string;
}

export async function getBoard(feedAddress: string): Promise<GetBoardResult> {
  try {
    const dbFeed = await fetchFeedByAddress(feedAddress);

    if (!dbFeed) {
      return { success: false, error: "Board not found" };
    }

    return { success: true, board: adaptFeedToBoard(dbFeed) };
  } catch (error) {
    console.error("Failed to fetch board:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch board",
    };
  }
}
