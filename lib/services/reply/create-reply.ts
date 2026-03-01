import { adaptPostToReply } from "@/lib/adapters/reply-adapter";
import { Reply } from "@/lib/domain/replies/types";
import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { client } from "@/lib/external/lens/protocol-client";
import { incrementThreadRepliesCount } from "@/lib/external/supabase/threads";
import { Address } from "@/types/common";
import { immutable } from "@lens-chain/storage-client";
import { Post, SessionClient, evmAddress, postId, uri } from "@lens-protocol/client";
import { fetchPost, post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { textOnly } from "@lens-protocol/metadata";
import { WalletClient } from "viem";

export interface CreateReplyResult {
  success: boolean;
  reply?: Reply;
  error?: string;
}

/**
 * Creates a reply using existing logic from useReplyCreate hook
 */
export async function createReply(
  parentId: string,
  content: string,
  threadAddress: Address,
  threadId: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateReplyResult> {
  try {
    if (!sessionClient) {
      return {
        success: false,
        error: "No session client available",
      };
    }

    // 1. Create metadata
    const metadata = textOnly({ content });

    // 2. Upload metadata to storage
    const acl = immutable(lensChain.id);
    const { uri: replyUri } = await storageClient.uploadAsJson(metadata, { acl });

    // 3. Post to Lens Protocol - using the correct API structure
    const result = await post(sessionClient, {
      contentUri: uri(replyUri),
      commentOn: { post: postId(parentId) },
      feed: evmAddress(threadAddress),
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

    // 4. Increment thread replies count (only for Supabase threads, not Lens-only posts)
    // Check if threadId is a UUID (Supabase) vs Lens Publication ID format
    const isSupabaseThread = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(threadId);
    
    if (isSupabaseThread) {
      try {
        await incrementThreadRepliesCount(threadId);
      } catch (error) {
        console.warn("Failed to increment thread replies count:", error);
        // Don't fail the entire operation for this
      }
    }

    // 5. Transform post to reply - using the correct author parameter
    const reply = adaptPostToReply(createdPost);

    return {
      success: true,
      reply,
    };
  } catch (error) {
    console.error("Reply creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create reply",
    };
  }
}
