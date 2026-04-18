import {
  createThreadArticle,
  createForumReplyArticle,
} from "@/lib/external/lens/primitives/articles";
import {
  fetchForumThreadById,
  updateForumThreadLensData,
  updateForumThreadStatus,
} from "@/lib/external/supabase/forum-threads";
import {
  fetchForumReplyById,
  updateForumReplyLensData,
  updateForumReplyStatus,
} from "@/lib/external/supabase/forum-replies";
import { COMMONS_FEED_ADDRESS, RESEARCH_FEED_ADDRESS } from "@/lib/shared/constants";
import { SessionClient } from "@lens-protocol/client";
import { WalletClient } from "viem";

export type RetryTarget =
  | { type: "forum-thread"; id: string }
  | { type: "forum-reply"; id: string };

export interface RetryPublishResult {
  success: boolean;
  lensPostId?: string;
  error?: string;
}

/**
 * Retries Lens publish for any post type.
 * Reads content from Supabase (via server actions), publishes to Lens, updates row.
 */
export async function retryPublish(
  target: RetryTarget,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<RetryPublishResult> {
  if (target.type === "forum-thread") {
    return retryForumThread(target.id, sessionClient, walletClient);
  }
  if (target.type === "forum-reply") {
    return retryForumReply(target.id, sessionClient, walletClient);
  }
  return { success: false, error: "Unknown target type" };
}

async function retryForumThread(
  threadId: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<RetryPublishResult> {
  const thread = await fetchForumThreadById(threadId);
  if (!thread) return { success: false, error: "Thread not found" };
  if (thread.publish_status === "confirmed") return { success: true, lensPostId: thread.lens_post_id! };

  const result = await createThreadArticle(
    {
      title: thread.title,
      content: thread.content_markdown || "",
      author: thread.author_address,
      summary: thread.summary || "",
      tags: thread.tags?.join(","),
      feedAddress: COMMONS_FEED_ADDRESS,
      slug: thread.slug || "",
      forumType: "thread",
      forumCategory: thread.board_slug || undefined,
      contentJson: thread.content_json ? JSON.stringify(thread.content_json) : undefined,
    },
    sessionClient,
    walletClient,
  );

  if (!result.success || !result.post) {
    await updateForumThreadStatus(threadId, "failed");
    return { success: false, error: result.error || "Lens publish failed" };
  }

  await updateForumThreadLensData(threadId, result.post.id, result.post.contentUri || "");
  return { success: true, lensPostId: result.post.id };
}

async function retryForumReply(
  replyId: string,
  sessionClient: SessionClient,
  walletClient: WalletClient,
): Promise<RetryPublishResult> {
  const reply = await fetchForumReplyById(replyId);
  if (!reply) return { success: false, error: "Reply not found" };
  if (reply.publish_status === "confirmed") return { success: true, lensPostId: reply.lens_post_id! };

  const thread = await fetchForumThreadById(reply.thread_id);
  if (!thread) return { success: false, error: "Parent thread not found" };
  if (!thread.lens_post_id) return { success: false, error: "Parent thread not yet published to Lens" };

  const result = await createForumReplyArticle(
    {
      threadTitle: thread.title,
      content: reply.content_markdown || "",
      author: reply.author_address,
      feedAddress: COMMONS_FEED_ADDRESS,
      slug: thread.slug || "",
      forumThreadId: thread.lens_post_id,
      forumReplyPosition: reply.position,
      forumCategory: thread.board_slug || undefined,
      contentJson: reply.content_json ? JSON.stringify(reply.content_json) : undefined,
    },
    sessionClient,
    walletClient,
  );

  if (!result.success || !result.post) {
    await updateForumReplyStatus(replyId, "failed");
    return { success: false, error: result.error || "Lens publish failed" };
  }

  await updateForumReplyLensData(replyId, result.post.id, result.post.contentUri || "");
  return { success: true, lensPostId: result.post.id };
}
