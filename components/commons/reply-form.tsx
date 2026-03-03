"use client";

import { useState } from "react";
import { Address } from "@/types/common";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { TextEditor } from "@/components/editor/text-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { revalidateFeedPostPath, revalidateFeedPath } from "@/app/actions/revalidate-path";
import { createFeedReply } from "@/lib/services/feed/create-feed-reply";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { toast } from "sonner";

interface ReplyFormProps {
  feedId: string;
  postId: string;
  feedAddress: Address;
}

export function ReplyForm({ feedId, postId, feedAddress }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const { isLoggedIn, account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    if (!sessionClient.data || !walletClient.data || !account) {
      toast.error("Please connect your wallet and sign in");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Posting your reply...");

    try {
      const result = await createFeedReply(
        feedId,
        postId,
        content,
        feedAddress,
        account.address,
        sessionClient.data,
        walletClient.data
      );

      if (result.success) {
        toast.success("Reply posted!");
        setContent("");
        setEditorKey(prev => prev + 1);
        
        // Revalidate paths
        await revalidateFeedPostPath(feedAddress, postId);
        await revalidateFeedPath(feedAddress);
        
        // Refresh to show new reply
        router.refresh();
      } else {
        toast.error("Failed to post reply", { description: result.error });
      }
    } catch (error) {
      console.error("Error creating reply:", error);
      toast.error("Failed to post reply");
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please sign in to reply to this post.
        </p>
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
        <div className="w-full min-w-0">
          <TextEditor key={editorKey} onChange={setContent} />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            className="gradient-button h-8 text-sm"
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="loader mr-2 h-3 w-3 animate-spin rounded-full border-2 border-t-2 border-gray-300 border-t-blue-500" />
                Replying...
              </span>
            ) : (
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
