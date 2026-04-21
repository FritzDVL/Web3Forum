"use server";

import {
  fetchForumThreadById,
  updateForumThreadLensData,
  revalidateBoardPath,
} from "@/lib/external/supabase/forum-threads";
import { client as lensClient } from "@/lib/external/lens/protocol-client";
import { fetchPosts } from "@lens-protocol/client/actions";
import { evmAddress, PageSize } from "@lens-protocol/client";
import { COMMONS_FEED_ADDRESS, APP_URL } from "@/lib/shared/constants";

export interface RecoveryResult {
  success: boolean;
  recovered?: boolean;
  needsClientPublish?: boolean;
  lensPostId?: string;
  contentUri?: string;
  error?: string;
}

function getContent(p: any): string {
  return (
    p?.metadata?.content ||
    p?.metadata?.body ||
    ""
  );
}

function getContentUri(p: any): string | null {
  return (
    p?.contentUri ||
    p?.contentURI ||
    p?.metadata?.rawURI ||
    p?.metadata?.contentURI ||
    p?.metadata?.contentUri ||
    p?.metadata?.id ||
    null
  );
}

/**
 * Try to recover a stuck thread by scanning the author's recent Commons posts
 * on Lens and matching by the embedded forum slug URL. Used for posts that
 * lost their content_uri write before the indexer could surface them.
 *
 * Returns:
 *   - { success: true, recovered: true }                — found on Lens, DB updated
 *   - { success: true, needsClientPublish: true }       — not on Lens, caller should publish
 *   - { success: false, error }                         — couldn't determine
 */
export async function tryRecoverForumThread(threadId: string): Promise<RecoveryResult> {
  const thread = await fetchForumThreadById(threadId);
  if (!thread) return { success: false, error: "Thread not found" };
  if (thread.publish_status === "confirmed" && thread.lens_post_id) {
    return { success: true, recovered: false, lensPostId: thread.lens_post_id };
  }
  if (!thread.slug) {
    return { success: true, needsClientPublish: true };
  }

  try {
    const result = await fetchPosts(lensClient, {
      filter: {
        authors: [evmAddress(thread.author_address)],
        feeds: [{ feed: evmAddress(COMMONS_FEED_ADDRESS) }],
      },
      pageSize: PageSize.Fifty,
    });

    if (!result.isOk()) {
      // Don't fall back to publishing — we can't tell whether a Lens post
      // already exists for this thread. Republishing on a transient API
      // error would create a duplicate.
      return { success: false, error: "Lens scan failed; aborting to avoid duplicate" };
    }

    const items = (result.value.items || []) as any[];
    // Match the slug with a boundary so `/forum/p/foo` doesn't match
    // `/forum/p/foo-1234567890123`. Slug appears in markdown link form:
    //   [Title](https://lensforum.xyz/forum/p/<slug>)
    // so the next char will be `)`, but we also accept whitespace / EOL
    // for resilience.
    const escapedSlug = thread.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const slugRegex = new RegExp(`/forum/p/${escapedSlug}(?=[)\\s\\\\?#"]|$)`);

    const match = items.find((p) => {
      if (!p || p.__typename !== "Post") return false;
      const content = getContent(p);
      return content && slugRegex.test(content);
    });

    if (!match) {
      return { success: true, needsClientPublish: true };
    }

    const matchedUri = getContentUri(match) || "";
    await updateForumThreadLensData(thread.id, match.id, matchedUri);
    if (thread.board_slug) await revalidateBoardPath(thread.board_slug);

    return {
      success: true,
      recovered: true,
      lensPostId: match.id,
      contentUri: matchedUri,
    };
  } catch (err) {
    console.warn("[tryRecoverForumThread] failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Recovery failed" };
  }
}
