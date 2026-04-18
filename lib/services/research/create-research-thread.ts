import { persistResearchPublication } from "@/lib/external/supabase/research-publications";
import { incrementCategoryPublicationCount } from "@/lib/external/supabase/research-categories";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";

export interface CreateResearchThreadResult {
  success: boolean;
  publicationId?: string;
  error?: string;
}

/**
 * Save research thread to Supabase immediately. Lens publish is separate.
 */
export async function saveResearchThread(
  formData: {
    title: string;
    content: string;
    contentJson: any;
    categorySlug: string;
    tags: string[];
    author: string;
  },
): Promise<CreateResearchThreadResult> {
  try {
    const row = await persistResearchPublication({
      lensPostId: `pending-${Date.now()}`,
      rootLensPostId: null,
      categorySlug: formData.categorySlug,
      authorAddress: formData.author,
      title: formData.title,
      tags: formData.tags.length > 0 ? formData.tags : null,
      postNumber: 1,
      isRoot: true,
      contentMarkdown: formData.content,
      contentJson: formData.contentJson,
    });

    await incrementCategoryPublicationCount(formData.categorySlug);

    return { success: true, publicationId: row.id };
  } catch (error) {
    console.error("Failed to save research thread:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save thread" };
  }
}

// Keep backward compat — old name delegates to save-only
export async function createResearchThread(
  formData: {
    title: string;
    content: string;
    contentJson: any;
    categorySlug: string;
    tags: string[];
    author: string;
  },
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateResearchThreadResult> {
  return saveResearchThread(formData);
}
