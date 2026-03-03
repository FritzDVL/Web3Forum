"use server";

import { supabaseClient } from "@/lib/external/supabase/client";
import { Address } from "@/types/common";
import { revalidatePath } from "next/cache";

export async function saveFeedReplyToDB(
  feedId: string,
  lensPostId: string,
  author: Address,
  content: string,
  parentPostId: string,
  feedAddress: Address,
): Promise<void> {
  const supabase = await supabaseClient();
  
  const { error } = await supabase.from("feed_posts").insert({
    feed_id: feedId,
    lens_post_id: lensPostId,
    author: author,
    title: null,
    content: content,
    parent_post_id: parentPostId,
  });

  if (error) {
    console.error("[saveFeedReplyToDB] Database save failed:", error);
    throw new Error(`Failed to save reply: ${error.message}`);
  }

  // Revalidate paths
  revalidatePath(`/commons/${feedAddress}/post/${parentPostId}`);
  revalidatePath(`/commons/${feedAddress}`);
}
