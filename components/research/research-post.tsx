"use client";

import { ResearchPublication } from "@/lib/domain/research/types";
import { AvatarProfileLink } from "@/components/notifications/avatar-profile-link";
import { ContentRenderer } from "@/components/shared/content-renderer";
import { ReplyVoting } from "@/components/reply/reply-voting";
import { getReplyContent } from "@/lib/domain/replies/content";
import { getTimeAgo } from "@/lib/shared/utils";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { postId } from "@lens-protocol/client";

interface ResearchPostProps {
  publication: ResearchPublication;
  onReply: (quotedText: string, authorName: string) => void;
}

export function ResearchPost({ publication, onReply }: ResearchPostProps) {
  const author = publication.post.author;
  const authorName = author.username?.localName || author.address.slice(0, 8);
  const timeAgo = getTimeAgo(new Date(publication.createdAt));
  const { content, image, video } = getReplyContent(publication.post);

  const handleReply = () => {
    const quoteText = content.slice(0, 300) + (content.length > 300 ? "..." : "");
    onReply(quoteText, authorName);
  };

  return (
    <div className="border-b border-slate-200 p-6 last:border-b-0 dark:border-gray-700" id={`post-${publication.postNumber}`}>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center pt-1">
          <ReplyVoting postid={postId(publication.lensPostId)} />
        </div>

        <div className="min-w-0 flex-1">
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

          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReply}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <MessageCircle className="mr-1 h-3 w-3" />
              Reply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
