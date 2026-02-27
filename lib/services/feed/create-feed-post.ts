"use server";

import { revalidatePath } from "next/cache";
import { adaptLensPostToFeedPost } from "@/lib/adapters/feed-adapter";
import { FeedPost } from "@/lib/domain/feeds/types";
import { fetchAccountFromLens } from "@/lib/external/lens/primitives/accounts";
import { createThreadArticle } from "@/lib/external/lens/primitives/articles";
import { persistFeedPost } from "@/lib/external/supabase/feed-posts";
import { Address } from "@/types/common";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";

export interface CreateFeedPostResult {
  success: boolean;
  post?: FeedPost;
  error?: string;
}

export async function createFeedPost(
  feedId: string,
  feedAddress: Address,
  formData: FormData,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateFeedPostResult> {
  try {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const author = formData.get("author") as Address;
    const summary = formData.get("summary") as string;
    const tags = formData.get("tags") as string | null;

    // 1. Create article in Lens feed
    const articleFormData = {
      title,
      content,
      author,
      summary,
      tags: tags || undefined,
      feedAddress,
      slug: `${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    };

    const articleResult = await createThreadArticle(articleFormData, sessionClient, walletClient);
    
    if (!articleResult.success || !articleResult.post) {
      return {
        success: false,
        error: articleResult.error || "Failed to create post",
      };
    }

    const rootPost = articleResult.post;

    // 2. Fetch author account
    const authorAccount = await fetchAccountFromLens(author);
    if (!authorAccount) {
      return {
        success: false,
        error: "Failed to fetch author account",
      };
    }

    // 3. Save in database
    const authorDb = authorAccount.username?.localName || authorAccount.address;
    const persistedPost = await persistFeedPost(
      feedId,
      rootPost.id,
      authorDb,
      title,
      content,
    );

    // 4. Transform to FeedPost
    const feedPost = await adaptLensPostToFeedPost(feedId, feedAddress, rootPost, persistedPost);

    // 5. Revalidate paths
    revalidatePath(`/commons/${feedAddress}`);
    revalidatePath("/");

    return {
      success: true,
      post: feedPost,
    };
  } catch (error) {
    console.error("Failed to create feed post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
