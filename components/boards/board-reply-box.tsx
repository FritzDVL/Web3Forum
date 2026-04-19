"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextEditor } from "@/components/editor/text-editor";
import { saveForumReply, publishForumReplyToLens } from "@/lib/services/forum/publish-reply";
import { updateForumReplyStatus } from "@/lib/external/supabase/forum-replies";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

interface BoardReplyBoxProps {
  postId: string;
  threadId: string;
}

export function BoardReplyBox({ postId, threadId }: BoardReplyBoxProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const { isLoggedIn, account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!account?.address) {
      toast.error("Please sign in to reply");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Save to Supabase instantly
      const saveResult = await saveForumReply({
        threadId,
        contentMarkdown: content,
        contentJson: null,
        authorAddress: account.address,
      });

      if (!saveResult.success || !saveResult.replyId) {
        toast.error(saveResult.error || "Failed to post reply");
        return;
      }

      toast.success("Reply posted! Publishing on-chain in background...");

      // Step 2: Fire Lens publish in the BACKGROUND. Don't wait — the user
      // sees the reply instantly via Supabase; the badge will update when Lens confirms.
      if (sessionClient.data && walletClient.data) {
        publishForumReplyToLens(
          saveResult.replyId,
          {
            threadId,
            contentMarkdown: content,
            contentJson: null,
            authorAddress: account.address,
          },
          sessionClient.data,
          walletClient.data,
        )
          .then((res) => {
            if (res.success) toast.success("Reply published on-chain ✓");
            else toast.info("Reply saved. On-chain publish can be retried.");
          })
          .catch((err) => {
            console.error("[Reply] Lens publish error:", err);
            toast.info("Reply saved. On-chain publish can be retried.");
          });
      } else {
        // No wallet → mark reply as failed so the badge shows "Off-chain"
        // and the polling on the detail page can stop.
        updateForumReplyStatus(saveResult.replyId, "failed").catch(() => {});
        toast.info("Wallet not connected — reply saved off-chain only.");
      }

      setContent("");
      setEditorKey((prev) => prev + 1);

      // Refresh server data (re-fetch replies) WITHOUT unmounting the React tree,
      // so the in-flight Lens publish promise above keeps running.
      router.refresh();
    } catch (error) {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">Please sign in to reply.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 items-start space-x-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={account?.metadata?.picture} />
        <AvatarFallback className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {account?.username?.localName?.[0]?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-3">
        <TextEditor key={editorKey} onChange={setContent} />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            className="gradient-button h-8 text-sm"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? "Replying..." : (
              <>
                <MessageCircle className="mr-2 h-3 w-3" />
                Reply
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
