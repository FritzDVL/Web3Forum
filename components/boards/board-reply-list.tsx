"use client";

import { ForumReply } from "@/lib/domain/forum/types";
import { BoardReplyCard } from "./board-reply-card";

interface BoardReplyListProps {
  replies: ForumReply[];
  boardSlug: string;
}

export function BoardReplyList({ replies, boardSlug }: BoardReplyListProps) {
  if (replies.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No replies yet. Be the first to reply!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <BoardReplyCard key={reply.id} reply={reply} />
      ))}
    </div>
  );
}
