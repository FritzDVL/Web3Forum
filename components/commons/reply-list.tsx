"use client";

import { Reply } from "@/lib/services/feed/get-feed-replies";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

interface ReplyListProps {
  replies: Reply[];
}

export function ReplyList({ replies }: ReplyListProps) {
  if (replies.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No replies yet. Be the first to reply!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {replies.map((reply) => {
        const authorName = reply.author.username || reply.author.address.slice(0, 8);
        const authorHandle = reply.author.handle || `@${reply.author.address.slice(0, 6)}`;
        const timeAgo = formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true });

        return (
          <div
            key={reply.id}
            className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Reply Header */}
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {authorName}
              </span>
              <span>{authorHandle}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>

            {/* Reply Content */}
            <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
              <ReactMarkdown>{reply.content}</ReactMarkdown>
            </div>

            {/* Nested replies indicator (if any) */}
            {reply.repliesCount > 0 && (
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {reply.repliesCount} {reply.repliesCount === 1 ? "reply" : "replies"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
