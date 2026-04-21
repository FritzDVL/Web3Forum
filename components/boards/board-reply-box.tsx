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
  /** Parent thread publish status — used to surface a helpful note if it's still pending. */
  threadStatus?: "pending" | "confirmed" | "failed";
}

export function BoardReplyBox({ postId, threadId, threadStatus }: BoardReplyBoxProps) {
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
      if (!sessionClient.data) {
        toast.info("Reply saved. Sign in to Lens to publish on-chain.");
      } else if (!walletClient.data) {
        toast.info("Reply saved. Connect your wallet to publish on-chain.");
      } else {
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
            if (res.success) {
              toast.success("Reply published on-chain ✓");
            } else if (res.retryable) {
              // Parent thread still confirming. Reply stays pending; the
              // detail page poll will pick it up and re-publish once the
              // parent confirms.
              toast.info(
                "Reply saved. Will publish to Lens once the original post finishes confirming.",
              );
            } else {
              console.error("[Reply] Lens publish failed:", res.error);
              toast.error(`On-chain publish failed: ${res.error || "unknown error"}`);
            }
          })
          .catch((err) => {
            console.error("[Reply] Lens publish error:", err);
            toast.error(`On-chain publish error: ${err?.message || "unknown"}`);
          });
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
        {threadStatus === "pending" && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
            The original post is still confirming on-chain. Your reply will be
            saved immediately and published to Lens automatically once the
            parent post finishes.
          </div>
        )}
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
