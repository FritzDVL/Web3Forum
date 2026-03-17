import { storageClient } from "@/lib/external/grove/client";
import { lensChain } from "@/lib/external/lens/chain";
import { client } from "@/lib/external/lens/protocol-client";
import { revalidateResearchPath, revalidateResearchThreadPath } from "@/app/actions/revalidate-path";
import { RESEARCH_FEED_ADDRESS } from "@/lib/shared/constants";
import {
  persistResearchPublication,
  incrementRootPostCount,
  getNextPostNumber,
  fetchResearchRootByLensId,
} from "@/lib/external/supabase/research-publications";
import { immutable } from "@lens-chain/storage-client";
import { Post, SessionClient, evmAddress, uri } from "@lens-protocol/client";
import { postId } from "@lens-protocol/client";
import { fetchPost, post } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { article } from "@lens-protocol/metadata";
import { WalletClient } from "viem";

export interface CreateResearchResponseResult {
  success: boolean;
  lensPostId?: string;
  error?: string;
}

export async function createResearchResponse(
  rootLensPostId: string,
  content: string,
  authorAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateResearchResponseResult> {
  try {
    const rootRow = await fetchResearchRootByLensId(rootLensPostId);
    if (!rootRow) {
      return { success: false, error: "Thread not found" };
    }

    const metadata = article({ content });

    const acl = immutable(lensChain.id);
    const { uri: contentUri } = await storageClient.uploadAsJson(metadata, { acl });

    const result = await post(sessionClient, {
      contentUri: uri(contentUri),
      commentOn: { post: postId(rootLensPostId) },
      feed: evmAddress(RESEARCH_FEED_ADDRESS),
    })
      .andThen(handleOperationWith(walletClient))
      .andThen(sessionClient.waitForTransaction)
      .andThen((txHash: unknown) => fetchPost(client, { txHash: txHash as string }));

    if (result.isErr()) {
      const errorMessage =
        result.error && typeof result.error === "object" && "message" in result.error
          ? (result.error as any).message
          : "Failed to create response";
      return { success: false, error: errorMessage };
    }

    const createdPost = result.value as Post;

    const nextNumber = await getNextPostNumber(rootLensPostId);

    await persistResearchPublication({
      lensPostId: createdPost.id,
      rootLensPostId,
      categorySlug: rootRow.category_slug,
      authorAddress,
      title: null,
      tags: null,
      postNumber: nextNumber,
      isRoot: false,
    });

    await incrementRootPostCount(rootLensPostId);

    await revalidateResearchThreadPath(rootLensPostId);
    await revalidateResearchPath();

    return { success: true, lensPostId: createdPost.id };
  } catch (error) {
    console.error("Failed to create research response:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create response" };
  }
}
