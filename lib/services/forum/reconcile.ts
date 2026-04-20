"use server";

import {
  fetchForumThreadById,
  updateForumThreadLensData,
  revalidateBoardPath,
} from "@/lib/external/supabase/forum-threads";
import {
  fetchForumRepliesByThread,
  updateForumReplyLensData,
  revalidateBoardAndThreadPaths,
} from "@/lib/external/supabase/forum-replies";
import { client as lensClient } from "@/lib/external/lens/protocol-client";
import { fetchPosts } from "@lens-protocol/client/actions";
import { evmAddress, PageSize } from "@lens-protocol/client";
import { COMMONS_FEED_ADDRESS } from "@/lib/shared/constants";

const RECONCILE_GRACE_MS = 10_000;

/**
 * If a thread is still `pending` after the grace window, query Lens for any
 * post on the Commons feed by this author whose contentUri matches what we
 * uploaded to Grove. If we find a match, save the lens_post_id and flip the
 * status to `confirmed`.
 *
 * Returns true if anything changed (so callers can revalidate paths).
 */
export async function reconcileForumThreadIfStale(threadId: string): Promise<boolean> {
  const thread = await fetchForumThreadById(threadId);
  if (!thread) return false;
  if (thread.publish_status !== "pending") return false;
  if (!thread.content_uri) return false;

  const ageMs = Date.now() - new Date(thread.created_at).getTime();
  if (ageMs < RECONCILE_GRACE_MS) return false;

  try {
    const result = await fetchPosts(lensClient, {
      filter: {
        authors: [evmAddress(thread.author_address)],
        feeds: [{ feed: evmAddress(COMMONS_FEED_ADDRESS) }],
      },
      pageSize: PageSize.Fifty,
    });

    if (!result.isOk() || !result.value.items?.length) return false;

    const match = (result.value.items as any[]).find(
      (p) =>
        p &&
        p.__typename === "Post" &&
        (p.contentUri === thread.content_uri || p.metadata?.id === thread.content_uri),
    );

    if (!match) return false;

    await updateForumThreadLensData(thread.id, match.id, thread.content_uri);
    if (thread.board_slug) await revalidateBoardPath(thread.board_slug);
    return true;
  } catch (err) {
    console.warn("[reconcile] thread reconcile failed:", err);
    return false;
  }
}

/**
 * Same idea for replies: query the parent thread's comments and match by
 * contentUri.
 */
export async function reconcileForumRepliesForThread(threadId: string): Promise<boolean> {
  const thread = await fetchForumThreadById(threadId);
  if (!thread || !thread.lens_post_id) return false;

  const replies = await fetchForumRepliesByThread(threadId);
  const stale = replies.filter(
    (r) =>
      r.publish_status === "pending" &&
      r.content_uri &&
      Date.now() - new Date(r.created_at).getTime() >= RECONCILE_GRACE_MS,
  );
  if (stale.length === 0) return false;

  try {
    const { fetchPostReferences } = await import("@lens-protocol/client/actions");
    const { PostReferenceType, postId } = await import("@lens-protocol/client");

    const result = await fetchPostReferences(lensClient, {
      referencedPost: postId(thread.lens_post_id),
      referenceTypes: [PostReferenceType.CommentOn],
    });

    if (!result.isOk() || !result.value.items?.length) return false;

    let changed = false;
    for (const reply of stale) {
      const match = (result.value.items as any[]).find(
        (p) =>
          p &&
          p.__typename === "Post" &&
          p.author?.address?.toLowerCase() === reply.author_address.toLowerCase() &&
          (p.contentUri === reply.content_uri || p.metadata?.id === reply.content_uri),
      );
      if (match) {
        await updateForumReplyLensData(reply.id, match.id, reply.content_uri!);
        changed = true;
      }
    }

    if (changed && thread.board_slug) {
      await revalidateBoardAndThreadPaths(thread.board_slug, thread.id);
    }
    return changed;
  } catch (err) {
    console.warn("[reconcile] reply reconcile failed:", err);
    return false;
  }
}

/** Convenience: reconcile both thread and replies in one call. */
export async function reconcileForumThread(threadId: string): Promise<{
  threadChanged: boolean;
  repliesChanged: boolean;
}> {
  const threadChanged = await reconcileForumThreadIfStale(threadId);
  const repliesChanged = await reconcileForumRepliesForThread(threadId);
  return { threadChanged, repliesChanged };
}
