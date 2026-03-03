"use client";

import React, { useState } from "react";
import { revalidateCommunityPath, revalidateThreadPath } from "@/app/actions/revalidate-path";
import { ThreadReplyBox } from "@/components/thread/thread-reply-box";
import { Button } from "@/components/ui/button";
import { useReplyCreate } from "@/hooks/replies/use-reply-create";
import { Thread } from "@/lib/domain/threads/types";
import { useAuthStore } from "@/stores/auth-store";
import { Reply as ReplyIcon } from "lucide-react";

interface ThreadCardReplyBoxProps {
  thread: Thread;
}

export function ThreadCardReplyBox({ thread }: ThreadCardReplyBoxProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const { createReply } = useReplyCreate();
  const { isLoggedIn } = useAuthStore();

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
        revalidateThreadPath(thread.rootPost.feed.address);
        revalidateCommunityPath(thread.community);
      }
    }
  };

  return (
    <div className="mt-4">
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
      {replyingTo === "main" && (
        <ThreadReplyBox
          value={replyContent["main"] || ""}
          onCancel={() => {
            setReplyingTo(null);
            setReplyContent(c => ({ ...c, main: "" }));
          }}
          onSubmit={handleReply}
          onChange={val => setReplyContent(c => ({ ...c, main: val }))}
        />
      )}
    </div>
  );
}
