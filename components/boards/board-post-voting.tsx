"use client";

import { ReplyVoting } from "@/components/reply/reply-voting";
import { postId, PostId } from "@lens-protocol/client";

interface BoardPostVotingProps {
  lensPostId: string;
}

export function BoardPostVoting({ lensPostId }: BoardPostVotingProps) {
  return <ReplyVoting postid={postId(lensPostId) as PostId} />;
}
