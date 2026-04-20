import {
  fetchForumThreadBySlug,
  ForumThreadRow,
} from "@/lib/external/supabase/forum-threads";
import {
  fetchForumReplyByThreadAndPosition,
  ForumReplyRow,
} from "@/lib/external/supabase/forum-replies";
import {
  fetchArticleMetadata,
  normalizeArticleMetadata,
  NormalizedArticle,
} from "@/lib/external/grove/fetch-metadata";
import { PublishStatus } from "@/lib/domain/forum/types";

export interface ArticleViewModel {
  /** What kind of forum entity this article represents */
  kind: "thread" | "reply";
  /** Title shown at the top of the article page */
  title: string;
  /** Markdown body to render */
  content: string;
  /** Tags pulled from Lens metadata (or Supabase row for threads) */
  tags: string[];
  /** Author */
  authorAddress: string;
  authorUsername: string | null;
  /** Created at ISO */
  createdAt: string;
  /** Forum context for breadcrumbs / back-links */
  boardSlug: string | null;
  threadSlug: string;
  threadTitle: string;
  /** Position is only meaningful for replies */
  replyPosition: number | null;
  /** On-chain panel data */
  publishStatus: PublishStatus;
  lensPostId: string | null;
  contentUri: string | null;
  /** Whether the body came from Grove (preferred) or Supabase fallback */
  source: "grove" | "supabase";
}

export interface GetArticleResult {
  success: boolean;
  article?: ArticleViewModel;
  error?: string;
}

function buildFromThreadRow(
  row: ForumThreadRow,
  meta: NormalizedArticle | null,
): ArticleViewModel {
  const usingGrove = !!(meta && meta.content);
  return {
    kind: "thread",
    title: meta?.title || row.title || "Untitled",
    content: usingGrove ? meta!.content! : row.content_markdown || row.summary || "",
    tags: meta?.tags?.length ? meta.tags : row.tags || [],
    authorAddress: row.author_address,
    authorUsername: row.author_username,
    createdAt: row.created_at,
    boardSlug: row.board_slug,
    threadSlug: row.slug || "",
    threadTitle: row.title,
    replyPosition: null,
    publishStatus: row.publish_status,
    lensPostId: row.lens_post_id,
    contentUri: row.content_uri,
    source: usingGrove ? "grove" : "supabase",
  };
}

function buildFromReplyRow(
  thread: ForumThreadRow,
  reply: ForumReplyRow,
  meta: NormalizedArticle | null,
): ArticleViewModel {
  const usingGrove = !!(meta && meta.content);
  // For replies the Grove metadata title is "Re: <thread title>" and the body
  // is just a back-reference link. The actual reply prose lives in Supabase
  // `content_markdown`. So for replies we *prefer* Supabase content but fall
  // back to Grove if Supabase is empty.
  const replyBody = reply.content_markdown || (usingGrove ? meta!.content! : "");
  return {
    kind: "reply",
    title: `Reply #${reply.position} — ${thread.title}`,
    content: replyBody,
    tags: meta?.tags ?? [],
    authorAddress: reply.author_address,
    authorUsername: reply.author_username,
    createdAt: reply.created_at,
    boardSlug: thread.board_slug,
    threadSlug: thread.slug || "",
    threadTitle: thread.title,
    replyPosition: reply.position,
    publishStatus: reply.publish_status,
    lensPostId: reply.lens_post_id,
    contentUri: reply.content_uri,
    source: replyBody === reply.content_markdown ? "supabase" : "grove",
  };
}

/** Resolve an article (root post) by its thread slug. */
export async function getArticleByThreadSlug(
  threadSlug: string,
): Promise<GetArticleResult> {
  try {
    const row = await fetchForumThreadBySlug(threadSlug);
    if (!row) return { success: false, error: "Article not found" };

    const meta = normalizeArticleMetadata(await fetchArticleMetadata(row.content_uri));
    return { success: true, article: buildFromThreadRow(row, meta) };
  } catch (err) {
    console.error("getArticleByThreadSlug failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to load article" };
  }
}

/** Resolve a reply article by parent thread slug + reply position. */
export async function getReplyArticle(
  threadSlug: string,
  position: number,
): Promise<GetArticleResult> {
  try {
    const thread = await fetchForumThreadBySlug(threadSlug);
    if (!thread) return { success: false, error: "Thread not found" };

    const reply = await fetchForumReplyByThreadAndPosition(thread.id, position);
    if (!reply) return { success: false, error: "Reply not found" };

    const meta = normalizeArticleMetadata(await fetchArticleMetadata(reply.content_uri));
    return { success: true, article: buildFromReplyRow(thread, reply, meta) };
  } catch (err) {
    console.error("getReplyArticle failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to load reply" };
  }
}
