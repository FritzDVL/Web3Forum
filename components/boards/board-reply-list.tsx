"use client";

import { Reply } from "@/lib/domain/replies/types";
import { BoardReplyCard } from "./board-reply-card";

interface BoardReplyListProps {
  replies: Reply[];
  boardFeedAddress: string;
  rootPostId: string;
}

export function BoardReplyList({ replies, boardFeedAddress, rootPostId }: BoardReplyListProps) {
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
        <BoardReplyCard
          key={reply.id}
          reply={reply}
          boardFeedAddress={boardFeedAddress}
          rootPostId={rootPostId}
        />
      ))}
    </div>
  );
}
