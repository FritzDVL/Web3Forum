import { createThreadArticle } from "@/lib/external/lens/primitives/articles";
import { persistResearchPublication } from "@/lib/external/supabase/research-publications";
import { incrementCategoryPublicationCount } from "@/lib/external/supabase/research-categories";
import { revalidateResearchPath, revalidateHomePath } from "@/app/actions/revalidate-path";
import { RESEARCH_FEED_ADDRESS } from "@/lib/shared/constants";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";

export interface CreateResearchThreadResult {
  success: boolean;
  lensPostId?: string;
  error?: string;
}

export async function createResearchThread(
  formData: {
    title: string;
    content: string;
    categorySlug: string;
    tags: string[];
    author: string;
  },
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<CreateResearchThreadResult> {
  try {
    const articleResult = await createThreadArticle(
      {
        title: formData.title,
        content: formData.content,
        author: formData.author,
        summary: "",
        tags: formData.tags.length > 0 ? formData.tags.join(",") : undefined,
        feedAddress: RESEARCH_FEED_ADDRESS,
        slug: `research-${Date.now()}-${formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
      },
      sessionClient,
      walletClient,
    );

    if (!articleResult.success || !articleResult.post) {
      return { success: false, error: articleResult.error || "Failed to create article on Lens" };
    }

    await persistResearchPublication({
      lensPostId: articleResult.post.id,
      rootLensPostId: null,
      categorySlug: formData.categorySlug,
      authorAddress: formData.author,
      title: formData.title,
      tags: formData.tags.length > 0 ? formData.tags : null,
      postNumber: 1,
      isRoot: true,
    });

    await incrementCategoryPublicationCount(formData.categorySlug);

    await revalidateResearchPath();
    await revalidateHomePath();

    return { success: true, lensPostId: articleResult.post.id };
  } catch (error) {
    console.error("Failed to create research thread:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create thread" };
  }
}
