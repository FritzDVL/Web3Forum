"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useSessionClient } from "@lens-protocol/react";
import { useWalletClient } from "wagmi";
import { Address } from "@/types/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TextEditor } from "@/components/editor/text-editor";
import { createFeedReply } from "@/lib/services/feed/create-feed-reply";
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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { account } = useAuthStore();
  const sessionClient = useSessionClient();
  const walletClient = useWalletClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!sessionClient.data || !walletClient.data || !account) {
      toast.error("Please connect your wallet and sign in");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating your reply...");

    try {
      // Combine title and content for the article
      const fullContent = `# ${title}\n\n${content}`;

      const result = await createFeedReply(
        feedId,
        parentPostId,
        fullContent,
        feedAddress,
        account.address,
        sessionClient.data,
        walletClient.data
      );

      if (result.success) {
        toast.success("Reply created successfully!");
        
        await revalidateFeedPostPath(feedAddress, parentPostId);
        await revalidateFeedPath(feedAddress);
        
        router.push(`/commons/${feedAddress}/post/${parentPostId}`);
      } else {
        toast.error("Failed to create reply", { description: result.error });
      }
    } catch (error) {
      console.error("Error creating reply:", error);
      toast.error("Failed to create reply");
    } finally {
      toast.dismiss(loadingToast);
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Complete Reply</CardTitle>
        <CardDescription>
          Replying to: <span className="font-medium text-slate-900 dark:text-gray-100">{parentPostTitle}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Give your reply a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <TextEditor
              onChange={setContent}
              placeholder="Write your reply..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || isSubmitting}
              className="gradient-button"
            >
              {isSubmitting ? "Creating..." : "Create Reply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
