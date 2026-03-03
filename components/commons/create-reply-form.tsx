"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Address } from "@/types/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TextEditor } from "@/components/editor/text-editor";
import { useFeedReplyCreate } from "@/hooks/feeds/use-feed-reply-create";
import { revalidateFeedPostPath, revalidateFeedPath } from "@/app/actions/revalidate-path";
import { toast } from "sonner";

interface CreateReplyFormProps {
  feedId: string;
  feedAddress: Address;
  parentPostId: string;
  parentPostTitle: string;
}

export function CreateReplyForm({ 
  feedId, 
  feedAddress, 
  parentPostId,
  parentPostTitle 
}: CreateReplyFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createReply } = useFeedReplyCreate();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Please write your reply");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating your reply...");

    try {
      const reply = await createReply(feedId, parentPostId, content, feedAddress);

      if (reply) {
        toast.success("Reply created successfully!");
        
        await revalidateFeedPostPath(feedAddress, parentPostId);
        await revalidateFeedPath(feedAddress);
        
        router.push(`/commons/${feedAddress}/post/${parentPostId}`);
      }
    } catch (error) {
      console.error("[CreateReplyForm] Error:", error);
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Replying to</span>
          <span className="font-medium text-slate-900 dark:text-gray-100">{parentPostTitle}</span>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextEditor
            onChange={setContent}
            placeholder="Write your reply... (Markdown supported)"
          />

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="gradient-button"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Posting...
                </>
              ) : (
                "Post Reply"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
