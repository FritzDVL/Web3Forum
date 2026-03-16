"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TextEditor } from "@/components/editor/text-editor";
import { useReplyCreate } from "@/hooks/replies/use-reply-create";
import { useAuthStore } from "@/stores/auth-store";
import { Address } from "@/types/common";
import { MessageCircle } from "lucide-react";

interface BoardReplyBoxProps {
  postId: string;
  feedAddress: Address;
}

export function BoardReplyBox({ postId, feedAddress }: BoardReplyBoxProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const { isLoggedIn, account } = useAuthStore();
  const { createReply } = useReplyCreate();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const reply = await createReply(postId, content, feedAddress, postId);
      if (reply) {
        setContent("");
        setEditorKey((prev) => prev + 1);
        router.refresh();
      }
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
