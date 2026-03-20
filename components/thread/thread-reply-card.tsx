"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LikeButton } from "@/components/ui/like-button";
import { ThreadReplyBox } from "./thread-reply-box";
import { ThreadReplyModeratorActions } from "./thread-reply-moderator-actions";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { ThreadReplyActions } from "@/components/thread/thread-reply-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReplyCreate } from "@/hooks/replies/use-reply-create";
import { Community } from "@/lib/domain/communities/types";
import { getReplyContent } from "@/lib/domain/replies/content";
import { Reply } from "@/lib/domain/replies/types";
import { Thread } from "@/lib/domain/threads/types";
import { getRepliesByParentId } from "@/lib/services/reply/get-replies-by-parent-id";
import { getTimeAgo } from "@/lib/shared/utils";
import { postId, useSessionClient } from "@lens-protocol/react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface ThreadReplyCardProps {
  reply: Reply;
  thread: Thread;
  community?: Community;
}

export function ThreadReplyCard({ reply, thread, community }: ThreadReplyCardProps) {
  const { content, image, video } = getReplyContent(reply.post);
  const threadAddress = thread.rootPost.feed.address;

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [localReplyCount, setLocalReplyCount] = useState(reply.post.stats.comments);
  const [showPlusOne, setShowPlusOne] = useState(false);

  useEffect(() => {
    setLocalReplyCount(reply.post.stats.comments);
  }, [reply.post.stats.comments]);

  const { createReply } = useReplyCreate();
  const sessionClient = useSessionClient();

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await createReply(reply.id, replyContent, threadAddress, thread.id);
      setReplyContent("");
      setShowReplyBox(false);
      setLocalReplyCount(c => c + 1);
      setShowPlusOne(true);
    } finally {
    }
  };

  const handleLoadReplies = async () => {
    if (loadingReplies) return;

    setLoadingReplies(true);
    setRepliesError(null);
    try {
      const result = await getRepliesByParentId(reply.post.id, sessionClient.data ?? undefined);
      if (result.success) {
        setReplies(result.replies ?? []);
      } else {
        setRepliesError(result.error || "Failed to load replies.");
      }
      setShowReplies(true);
    } catch (error) {
      setRepliesError("Failed to load replies.");
      console.error("Failed to load replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    if (showPlusOne) {
      const timeout = setTimeout(() => setShowPlusOne(false), 900);
      return () => clearTimeout(timeout);
    }
  }, [showPlusOne]);

  const canReply = reply.post.operations?.canComment.__typename === "PostOperationValidationPassed";

  return (
    <div className="space-y-2" id={reply.id}>
      <Card className="rounded-lg bg-white shadow-sm dark:border-gray-700/60 dark:bg-gray-800">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              {/* Top row: author info and show context button at top right */}
              <div className="relative mb-3 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:items-center sm:gap-2">
                <div className="flex w-full items-center justify-between gap-2">
                  <Link
                    href={`/u/${reply.post.author.username?.value}`}
                    className="flex items-center gap-2 hover:text-gray-900"
                  >
                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                      <AvatarImage src={reply.post.author.metadata?.picture} />
                      <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                        {reply.post.author.metadata?.name?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{reply.post.author.metadata?.name}</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    {community && <ThreadReplyModeratorActions reply={reply} community={community} />}
                    <span className="text-xs text-muted-foreground sm:text-sm">
                      {getTimeAgo(new Date(reply.post.timestamp))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <ContentRenderer content={{ content, image, video }} className="rich-text-content mb-2" />
              {/* Reply button and tip button bottom */}
              <div className="mt-3 flex flex-row items-center justify-between gap-2">
                <div className="relative flex items-center gap-2">
                  <AnimatePresence>
                    {showPlusOne && (
                      <motion.span
                        initial={{ opacity: 0, y: -16, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1.1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.8 }}
                        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                        className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-500"
                        style={{ zIndex: 10 }}
                      >
                        +1
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {localReplyCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLoadReplies}
                      disabled={loadingReplies}
                      className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <MessageCircle className="mr-1 h-3 w-3" />
                      {loadingReplies
                        ? "Loading..."
                        : `${localReplyCount} ${localReplyCount === 1 ? "reply" : "replies"}`}
                    </Button>
                  )}
                </div>
                <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
                  <ThreadReplyActions
                    replyId={reply.id}
                    setReplyingTo={() => setShowReplyBox(true)}
                    canReply={canReply}
                  />
                  <LikeButton postid={postId(reply.id)} />
                </div>
              </div>
              {showReplyBox && (
                <ThreadReplyBox
                  value={replyContent}
                  onCancel={() => {
                    setShowReplyBox(false);
                    setReplyContent("");
                  }}
                  onSubmit={handleReply}
                  onChange={setReplyContent}
                />
              )}
              {showReplies && (
                <div className="ml-6 mt-2 space-y-2">
                  {repliesError && <div className="text-xs text-red-500">{repliesError}</div>}
                  {replies.length === 0 && !repliesError && (
                    <div className="text-xs text-muted-foreground">No replies yet.</div>
                  )}
                  {replies.map(nestedReply => (
                    <ThreadReplyCard key={nestedReply.id} reply={nestedReply} thread={thread} community={community} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
