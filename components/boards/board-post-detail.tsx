"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { BoardReplyBox } from "./board-reply-box";
import { ForumThread, ForumReply } from "@/lib/domain/forum/types";
import { PublishStatusBadge } from "@/components/shared/publish-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BoardPostDetailProps {
  post: ForumThread;
  replies: ForumReply[];
}

export function BoardPostDetail({ post, replies }: BoardPostDetailProps) {
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/posts/${post.id}/view`, { method: "POST" }).catch(() => {});
  }, [post.id]);

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
          />
        ))}
      </div>

      {/* Reply box */}
      {!post.isLocked && (
        <div className="mt-6">
          <BoardReplyBox postId={post.lensPostId || post.id} threadId={post.id} />
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
      </div>
    </div>
  );
}
