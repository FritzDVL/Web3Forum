"use server";

import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { client } from "@/lib/external/lens/protocol-client";
import { Address } from "@/types/common";
import { immutable } from "@lens-chain/storage-client";
import { Post, SessionClient, evmAddress, uri } from "@lens-protocol/client";
import { fetchPost, post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { article } from "@lens-protocol/metadata";
import { WalletClient } from "viem";
import { revalidatePath } from "next/cache";
import { supabaseClient } from "@/lib/external/supabase/client";

export interface CreateFeedReplyResult {
  success: boolean;
  reply?: {
    id: string;
    content: string;
    author: string;
    timestamp: string;
  };
  error?: string;
}

export async function createFeedReply(
  feedId: string,
  parentPostId: string,
  content: string,
  feedAddress: Address,
  author: Address,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateFeedReplyResult> {
  try {
    // 1. Create metadata using article (supports markdown and formatting)
    const metadata = article({
      content,
    });

    // 2. Upload metadata to storage
    const acl = immutable(lensChain.id);
    const { uri: replyUri } = await storageClient.uploadAsJson(metadata, { acl });

    // 3. Post to Lens Protocol (NO commentOn - regular post)
    const result = await post(sessionClient, {
      contentUri: uri(replyUri),
      feed: evmAddress(feedAddress),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

    if (result.isErr()) {
      const errorMessage =
        result.error && typeof result.error === "object" && "message" in result.error
          ? (result.error as any).message
          : "Failed to create reply";
      return {
        success: false,
        error: errorMessage,
      };
    }

    const createdPost = result.value as Post;

    // 4. Save to database with parent reference
    const supabase = await supabaseClient();
    await supabase.from("feed_posts").insert({
      feed_id: feedId,
      lens_post_id: createdPost.id,
      author: author,
      title: null,
      content: content,
      parent_post_id: parentPostId,
    });

    // 5. Revalidate paths
    revalidatePath(`/commons/${feedAddress}/post/${parentPostId}`);
    revalidatePath(`/commons/${feedAddress}`);

    return {
      success: true,
      reply: {
        id: createdPost.id,
        content: createdPost.metadata?.content || content,
        author: createdPost.author.address,
        timestamp: createdPost.timestamp || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Reply creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create reply",
    };
  }
}
