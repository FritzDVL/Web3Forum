import {
  persistResearchPublication,
  incrementRootPostCount,
  getNextPostNumber,
  fetchResearchRootByLensId,
} from "@/lib/external/supabase/research-publications";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";

export interface CreateResearchResponseResult {
  success: boolean;
  publicationId?: string;
  error?: string;
}

/**
 * Save research response to Supabase immediately. Lens publish is separate.
 */
export async function saveResearchResponse(
  rootLensPostId: string,
  content: string,
  contentJson: any,
  authorAddress: string,
): Promise<CreateResearchResponseResult> {
  try {
    const rootRow = await fetchResearchRootByLensId(rootLensPostId);
    if (!rootRow) return { success: false, error: "Thread not found" };

    const nextNumber = await getNextPostNumber(rootLensPostId);

    const row = await persistResearchPublication({
      lensPostId: `pending-${Date.now()}`,
      rootLensPostId,
      categorySlug: rootRow.category_slug,
      authorAddress,
      title: null,
      tags: null,
      postNumber: nextNumber,
      isRoot: false,
      contentMarkdown: content,
      contentJson,
    });

    await incrementRootPostCount(rootLensPostId);

    return { success: true, publicationId: row.id };
  } catch (error) {
    console.error("Failed to save research response:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save response" };
  }
}

// Backward compat
export async function createResearchResponse(
  rootLensPostId: string,
  content: string,
  contentJson: any,
  authorAddress: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateResearchResponseResult> {
  return saveResearchResponse(rootLensPostId, content, contentJson, authorAddress);
}
