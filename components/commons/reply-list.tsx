"use client";

import { Reply } from "@/lib/services/feed/get-feed-replies";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Address } from "@/types/common";
import { LikeButton } from "@/components/ui/like-button";
import { PostId } from "@lens-protocol/client";

interface ReplyListProps {
  replies: Reply[];
  feedAddress: Address;
  parentPostId: string;
}

export function ReplyList({ replies, feedAddress, parentPostId }: ReplyListProps) {
  if (replies.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No replies yet. Be the first to reply!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-gray-700">
      {replies.map((reply) => {
        const authorName = reply.author.username || reply.author.address.slice(0, 8);
        const authorHandle = reply.author.handle || `@${reply.author.address.slice(0, 6)}`;
        const timeAgo = formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true });

        return (
          <div key={reply.id} className="space-y-3 py-5">
            {/* Reply Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                  {authorName[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 dark:text-gray-100">{authorName}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{authorHandle}</span>
                </div>
              </div>
              <span className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{timeAgo}</span>
            </div>

            {/* Reply Content */}
            <div className="prose prose-sm prose-slate max-w-none dark:prose-invert prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                  br: () => <br />,
                }}
              >
                {reply.content}
              </ReactMarkdown>
            </div>

            {/* Reply Footer */}
            <div className="flex items-center justify-end gap-3">
              <LikeButton postid={reply.id as PostId} />
              <Link
                href={`/commons/${feedAddress}/post/${reply.id}/reply`}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <MessageCircle className="h-4 w-4" />
                Reply
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
