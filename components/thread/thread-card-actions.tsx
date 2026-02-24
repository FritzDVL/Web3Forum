"use client";

import React, { useEffect, useState } from "react";
import { ThreadReplyBox } from "./thread-reply-box";
import { revalidateCommunityPath, revalidateThreadPath } from "@/app/actions/revalidate-path";
import { TipGhoPopover } from "@/components/shared/tip-gho-popover";
import { ThreadShareDialog } from "@/components/thread/thread-share-dialog";
import { ThreadVoting } from "@/components/thread/thread-voting";
import { Button } from "@/components/ui/button";
import { useReplyCreate } from "@/hooks/replies/use-reply-create";
import { Community } from "@/lib/domain/communities/types";
import { getThreadTitleAndSummary } from "@/lib/domain/threads/content";
import { Thread } from "@/lib/domain/threads/types";
import { APP_URL } from "@/lib/shared/constants";
import { useAuthStore } from "@/stores/auth-store";
import { fetchPost } from "@lens-protocol/client/actions";
import { Post, postId, useSessionClient } from "@lens-protocol/react";
import { Coins, Reply as ReplyIcon, Share } from "lucide-react";

interface ThreadCardActionsProps {
  thread: Thread;
  community: Community;
}

export function ThreadCardActions({ thread, community }: ThreadCardActionsProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [canTip, setCanTip] = useState<boolean>(false);
  const [canReply, setCanReply] = useState<boolean>(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const threadPostId = thread.rootPost?.id;
  const { createReply } = useReplyCreate();
  const { isLoggedIn } = useAuthStore();
  const sessionClient = useSessionClient();

  useEffect(() => {
    const doFetchRootPostOps = async () => {
      if (sessionClient.data && !sessionClient.loading) {
        const rootPostResult = await fetchPost(sessionClient.data, {
          post: thread.rootPost.id,
        });

        if (rootPostResult.isErr()) {
          console.error("Error fetching root post operations:", rootPostResult.error);
        } else {
          const post = rootPostResult.value as Post;
          setCanReply(post.operations?.canComment.__typename === "PostOperationValidationPassed");
          setCanTip(!!post.operations?.canTip);
        }
      }
    };

    doFetchRootPostOps();
  }, [thread.rootPost.id, sessionClient.data, sessionClient.loading, community]);

  const handleReply = async () => {
    if (!thread || !thread.rootPost || !thread.rootPost.id) return;
    if (replyingTo && replyContent[replyingTo]) {
      const reply = await createReply(
        thread.rootPost.id,
        replyContent[replyingTo],
        thread.rootPost.feed.address,
        thread.id,
      );
      if (reply) {
        setReplyingTo(null);
        setReplyContent(c => ({ ...c, [replyingTo]: "" }));
        revalidateThreadPath(thread.rootPost.slug);
        revalidateCommunityPath(thread.community);
      }
    }
  };

  // Default share logic if not provided
  const handleShare = () => {
    setShareDialogOpen(true);
  };

  // Handler for posting to Lens (to be implemented)
  const handlePostToLens = async () => {
    if (!thread) return;

    const { title } = getThreadTitleAndSummary(thread.rootPost);
    const url = `${APP_URL}/thread/${thread.rootPost.slug}`;

    const shareText = `Check out this thread on LensForum: "${title}"\n\n`;
    window.open(`https://hey.xyz/?text=${shareText}&url=${url}`, "_blank");
  };

  const threadUrl = `${APP_URL}/thread/${thread.rootPost.slug}`;

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Stats Tips */}
        <div className="flex items-center justify-start gap-4 text-muted-foreground sm:flex-1">
          <div className="flex items-center gap-1">
            <Coins className="h-4 w-4" />
            <span className="text-sm">{thread.rootPost?.stats.tips}</span>
          </div>
        </div>
        {/* Center: ThreadVoting */}
        <div className="mt-2 flex items-center justify-start sm:mt-0 sm:flex-1 sm:justify-center">
          {threadPostId && <ThreadVoting postid={postId(threadPostId)} />}
        </div>
        {/* Right: Join Community, Reply, Tip, Share */}
        <div className="mt-2 flex w-full items-center justify-start gap-2 sm:mt-0 sm:w-auto sm:flex-1 sm:justify-end">
          {canReply && (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => setReplyingTo("main")}
              disabled={!isLoggedIn}
            >
              <ReplyIcon className="mr-2 h-4 w-4" />
              Reply
            </Button>
          )}
          {canTip && (
            <div className="min-w-0">
              <TipGhoPopover to={threadPostId} />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="min-w-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Share className="mr-2 h-4 w-4" />
            <span className="truncate">Share</span>
          </Button>
          <ThreadShareDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            threadUrl={threadUrl}
            onPostToLens={handlePostToLens}
          />
        </div>
      </div>
      {/* Reply Box (always below actions row) */}
      {replyingTo === "main" && (
        <>
          <div className="mt-6 w-full border-t border-border" />
          <div className="mt-4 w-full">
            <ThreadReplyBox
              value={replyContent["main"] || ""}
              onCancel={() => {
                setReplyingTo(null);
                setReplyContent(c => ({ ...c, main: "" }));
              }}
              onSubmit={handleReply}
              onChange={val => setReplyContent(c => ({ ...c, main: val }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
