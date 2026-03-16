"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye, ArrowLeft } from "lucide-react";
import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { BoardPostVoting } from "./board-post-voting";
import { BoardReplyList } from "./board-reply-list";
import { BoardReplyBox } from "./board-reply-box";
import { LikeButton } from "@/components/ui/like-button";
import { BoardPost } from "@/lib/domain/boards/types";
import { Reply } from "@/lib/domain/replies/types";
import { stripThreadArticleFormatting } from "@/lib/domain/threads/content";
import { Address } from "@/types/common";
import { PostId } from "@lens-protocol/client";

interface BoardPostDetailProps {
  post: BoardPost;
  replies: Reply[];
}

export function BoardPostDetail({ post, replies }: BoardPostDetailProps) {
  const [viewsCount, setViewsCount] = useState(post.viewsCount);
  const authorName = post.author.username?.localName || post.author.address.slice(0, 8);
  const authorHandle = post.author.username?.value || `@${post.author.address.slice(0, 6)}`;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const rawContent = (post.rootPost.metadata as any)?.content || post.summary || "No content available";
  const content = stripThreadArticleFormatting(rawContent);

  useEffect(() => {
    async function trackView() {
      try {
        const response = await fetch(`/api/posts/${post.rootPost.id}/view`, { method: "POST" });
        if (response.ok) setViewsCount((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    }
    trackView();
  }, [post.rootPost.id]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={`/boards/${post.board.feedAddress}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to board
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Post Header */}
        <div className="border-b border-slate-200 p-6 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <BoardPostVoting lensPostId={post.rootPost.id} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">{post.title}</h1>
              <div className="mt-4 flex items-center gap-3">
                <AvatarProfileLink author={post.author} />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{authorName}</span>
                  <span className="ml-2 text-sm text-gray-500">{authorHandle}</span>
                </div>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{timeAgo}</span>
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.repliesCount} replies</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{viewsCount} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="p-6">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0 whitespace-pre-wrap">{children}</p>,
                br: () => <br />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Reply Section */}
        <div className="p-6">
          <hr className="mb-6 border-slate-200 dark:border-gray-700" />

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
              {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
            </h2>
            <LikeButton postid={post.rootPost.id as PostId} />
          </div>

          <div className="mb-6">
            <BoardReplyBox postId={post.rootPost.id} feedAddress={post.board.feedAddress as Address} />
          </div>

          <BoardReplyList
            replies={replies}
            boardFeedAddress={post.board.feedAddress}
            rootPostId={post.rootPost.id}
          />
        </div>
      </div>
    </div>
  );
}
