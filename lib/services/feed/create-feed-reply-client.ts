import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { client } from "@/lib/external/lens/protocol-client";
import { Address } from "@/types/common";
import { immutable } from "@lens-chain/storage-client";
import { Post, SessionClient, evmAddress, postId, uri } from "@lens-protocol/client";
import { fetchPost, post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { article } from "@lens-protocol/metadata";
import { WalletClient } from "viem";
import { saveFeedReplyToDB } from "./save-feed-reply";

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
    console.log("[createFeedReply] Starting reply creation");

    // 1. Create metadata using article
    const metadata = article({ content });

    // 2. Upload metadata to storage
    const acl = immutable(lensChain.id);
    const { uri: replyUri } = await storageClient.uploadAsJson(metadata, { acl });

    // 3. Post to Lens Protocol as a COMMENT
    const result = await post(sessionClient, {
      contentUri: uri(replyUri),
      commentOn: { post: postId(parentPostId) },
      feed: evmAddress(feedAddress),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

    if (result.isErr()) {
      console.error("[createFeedReply] Lens post failed:", result.error);
      return {
        success: false,
        error: result.error && typeof result.error === "object" && "message" in result.error
          ? (result.error as any).message
          : "Failed to create reply",
      };
    }

    const createdPost = result.value as Post;
    console.log("[createFeedReply] Post created:", createdPost.id);

    // 4. Save to database via server action
    await saveFeedReplyToDB(feedId, createdPost.id, author, content, parentPostId, feedAddress);

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
    console.error("[createFeedReply] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create reply",
    };
  }
}
