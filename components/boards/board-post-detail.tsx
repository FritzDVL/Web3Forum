"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { publishForumReplyToLens } from "@/lib/services/forum/publish-reply";
import { publishForumThreadToLens } from "@/lib/services/forum/publish-thread";
import { tryRecoverForumThread } from "@/lib/services/forum/recover-or-publish";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardReplyBox } from "./board-reply-box";
import { ForumThread, ForumReply } from "@/lib/domain/forum/types";
import { PublishStatusBadge } from "@/components/shared/publish-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getArticleUrl, getReplyArticleUrl } from "@/lib/shared/lens-urls";
import { groveUriToHttpUrl } from "@/lib/external/grove/fetch-metadata";

const AUTO_PUBLISH_KEY_PREFIX = "lensforum:autopublish:";

interface AutoPublishPayload {
  title: string;
  contentMarkdown: string;
  contentJson: any;
  authorAddress: string;
  boardSlug: string;
  slug: string;
  tags?: string[];
}

function readAndClearAutoPublish(threadId: string): AutoPublishPayload | null {
  try {
    const key = AUTO_PUBLISH_KEY_PREFIX + threadId;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    return JSON.parse(raw) as AutoPublishPayload;
  } catch {
    return null;
  }
}

interface BoardPostDetailProps {
  post: ForumThread;
  replies: ForumReply[];
}

export function BoardPostDetail({ post, replies }: BoardPostDetailProps) {
  const router = useRouter();
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  // Track which replies we've already auto-retried this session so we don't
  // re-spam the wallet popup on every poll tick.
  const retriedRef = useRef<Set<string>>(new Set());
  // Single-flight guard for root-post publishing: shared between the auto
  // sessionStorage handoff and the manual "Retry publish" button so they
  // can't both fire publishForumThreadToLens in parallel and create a
  // duplicate Lens post.
  const rootPublishInFlightRef = useRef<Set<string>>(new Set());
  const [isRetrying, setIsRetrying] = useState(false);

  const isAuthor =
    !!account?.address &&
    account.address.toLowerCase() === post.authorAddress.toLowerCase();

  useEffect(() => {
    fetch(`/api/posts/${post.id}/view`, { method: "POST" }).catch(() => {});
  }, [post.id]);

  // Root-post auto-publish handoff: if the create form just navigated here
  // and stashed an autopublish payload in sessionStorage, run the Lens
  // publish from THIS page (not the unmounted form) so the wallet flow and
  // follow-up Supabase writes are guaranteed to land.
  useEffect(() => {
    if (post.publishStatus !== "pending") return;
    if (post.lensPostId) return;
    if (!isAuthor) return;
    if (!sessionClient.data || !walletClient.data) return;
    if (rootPublishInFlightRef.current.has(post.id)) return;

    const payload = readAndClearAutoPublish(post.id);
    if (!payload) return;

    rootPublishInFlightRef.current.add(post.id);
    console.log(`[ThreadAutoPublish] firing publish for ${post.id}`);

    publishForumThreadToLens(
      post.id,
      {
        title: payload.title,
        summary: "",
        contentMarkdown: payload.contentMarkdown,
        contentJson: payload.contentJson,
        authorAddress: payload.authorAddress,
        boardSlug: payload.boardSlug,
        slug: payload.slug,
        tags: payload.tags,
      },
      sessionClient.data,
      walletClient.data,
    )
      .then((res) => {
        if (res.success) {
          toast.success("Published on-chain ✓");
          router.refresh();
        } else {
          toast.error("On-chain publish failed", {
            description: res.error || "You can retry from the post page.",
          });
        }
      })
      .catch((err) => {
        console.error("[ThreadAutoPublish] error:", err);
        toast.error("On-chain publish failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      })
      .finally(() => {
        rootPublishInFlightRef.current.delete(post.id);
      });
  }, [post.id, post.publishStatus, post.lensPostId, isAuthor, sessionClient.data, walletClient.data, router]);

  /** Manual recovery for stuck pending threads. First scans Lens for an
   *  existing post that matches this thread's slug (avoids creating a
   *  duplicate). If none exists, runs a fresh client-side Lens publish. */
  async function handleRetryRootPublish() {
    if (!account?.address || !sessionClient.data || !walletClient.data) {
      toast.error("Connect your wallet first");
      return;
    }
    if (rootPublishInFlightRef.current.has(post.id)) {
      toast.info("A publish is already in flight for this post");
      return;
    }
    setIsRetrying(true);
    rootPublishInFlightRef.current.add(post.id);
    try {
      const recovery = await tryRecoverForumThread(post.id);
      if (recovery.recovered) {
        toast.success("Found existing on-chain post — linked ✓");
        router.refresh();
        return;
      }
      if (!recovery.success) {
        // Lens scan failed — DO NOT republish. Republishing on transient
        // error risks creating a duplicate on-chain post.
        toast.error("Couldn't verify on-chain status", {
          description: (recovery.error || "Try again in a moment.") + " Not republishing to avoid duplicate.",
        });
        return;
      }
      // Scan succeeded and definitively found no match → safe to publish.
      const res = await publishForumThreadToLens(
        post.id,
        {
          title: post.title,
          summary: "",
          contentMarkdown: post.contentMarkdown || "",
          contentJson: post.contentJson,
          authorAddress: post.authorAddress,
          boardSlug: post.boardSlug || "",
          slug: post.slug || "",
          tags: post.tags || undefined,
        },
        sessionClient.data,
        walletClient.data,
      );
      if (res.success) {
        toast.success("Published on-chain ✓");
        router.refresh();
      } else {
        toast.error("Publish failed", { description: res.error || "Unknown error" });
      }
    } finally {
      setIsRetrying(false);
      rootPublishInFlightRef.current.delete(post.id);
    }
  }

  // Auto-retry: if the parent thread is now confirmed and there are pending
  // replies authored by the current user that never got their Lens publish
  // (no contentUri yet), kick off the publish now.
  useEffect(() => {
    if (post.publishStatus !== "confirmed" || !post.lensPostId) return;
    if (!account?.address || !sessionClient.data || !walletClient.data) return;

    const myStuckReplies = replies.filter(
      (r) =>
        r.publishStatus === "pending" &&
        !r.contentUri &&
        r.authorAddress.toLowerCase() === account.address.toLowerCase() &&
        !retriedRef.current.has(r.id),
    );

    for (const reply of myStuckReplies) {
      retriedRef.current.add(reply.id);
      console.log(`[ReplyRetry] auto-retrying reply ${reply.id}`);
      publishForumReplyToLens(
        reply.id,
        {
          threadId: post.id,
          contentMarkdown: reply.contentMarkdown || "",
          contentJson: reply.contentJson,
          authorAddress: account.address,
        },
        sessionClient.data,
        walletClient.data,
      ).catch((err) => {
        console.error(`[ReplyRetry] failed for ${reply.id}:`, err);
      });
    }
  }, [post.publishStatus, post.lensPostId, post.id, replies, account, sessionClient.data, walletClient.data]);

  // Poll for status updates while anything is still pending. As soon as Lens
  // confirms in the background, router.refresh() re-fetches server data and
  // the PublishStatusBadge flips from "Publishing..." to "✓ On-chain".
  // Capped at ~3 minutes (60 attempts × 3s) to avoid runaway polling.
  useEffect(() => {
    const hasPending =
      post.publishStatus === "pending" ||
      replies.some((r) => r.publishStatus === "pending");
    if (!hasPending) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 60;
    const interval = setInterval(() => {
      attempts += 1;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [post.publishStatus, replies, router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={`/boards/${post.boardSlug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to board
      </Link>

      {/* Thread title */}
      <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-gray-100">{post.title}</h1>

      {/* Recovery banner: stuck pending root post (author only) */}
      {post.publishStatus === "pending" && !post.lensPostId && isAuthor && (
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
          <span>
            This post is still pending on-chain. If the wallet popup never appeared (or was dismissed), retry the publish.
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isRetrying || !sessionClient.data || !walletClient.data}
            onClick={handleRetryRootPublish}
            className="shrink-0"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Checking…" : "Retry publish"}
          </Button>
        </div>
      )}

      {/* Stacked posts: root + replies */}
      <div className="space-y-4">
        {/* Root post */}
        <PostCard
          authorAddress={post.authorAddress}
          authorUsername={post.authorUsername}
          content={post.contentMarkdown || post.summary || ""}
          publishStatus={post.publishStatus}
          lensPostId={post.lensPostId}
          contentUri={post.contentUri}
          createdAt={post.createdAt}
          position={0}
          isRoot
          threadSlug={post.slug}
        />

        {/* Replies */}
        {replies.map((reply) => (
          <PostCard
            key={reply.id}
            authorAddress={reply.authorAddress}
            authorUsername={reply.authorUsername}
            content={reply.contentMarkdown || ""}
            publishStatus={reply.publishStatus}
            lensPostId={reply.lensPostId}
            contentUri={reply.contentUri}
            createdAt={reply.createdAt}
            position={reply.position}
            threadSlug={post.slug}
          />
        ))}
      </div>

      {/* Reply box */}
      {!post.isLocked && (
        <div className="mt-6">
          <BoardReplyBox postId={post.lensPostId || post.id} threadId={post.id} threadStatus={post.publishStatus} />
        </div>
      )}
    </div>
  );
}

/** A single post card in the stacked thread view */
function PostCard({
  authorAddress,
  authorUsername,
  content,
  publishStatus,
  lensPostId,
  contentUri,
  createdAt,
  position,
  isRoot,
  threadSlug,
}: {
  authorAddress: string;
  authorUsername: string | null;
  content: string;
  publishStatus: "pending" | "confirmed" | "failed";
  lensPostId: string | null;
  contentUri: string | null;
  createdAt: string;
  position: number;
  isRoot?: boolean;
  threadSlug: string | null;
}) {
  const authorName = authorUsername || authorAddress.slice(0, 8);
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
              {authorName[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-slate-800 dark:text-gray-200">{authorName}</span>
          <span className="text-xs text-gray-500">{timeAgo}</span>
          {!isRoot && (
            <span className="text-xs text-gray-400">#{position}</span>
          )}
        </div>
        <PublishStatusBadge
          status={publishStatus}
          lensPostId={lensPostId}
          contentUri={contentUri}
          threadSlug={threadSlug}
          replyPosition={isRoot ? null : position}
        />
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <div className="prose prose-slate max-w-none dark:prose-invert">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0 whitespace-pre-wrap">{children}</p>,
              br: () => <br />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Footer links: standalone article + raw Grove source (Fountain-style) */}
        {(() => {
          const articleUrl = isRoot
            ? getArticleUrl(threadSlug)
            : getReplyArticleUrl(threadSlug, position);
          const groveUrl = groveUriToHttpUrl(contentUri || "");
          if (!articleUrl && !groveUrl) return null;
          return (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 dark:border-gray-700/50">
              {articleUrl && (
                <Link
                  href={articleUrl}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  View as standalone article
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {groveUrl && (
                <a
                  href={groveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Raw Lens article metadata on Grove"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 hover:underline dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Source on Grove
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
