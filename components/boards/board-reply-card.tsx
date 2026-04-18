"use client";

import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ForumReply } from "@/lib/domain/forum/types";
import { getTimeAgo } from "@/lib/shared/utils";

interface BoardReplyCardProps {
  reply: ForumReply;
}

export function BoardReplyCard({ reply }: BoardReplyCardProps) {
  const authorName = reply.authorUsername || reply.authorAddress.slice(0, 8);
  const content = reply.contentMarkdown || "No content available";

  return (
    <div className="space-y-2" id={reply.id}>
      <div className="rounded-lg bg-white p-3 shadow-sm dark:border-gray-700/60 dark:bg-gray-800 sm:p-4">
        <div className="min-w-0 flex-1">
          {/* Author row */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                  {authorName[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground">{authorName}</span>
              <span className="text-xs text-muted-foreground">#{reply.position}</span>
            </div>
            <span className="text-xs text-muted-foreground sm:text-sm">
              {getTimeAgo(new Date(reply.createdAt))}
            </span>
          </div>

          {/* Content */}
          <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
