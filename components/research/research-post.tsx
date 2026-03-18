"use client";

import { ResearchPublication } from "@/lib/domain/research/types";
import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { useVoting } from "@/hooks/common/use-voting";
import { useAuthStore } from "@/stores/auth-store";
import { getReplyContent } from "@/lib/domain/replies/content";
import { getTimeAgo } from "@/lib/shared/utils";
import { Button } from "@/components/ui/button";
import { Heart, Link2, MessageCircle } from "lucide-react";
import { postId } from "@lens-protocol/client";
import { toast } from "sonner";

interface ResearchPostProps {
  publication: ResearchPublication;
  threadId: string;
  onReply: (quotedText: string, authorName: string) => void;
}

export function ResearchPost({ publication, threadId, onReply }: ResearchPostProps) {
  const author = publication.post.author;
  const authorName = author.username?.localName || author.address.slice(0, 8);
  const timeAgo = getTimeAgo(new Date(publication.createdAt));
  const { content, image, video } = getReplyContent(publication.post);
  const { isLoggedIn } = useAuthStore();

  const { hasUserUpvoted, isLoading, scoreState, handleUpvote } = useVoting({
    postid: postId(publication.lensPostId),
    upvoteLabel: "Heart",
  });

  const handleReply = () => {
    const quoteText = content.slice(0, 300) + (content.length > 300 ? "..." : "");
    onReply(quoteText, authorName);
  };

  const handlePermalink = () => {
    const url = `${window.location.origin}/research/thread/${threadId}#post-${publication.postNumber}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  return (
    <div className="border-b border-slate-200 p-6 last:border-b-0 dark:border-gray-700" id={`post-${publication.postNumber}`}>
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarProfileLink author={author} />
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {author.metadata?.name || authorName}
              </span>
              <span className="ml-2 text-sm text-gray-500">@{authorName}</span>
            </div>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-500">{timeAgo}</span>
          </div>
          <span className="text-sm font-medium text-gray-400">#{publication.postNumber}</span>
        </div>

        <ContentRenderer
          content={{ content, image, video }}
          className="prose prose-slate max-w-none dark:prose-invert"
        />

        <div className="mt-4 flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpvote}
            disabled={isLoading === "up" || !isLoggedIn}
            className={`text-xs ${hasUserUpvoted ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}
          >
            <Heart className={`mr-1 h-3.5 w-3.5 ${hasUserUpvoted ? "fill-current" : ""}`} />
            {scoreState > 0 && scoreState}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePermalink}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReply}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            <MessageCircle className="mr-1 h-3.5 w-3.5" />
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}
