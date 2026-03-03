"use server";

import { revalidatePath } from "next/cache";
import { fetchAccountFromLens } from "@/lib/external/lens/primitives/accounts";
import { persistFeedPost } from "@/lib/external/supabase/feed-posts";
import { Address } from "@/types/common";

export async function saveFeedPost(
  feedId: string,
  feedAddress: Address,
  postId: string,
  title: string,
  content: string,
  summary: string,
  author: Address
) {
  try {
    // Fetch author account
    const authorAccount = await fetchAccountFromLens(author);
    const authorDb = authorAccount?.username?.localName || author;

    // Save to database
    await persistFeedPost(feedId, postId, authorDb, title, content);

    // Revalidate paths
    revalidatePath(`/commons/${feedAddress}`);
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to save feed post to database:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save post",
    };
  }
}
