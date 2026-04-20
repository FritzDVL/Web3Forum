import { createForumReplyArticle } from "@/lib/external/lens/primitives/articles";
import { fetchAccountFromLens } from "@/lib/external/lens/primitives/accounts";
import {
  persistForumReply,
  updateForumReplyLensData,
  updateForumReplyContentUri,
  updateForumReplyStatus,
  getNextReplyPosition,
  fetchForumReplyById,
} from "@/lib/external/supabase/forum-replies";
import { fetchForumThreadById } from "@/lib/external/supabase/forum-threads";
import { COMMONS_FEED_ADDRESS } from "@/lib/shared/constants";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";

export interface PublishForumReplyParams {
  threadId: string;
  contentMarkdown: string;
  contentJson: any;
  authorAddress: string;
}

export interface SaveForumReplyResult {
  success: boolean;
  replyId?: string;
  error?: string;
}

/**
 * Step 1: Save reply to Supabase. Returns instantly.
 */
export async function saveForumReply(
  params: PublishForumReplyParams,
): Promise<SaveForumReplyResult> {
  try {
    const thread = await fetchForumThreadById(params.threadId);
    if (!thread) return { success: false, error: "Thread not found" };
    if (thread.is_locked) return { success: false, error: "Thread is locked" };

    const position = await getNextReplyPosition(params.threadId);

    const row = await persistForumReply({
      threadId: params.threadId,
      position,
      contentMarkdown: params.contentMarkdown,
      contentJson: params.contentJson,
      authorAddress: params.authorAddress,
      authorUsername: null, // resolved async
    });

    const { incrementForumReplyCount, revalidateBoardAndThreadPaths } = await import("@/lib/external/supabase/forum-replies");
    await incrementForumReplyCount(params.threadId);
    if (thread.board_slug) {
      await revalidateBoardAndThreadPaths(thread.board_slug, params.threadId);
    }

    // Resolve username in background
    fetchAccountFromLens(params.authorAddress).then((account) => {
      if (account?.username?.localName) {
        import("@/lib/external/supabase/forum-replies").then(({ updateForumReplyUsername }) => {
          updateForumReplyUsername(row.id, account.username!.localName!).catch(() => {});
        });
      }
    }).catch(() => {});

    return { success: true, replyId: row.id };
  } catch (error) {
    console.error("Failed to save forum reply:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to save reply" };
  }
}

/**
 * Step 2: Publish reply to Lens. Requires wallet signature.
 */
export async function publishForumReplyToLens(
  replyId: string,
  params: PublishForumReplyParams,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<{ success: boolean; error?: string }> {
  try {
    const thread = await fetchForumThreadById(params.threadId);
    if (!thread || !thread.lens_post_id) {
      // Parent thread isn't on-chain yet. Mark this reply as failed so the
      // status badge stops showing "Publishing..." forever and the user can retry.
      try { await updateForumReplyStatus(replyId, "failed"); } catch {}
      return { success: false, error: "Thread not on-chain yet" };
    }

    const reply = await fetchForumReplyById(replyId);
    if (!reply) return { success: false, error: "Reply not found" };

    const articleResult = await createForumReplyArticle(
      {
        threadTitle: thread.title,
        content: params.contentMarkdown,
        author: params.authorAddress,
        feedAddress: COMMONS_FEED_ADDRESS,
        slug: thread.slug || "",
        forumThreadId: thread.lens_post_id,
        forumReplyPosition: reply.position,
        forumCategory: thread.board_slug || undefined,
        contentJson: params.contentJson ? JSON.stringify(params.contentJson) : undefined,
      },
      sessionClient,
      walletClient,
    );

    // Persist contentUri the moment we have it so the reconciler can find
    // the post on Lens later, even if the indexer is lagging or our process dies.
    if (articleResult.contentUri) {
      try {
        await updateForumReplyContentUri(replyId, articleResult.contentUri);
      } catch (e) {
        console.warn("Failed to persist reply contentUri early:", e);
      }
    }

    if (!articleResult.success) {
      await updateForumReplyStatus(replyId, "failed");
      return { success: false, error: articleResult.error };
    }

    if (!articleResult.post) {
      // Lens transaction landed but indexer lag — leave as pending; the
      // server-side reconciler will flip to confirmed once it finds the post.
      return { success: true };
    }

    await updateForumReplyLensData(replyId, articleResult.post.id, articleResult.post.contentUri || articleResult.contentUri || "");
    return { success: true };
  } catch (error) {
    try { await updateForumReplyStatus(replyId, "failed"); } catch {}
    return { success: false, error: error instanceof Error ? error.message : "Lens publish failed" };
  }
}
