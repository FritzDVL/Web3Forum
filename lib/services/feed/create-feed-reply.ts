"use server";

import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { client } from "@/lib/external/lens/protocol-client";
import { Address } from "@/types/common";
import { immutable } from "@lens-chain/storage-client";
import { Post, SessionClient, evmAddress, postId, uri } from "@lens-protocol/client";
import { fetchPost, post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { textOnly } from "@lens-protocol/metadata";
import { WalletClient } from "viem";
import { revalidatePath } from "next/cache";

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
  parentPostId: string,
  content: string,
  feedAddress: Address,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateFeedReplyResult> {
  try {
    // 1. Create metadata
    const metadata = textOnly({ content });

    // 2. Upload metadata to storage
    const acl = immutable(lensChain.id);
    const { uri: replyUri } = await storageClient.uploadAsJson(metadata, { acl });

    // 3. Post to Lens Protocol
    const result = await post(sessionClient, {
      contentUri: uri(replyUri),
      commentOn: { post: postId(parentPostId) },
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

    // 4. Revalidate paths
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
