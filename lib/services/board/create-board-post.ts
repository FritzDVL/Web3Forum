"use server";

import { Board } from "@/lib/domain/boards/types";
import { createThreadArticle } from "@/lib/external/lens/primitives/articles";
import { fetchAccountFromLens } from "@/lib/external/lens/primitives/accounts";
import { persistFeedPost } from "@/lib/external/supabase/feed-posts";
import { Address } from "@/types/common";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";
import { revalidatePath } from "next/cache";

export interface CreateBoardPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function createBoardPost(
  board: Board,
  formData: {
    title: string;
    content: string;
    summary: string;
    tags?: string;
    author: Address;
  },
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateBoardPostResult> {
  try {
    // 1. Create article on Lens (same primitive as Communities)
    const articleResult = await createThreadArticle(
      {
        title: formData.title,
        content: formData.content,
        author: formData.author,
        summary: formData.summary,
        tags: formData.tags,
        feedAddress: board.feedAddress,
        slug: `${Date.now()}-${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      },
      sessionClient,
      walletClient,
    );

    if (!articleResult.success || !articleResult.post) {
      return { success: false, error: articleResult.error || "Failed to create post" };
    }

    // 2. Persist metadata to Supabase
    const authorAccount = await fetchAccountFromLens(formData.author);
    const authorDb = authorAccount?.username?.localName || formData.author;

    await persistFeedPost(
      board.id,
      articleResult.post.id,
      authorDb as Address,
      formData.title,
      formData.content,
    );

    // 3. Revalidate paths
    revalidatePath(`/commons/${board.feedAddress}`);
    revalidatePath("/");

    return { success: true, postId: articleResult.post.id };
  } catch (error) {
    console.error("Failed to create board post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    };
  }
}
