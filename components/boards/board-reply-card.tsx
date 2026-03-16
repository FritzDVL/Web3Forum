"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { ReplyVoting } from "@/components/reply/reply-voting";
import { Reply } from "@/lib/domain/replies/types";
import { getReplyContent } from "@/lib/domain/replies/content";
import { useReplyCreate } from "@/hooks/replies/use-reply-create";
import { getRepliesByParentId } from "@/lib/services/reply/get-replies-by-parent-id";
import { getTimeAgo } from "@/lib/shared/utils";
import { postId, useSessionClient } from "@lens-protocol/react";
import { Address } from "@/types/common";
import { MessageCircle } from "lucide-react";

interface BoardReplyCardProps {
  reply: Reply;
  boardFeedAddress: string;
  rootPostId: string;
}

export function BoardReplyCard({ reply, boardFeedAddress, rootPostId }: BoardReplyCardProps) {
  const { content, image, video } = getReplyContent(reply.post);

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(reply.post.stats.comments);

  useEffect(() => {
    setLocalReplyCount(reply.post.stats.comments);
  }, [reply.post.stats.comments]);

  const { createReply } = useReplyCreate();
  const sessionClient = useSessionClient();

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await createReply(reply.id, replyContent, boardFeedAddress as Address, rootPostId);
    setReplyContent("");
    setShowReplyBox(false);
    setLocalReplyCount((c) => c + 1);
  };

  const handleLoadReplies = async () => {
    if (loadingReplies) return;
    setLoadingReplies(true);
    try {
      const result = await getRepliesByParentId(reply.post.id, sessionClient.data ?? undefined);
      if (result.success) {
        setReplies(result.replies ?? []);
      }
      setShowReplies(true);
    } catch (error) {
      console.error("Failed to load replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const canReply = reply.post.operations?.canComment.__typename === "PostOperationValidationPassed";

  return (
    <div className="space-y-2" id={reply.id}>
      <div className="rounded-lg bg-white p-3 shadow-sm dark:border-gray-700/60 dark:bg-gray-800 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Voting */}
          <div className="flex flex-col items-center">
            <ReplyVoting postid={postId(reply.id)} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Author row */}
            <div className="mb-3 flex items-center justify-between">
              <Link
                href={`/u/${reply.post.author.username?.value}`}
                className="flex items-center gap-2 hover:text-gray-900"
              >
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                  <AvatarImage src={reply.post.author.metadata?.picture} />
                  <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                    {reply.post.author.metadata?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {reply.post.author.metadata?.name || reply.post.author.username?.localName}
                </span>
              </Link>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {getTimeAgo(new Date(reply.post.timestamp))}
              </span>
            </div>

            {/* Content */}
            <ContentRenderer content={{ content, image, video }} className="rich-text-content mb-2" />

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {localReplyCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadReplies}
                    disabled={loadingReplies}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="mr-1 h-3 w-3" />
                    {loadingReplies ? "Loading..." : `${localReplyCount} ${localReplyCount === 1 ? "reply" : "replies"}`}
                  </Button>
                )}
              </div>
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyBox(true)}
                  className="h-auto p-1 text-xs"
                >
                  <MessageCircle className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}
            </div>

            {/* Inline reply box */}
            {showReplyBox && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full rounded-md border p-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                    Post
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowReplyBox(false); setReplyContent(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {showReplies && replies.length > 0 && (
              <div className="ml-6 mt-2 space-y-2">
                {replies.map((nestedReply) => (
                  <BoardReplyCard
                    key={nestedReply.id}
                    reply={nestedReply}
                    boardFeedAddress={boardFeedAddress}
                    rootPostId={rootPostId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
