import { createThreadArticle } from "@/lib/external/lens/primitives/articles";
import { fetchAccountFromLens } from "@/lib/external/lens/primitives/accounts";
import {
  persistForumThread,
  updateForumThreadLensData,
  updateForumThreadStatus,
  revalidateBoardPath,
} from "@/lib/external/supabase/forum-threads";
import { incrementBoardThreadCount } from "@/lib/external/supabase/forum-boards";
import { COMMONS_FEED_ADDRESS } from "@/lib/shared/constants";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";

export interface PublishForumThreadParams {
  boardSlug: string;
  title: string;
  summary: string;
  contentMarkdown: string;
  contentJson: any;
  authorAddress: string;
  tags?: string[];
}

export interface SaveForumThreadResult {
  success: boolean;
  threadId?: string;
  slug?: string;
  error?: string;
}

/**
 * Step 1: Save thread to Supabase. Returns instantly.
 * All Supabase calls go through "use server" functions.
 */
export async function saveForumThread(
  params: PublishForumThreadParams,
): Promise<SaveForumThreadResult> {
  try {
    const slug = params.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) + `-${Date.now()}`;

    // Save to Supabase FIRST — username resolved later
    const row = await persistForumThread({
      boardSlug: params.boardSlug,
      feedType: "commons",
      title: params.title,
      summary: params.summary,
      contentMarkdown: params.contentMarkdown,
      contentJson: params.contentJson,
      authorAddress: params.authorAddress,
      authorUsername: null, // resolved async, not blocking
      tags: params.tags || null,
      slug,
    });

    await incrementBoardThreadCount(params.boardSlug);

    // Bust Next.js Router Cache for the board listing so the new post
    // appears immediately when the user navigates back.
    await revalidateBoardPath(params.boardSlug);

    // Resolve username in background (non-blocking)
    fetchAccountFromLens(params.authorAddress).then((account) => {
      if (account?.username?.localName) {
        import("@/lib/external/supabase/forum-threads").then(({ updateForumThreadUsername }) => {
          updateForumThreadUsername(row.id, account.username!.localName!).catch(() => {});
        });
      }
    }).catch(() => {});

    return { success: true, threadId: row.id, slug };
  } catch (error) {
    console.error("Failed to save forum thread:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save thread" };
  }
}

/**
 * Step 2: Publish existing thread to Lens. Requires wallet signature.
 */
export async function publishForumThreadToLens(
  threadId: string,
  params: {
    title: string;
    summary: string;
    contentMarkdown: string;
    contentJson: any;
    authorAddress: string;
    boardSlug: string;
    slug: string;
    tags?: string[];
  },
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<{ success: boolean; lensPostId?: string; error?: string }> {
  try {
    const articleResult = await createThreadArticle(
      {
        title: params.title,
        content: params.contentMarkdown,
        author: params.authorAddress,
        summary: params.summary,
        tags: params.tags?.join(","),
        feedAddress: COMMONS_FEED_ADDRESS,
        slug: params.slug,
        forumType: "thread",
        forumCategory: params.boardSlug,
        contentJson: params.contentJson ? JSON.stringify(params.contentJson) : undefined,
      },
      sessionClient,
      walletClient,
    );

    if (!articleResult.success) {
      await updateForumThreadStatus(threadId, "failed");
      return { success: false, error: articleResult.error || "Lens publish failed" };
    }

    if (!articleResult.post) {
      // Lens transaction landed but the indexer hasn't surfaced the post id yet.
      // Mark as confirmed anyway so the user gets accurate feedback — the
      // post IS on-chain. The post id can be backfilled later if needed.
      await updateForumThreadStatus(threadId, "confirmed");
      return { success: true };
    }

    await updateForumThreadLensData(threadId, articleResult.post.id, articleResult.post.contentUri || "");
    return { success: true, lensPostId: articleResult.post.id };
  } catch (error) {
    try { await updateForumThreadStatus(threadId, "failed"); } catch {}
    return { success: false, error: error instanceof Error ? error.message : "Lens publish failed" };
  }
}
